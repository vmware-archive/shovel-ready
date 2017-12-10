import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk'
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './components/app';

import * as retro from './core/retro';
import * as serverSync from './server_sync';

const url = window.location.href;
const lastSlashIndex = url.lastIndexOf('/');
const retroId = url.substring(lastSlashIndex + 1);

function newColumnInput(newColumnName) {
    return {
        type: 'newColumnInput',
        newColumnName,
    }
}

function newColumnSubmit(state) {
    const addColumnCommand = retro.addColumn(guid(), state.uiState.newColumnName);
    return {
        type: 'commandQueued',
        command: addColumnCommand,
    };
}

function newTaskInput(columnId, newTaskName) {
    return {
        type: 'newTaskInput',
        columnId,
        newTaskName,
    }
}

function newTaskSubmit(columnId, state) {
    const addItemCommand = retro.addItem({
        id: guid(), 
        name: state.uiState.newTaskNames[columnId],
        columnId: columnId 
    });
    return {
        type: 'commandQueued',
        command: addItemCommand,
    };
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

const viewStateHandlers = {
    retroCreated: (event, state) => {
        return {...state, name: event.retroName};
    },
    columnAdded: (event, state, pending = false) => {
        return {...state, columns: state.columns.concat({name: event.name, id: event.id, items: [], pending: pending})};
    },
    columnRemoved: (event, state, pending = false) => {
        return {...state, columns: state.columns.filter((id) => id === event.id)};
    },
    itemAdded: (event, state, pending = false) => {
        // TODO: MORE FUNCTIONAL WAY TO DO THIS?
        // THIS IS SUPER DIRTY!!
        let foundColumnIndex = 0;
        let column = state.columns.find((column, columnIndex) => {
            foundColumnIndex = columnIndex;
            return event.item.columnId === column.id;
        });  
        state.columns[foundColumnIndex].items = state.columns[foundColumnIndex].items.concat(event.item);
        return state;
    },
    itemRemoved: (event, state, pending = false) => {
        return {...state, items: state.items.filter((item) => item.id === event.itemId)};
    }
};

function emptyViewState(): retro.ViewState {
    return {
        name: 'Unknown',
        items: [],
        columns: [],
    }
}

function loadRetroEvents(retroId, fromVersion = 1, toVersion = 'latest') {
    return fetch(`/${retroId}/events?fromVersion=${fromVersion}&toVersion=${toVersion}`).then((res) => res.json())
}

function handleCommands(commands: retro.Command[], validationState: retro.ValidationState, viewState) {
    for (let i = 0; i < commands.length; i++) {
        let command = commands[i];
        let response: retro.CommandHandlerResponse | null;

        switch (command.type) {
            case "addItem": 
                response = retro.commandHandlers.addItem(command, validationState);
                break;
            case "addColumn":
                response = retro.commandHandlers.addColumn(command, validationState);
                break;
            default:
                response = null;
        }
        if (response) {
            switch(response.type) {
                case 'ok':
                    const event = response.value;
                    viewState = viewStateHandlers[event.type](event, viewState, true);
                    validationState = retro.eventHandlers[event.type](event, validationState);
                    break;
                case 'err':
                    console.log('error: ', response.value);
                    break;
            }
        }
    }
    return viewState;
}

function renderUI(store) {
    let prevState = -1;
    const render = () => {
        console.time('render');
        const state = store.getState();
        if (state !== prevState) {
            prevState = state;
            let viewState = retro.buildViewState(viewStateHandlers, serverSync.events(state.serverSync), emptyViewState());
            let validationState = retro.buildValidationState(retro.eventHandlers, serverSync.events(state.serverSync), retro.emptyState());
            const commands = serverSync.commands(state.serverSync);
            viewState = handleCommands(commands, validationState, viewState);
            const onNewTaskInput = (columnId, newTaskName) => store.dispatch(newTaskInput(columnId, newTaskName));
            const onNewTaskSubmit = (columnId) => store.dispatch(newTaskSubmit(columnId, store.getState()));
            const onNewColumnInput = (newColumnName) => store.dispatch(newColumnInput(newColumnName));
            const onNewColumnSubmit = () => store.dispatch(newColumnSubmit(store.getState()));
            ReactDOM.render(
                <App retro={viewState} ui={state.uiState} 
                    onNewTaskInput={onNewTaskInput}
                    onNewTaskSubmit={onNewTaskSubmit}
                    onNewColumnInput={onNewColumnInput}
                    onNewColumnSubmit={onNewColumnSubmit}
                    />,
                document.getElementById('root')
            );
            console.timeEnd('render');
        } else {
            console.log('not rendering because nothing changed');
        }
    };
    store.subscribe(render);
    render();
}

function update(state, action) {
    const nextUiState = handleUiAction(state.uiState, action);
    const nextServerSyncState = serverSync.handleAction(state.serverSync, action);
    if (state.uiState !== nextUiState || state.serverSync !== nextServerSyncState) {
        return {
            ...state,
            uiState: nextUiState,
            serverSync: nextServerSyncState,
        };
    } else {
        return state;
    }
}

function handleUiAction(uiState, action) {
    switch (action.type) {
        case 'newTaskInput':
            return {
                ...uiState, 
                newTaskNames: {
                    ...uiState.newTaskNames, 
                    [action.columnId]: action.newTaskName
                }
            };

        case 'newColumnInput':
            return {...uiState, newColumnName: action.newColumnName};

        case 'commandQueued':
            switch(action.command.type) {
                case 'addItem':
                    return {
                        ...uiState, 
                        newTaskNames: {
                            ...uiState.newTaskNames, 
                            [action.command.item.columnId]: ''
                        }
                    };
        
                case 'addColumn':
                    return {...uiState, newColumnName: ''};
                default:
                    return uiState;
            }

        default:
            return uiState;
    }
}

loadRetroEvents(retroId, 1, 'latest').then((eventRecords) => {
    const store = createStore(
        update,
        {
            serverSync: serverSync.init(
                [],
                eventRecords.map(eventRecord => eventRecord.eventData),
                eventRecords[eventRecords.length - 1].retroVersion
            ),
            uiState: {
                newTaskNames: {},
                newColumnName: '',
            }
        },
        applyMiddleware(
            thunkMiddleware,
        )
    );
    renderUI(store);
    serverSync.syncWithServer(retroId, store, (store) => store.getState().serverSync, loadRetroEvents);
    // window.store = store;
});
