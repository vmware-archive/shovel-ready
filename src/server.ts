import * as mysql from 'mysql';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as retro from './core/retro';
import * as dateFormatter from 'date-format';
import * as ObjectId from 'node-time-uuid';

const connection = mysql.createConnection({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'ref_arch_02',
});

const createRetro = (event: retro.RetroCreated) => {
    return query(
        connection,
        'INSERT INTO retros VALUES (UNHEX(?), ?)',
        [event.retroId, event.retroName],
    );
};

type TransactionalHandler = (event: retro.Event, nextVersion: number) => Promise<any>;
interface TransactionalHandlersMap {
    [eventName: string]: TransactionalHandler[]
}

const transactionalSideEffects: TransactionalHandlersMap = {
    retroCreated: [createRetro],
};

const insertEvent = mysqlMakeInsertEventFn(connection);
const loadRetroState = mysqlMakeLoadRetroStateFn(connection, retro.eventHandlers);
const transactor = makeTransactionMakerFn(connection);
const commandHandler = makeCommandHandler(loadRetroState, insertEvent, transactor, transactionalSideEffects);

const app = express();
app.set('views', './src/pages');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('./dist'));

app.get('/', (req, res) => {
    query(connection, 'SELECT HEX(retroId) AS retroId, retroName FROM retros').then(([results, fields]) => {
        res.render('retro_index', {retro: results});
    }).catch((err) => {
        res.send(err.sqlMessage);
    });
});

app.post('/', (req, res) => {
    const retroId = (new ObjectId()).toString('hex');
    commandHandler(retroId, 'latest', retro.commandHandlers.createRetro.bind(null, retro.createRetro(retroId, req.body.retroName))).then(
        () => {
            res.redirect(`/`);
        }, (err) => {
            console.log('error creating retro: ', err);
            res.redirect(`/`);
        }
    );
});

app.get('/:retroId', (req, res) => {
    res.render('retro_show');
});

app.get('/:retroId/events', (req, res) => {
    loadRetroEvents(connection, req.params.retroId, req.query.fromVersion || 1, req.query.toVersion || 'latest')
        .then((eventRecords) => res.json(eventRecords))
        .catch((err) => res.json(err));
});

app.post('/:retroId/commands', (req, res) => {
    let {clientVersion, command} = req.body;
    let retroId = req.params.retroId;
    commandHandler(retroId, clientVersion, retro.commandHandlers[command.type].bind(null, command)).then((event) => {
        res.json({type: 'success', event: event});
    }).catch((err) => {
        if (err instanceof String) {
            res.json({type: 'domainError', code: err})
        } else {
            if (err.code === 'ER_DUP_ENTRY') {
                loadRetroEvents(connection, retroId, clientVersion + 1, 'latest').then((eventRecords) => {
                    res.json({type: 'outOfDate', missingEvents: eventRecords.map((event) => event.eventData)});
                }).catch((err) => {
                    res.json({type: 'sqlError', sqlError: err});
                })
            } else {
                res.json({type: 'sqlError', sqlError: err});
            }
        }
    });
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});


function query(connection, query, values: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
        connection.query(query, values, (err, results, fields) => {
            if (err) {
                reject(err);
            } else {
                resolve([results, fields]);
            }
        });
    });
}

function mysqlMakeInsertEventFn(connection) {
    return (retroId, retroVersion, event, occurredAt) => {
        return query(
            connection,
            'INSERT INTO retroEvents (retroId, retroVersion, eventData, occurredAt) VALUES (UNHEX(?), ?, ?, ?)',
            [retroId, retroVersion, JSON.stringify(event), dateFormatter('yyyy-MM-dd hh:mm:ss', occurredAt)],
        );
    };
}

function mysqlMakeLoadRetroStateFn(connection, handlers) {
    return (retroId, retroVersion) => {
        return loadRetroEvents(connection, retroId, 1, retroVersion).then((eventRecords) => {
            const maxVersion = eventRecords.length > 0 ? eventRecords[eventRecords.length - 1].retroVersion : 0;
            const state = retro.buildValidationState(handlers, eventRecords.map((e) => e.eventData), retro.emptyState());
            return {currentState: state, currentVersion: maxVersion};
        });
    };
}

function loadRetroEvents(connection, retroId, fromVersion, toVersion) {
    if (toVersion === 'latest') {
        return query(
            connection,
            'SELECT eventData, retroVersion FROM retroEvents WHERE retroId = UNHEX(?) AND retroVersion >= ?',
            [retroId, fromVersion]
        ).then(([results, fields]) => results.map(
            (result) => {
                if (result.eventData) {
                    return {...result, eventData: JSON.parse(result.eventData)};                    
                } else {
                    return {...result};
                }
            }
        ))
    } else {
        return query(
            connection,
            'SELECT eventData, retroVersion FROM retroEvents WHERE retroId = UNHEX(?) AND retroVersion BETWEEN ? AND ?',
            [retroId, fromVersion, toVersion]
        ).then(([results, fields]) => results.map((result) => ({...result, eventData: JSON.parse(result.eventData)})))
    }
}

function makeTransactionMakerFn(connection) {
    return (action: () => Promise<any>) => {
        return new Promise((resolve, reject) => {
            connection.beginTransaction((err) => {
                if (err) {
                    reject(err);
                } else {
                    action().then((arg) => {
                        connection.commit((err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(arg);
                            }
                        });
                    }, (arg) => connection.rollback(() => reject(arg)));
                }
            });
        });
    }
}

interface ServerState {
    currentState: any;
    currentVersion: number;
}

type EventInserter = (retroId: string, nextVersion: number, event: retro.Event, occurredAt: any) => Promise<any[]>;
type StateLoader = (retroId: string, retroVersion: number) => Promise<ServerState>;

function makeCommandHandler(loadRetroState: StateLoader, insertEvent: EventInserter, transactor, transactionSideEffects: TransactionalHandlersMap) {
    return (retroId, retroVersion, action) => {
        return transactor(() => {
            return loadRetroState(retroId, retroVersion).then((stateResult) => {
                let {currentState, currentVersion} = stateResult;
                let result = action(currentState);
                if (result.type === 'ok') {
                    let event = result.value;
                    const nextVersion = currentVersion + 1;
                    return insertEvent(retroId, nextVersion, event, new Date()).then(() => {
                        const handlers = transactionSideEffects[event.type] || [];
                        const sideEffectPromises = handlers.map((handler) => handler(event, nextVersion));
                        return Promise.all(sideEffectPromises).then(() => event);
                    });
                } else {
                    throw new Error(result.v);
                }
            });
        });
    };
}