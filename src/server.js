import mysql from 'mysql';
import express from 'express';
import bodyParser from 'body-parser';
import * as list from './core/list';
import dateFormatter from 'date-format';
import ObjectId from 'node-time-uuid';

const connection = mysql.createConnection({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'ref_arch_02',
});

const createList = (event) => {
    return query(
        connection,
        'INSERT INTO lists VALUES (UNHEX(?), ?)',
        [event.listId, event.listName],
    );
};

const transactionalSideEffects = {
    listCreated: [createList],
};

const insertEvent = mysqlMakeInsertEventFn(connection);
const loadListState = mysqlMakeLoadListStateFn(connection, list.eventHandlers);
const transactor = makeTransactionMakerFn(connection);
const commandHandler = makeCommandHandler(loadListState, insertEvent, transactor, transactionalSideEffects);

const app = express();
app.set('views', './src/pages');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('./dist'));

app.get('/', (req, res) => {
    query(connection, 'SELECT HEX(listId) AS listId, listName FROM lists').then((results) => {
        res.render('list_index', {list: results});
    }).catch((err) => {
        res.send(err.sqlMessage);
    });
});

app.post('/', (req, res) => {
    const listId = (new ObjectId()).toString('hex');
    commandHandler(listId, 'latest', list.commandHandlers.createList.bind(null, list.createList(listId, req.body.listName))).then(
        () => {
            res.redirect(`/`);
        }, (err) => {
            console.log('error creating list: ', err);
            res.redirect(`/`);
        }
    );
});

app.get('/:listId', (req, res) => {
    res.render('list_show');
});

app.get('/:listId/events', (req, res) => {
    loadListEvents(connection, req.params.listId, req.query.fromVersion || 1, req.query.toVersion || 'latest')
        .then((eventRecords) => res.json(eventRecords))
        .catch((err) => res.json(err));
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});


function query(connection, query, values = []) {
    return new Promise((resolve, reject) => {
        connection.query(query, values, (err, results, fields) => {
            if (err) {
                reject(err);
            } else {
                resolve(results, fields);
            }
        });
    });
}

function mysqlMakeInsertEventFn(connection) {
    return (listId, listVersion, event, occurredAt) => {
        return query(
            connection,
            'INSERT INTO listEvents (listId, listVersion, eventData, occurredAt) VALUES (UNHEX(?), ?, ?, ?)',
            [listId, listVersion, JSON.stringify(event), dateFormatter('yyyy-MM-dd hh:mm:ss', occurredAt)],
        );
    };
}

function mysqlMakeLoadListStateFn(connection, handlers) {
    return (listId, listVersion) => {
        return loadListEvents(connection, listId, 1, listVersion).then((eventRecords) => {
            const maxVersion = eventRecords.length > 0 ? eventRecords[eventRecords.length - 1].listVersion : 0;
            const state = list.buildState(handlers, eventRecords.map((e) => e.eventData), list.emptyState());
            return {currentState: state, currentVersion: maxVersion};
        });
    };
}

function loadListEvents(connection, listId, fromVersion, toVersion) {
    if (toVersion === 'latest') {
        return query(
            connection,
            'SELECT eventData, listVersion FROM listEvents WHERE listId = UNHEX(?) AND listVersion >= ?',
            [listId, fromVersion]
        ).then((results) => results.map((result) => ({...result, eventData: JSON.parse(result.eventData)})))
    } else {
        return query(
            connection,
            'SELECT eventData, listVersion FROM listEvents WHERE listId = UNHEX(?) AND listVersion BETWEEN ? AND ?',
            [listId, fromVersion, toVersion]
        ).then((results) => results.map((result) => ({...result, eventData: JSON.parse(result.eventData)})))
    }
}

function makeTransactionMakerFn(connection) {
    return (action) => {
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

function makeCommandHandler(loadListState, insertEvent, transactor, transactionSideEffects) {
    return (listId, listVersion, action) => {
        return transactor(() => {
            return loadListState(listId, listVersion).then((stateResult) => {
                let {currentState, currentVersion} = stateResult;
                let result = action(currentState);
                if (result.type === 'ok') {
                    let [event,] = result.v;
                    const nextVersion = currentVersion + 1;
                    return insertEvent(listId, nextVersion, event).then(() => {
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