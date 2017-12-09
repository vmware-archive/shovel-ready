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

function newTaskInput(newTaskName) {
    return {
        type: 'newTaskInput',
        newTaskName,
    }
}

function newTaskSubmit(state) {
    const addItemCommand = retro.addItem({id: guid(), name: state.uiState.newTaskName});
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
    itemAdded: (event, state, pending = false) => {
        return {...state, items: state.items.concat({...event.item, pending: pending})};
    },
    itemRemoved: (event, state, pending = false) => {
        return {...state, items: state.items.filter((item) => item.id === event.itemId)};
    }
};

function emptyViewState(): retro.ViewState {
    return {
        name: 'Unknown',
        items: []
    }
}

function loadRetroEvents(retroId, fromVersion = 1, toVersion = 'latest') {
    return fetch(`/${retroId}/events?fromVersion=${fromVersion}&toVersion=${toVersion}`).then((res) => res.json())
}

function handleCommands(commands: retro.Command[], validationState: retro.ValidationState, viewState) {
    for (let i = 0; i < commands.length; i++) {
        let command = commands[i];
        switch (command.type) {
            case "addItem": 
                const {type, value: eventResult} = retro.commandHandlers.addItem(command, validationState);
                switch(type) {
                    case 'ok':
                        const event = eventResult;
                        viewState = viewStateHandlers[event.type](event, viewState, true);
                        validationState = retro.eventHandlers[event.type](event, validationState);
                        break;
                    case 'err':
                        console.log('error: ', eventResult);
                        break;
                }
                if (type === 'ok') {
                    const event = eventResult;
                    viewState = viewStateHandlers[event.type](event, viewState, true);
                    validationState = retro.eventHandlers[event.type](event, validationState);
                } else {
                    break;
                }        
                break;
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
            const onNewTaskInput = (newTaskName) => store.dispatch(newTaskInput(newTaskName));
            const onNewTaskSubmit = () => store.dispatch(newTaskSubmit(store.getState()));
            ReactDOM.render(
                <App retro={viewState} ui={state.uiState} onNewTaskInput={onNewTaskInput}
                     onNewTaskSubmit={onNewTaskSubmit}/>,
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
    console.log(state, action);
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
            return {...uiState, newTaskName: action.newTaskName};

        case 'commandQueued':
            switch(action.command.type) {
                case 'addItem':
                    return {...uiState, newTaskName: ''};
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
            uiState: {}
        },
        applyMiddleware(
            thunkMiddleware,
        )
    );
    renderUI(store);
    serverSync.syncWithServer(retroId, store, (store) => store.getState().serverSync, loadRetroEvents);
    // window.store = store;
});
