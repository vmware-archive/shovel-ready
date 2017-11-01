import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk'
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';

import * as list from './core/list';
import * as serverSync from './server_sync';

const url = window.location.href;
const lastSlashIndex = url.lastIndexOf('/');
const listId = url.substring(lastSlashIndex + 1);

function newTaskInput(newTaskName) {
    return {
        type: 'newTaskInput',
        newTaskName,
    }
}

function newTaskSubmit(state) {
    const addItemCommand = list.addItem({id: guid(), name: state.uiState.newTaskName});
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
    listCreated: (event, state) => {
        return {...state, name: event.listName};
    },
    itemAdded: (event, state, pending = false) => {
        return {...state, items: state.items.concat({...event.item, pending: pending})};
    },
    itemRemoved: (event, state, pending = false) => {
        return {...state, items: state.items.filter((item) => item.id === event.itemId)};
    }
};

const emptyViewState = {
    name: 'Unknown',
    items: [],
};

function loadListEvents(listId, fromVersion = 1, toVersion = 'latest') {
    return fetch(`/${listId}/events?fromVersion=${fromVersion}&toVersion=${toVersion}`).then((res) => res.json())
}

function handleCommands(commands, validationState, viewState) {
    for (let i = 0; i < commands.length; i++) {
        const {type, v: eventResult} = list.commandHandlers.addItem(commands[i], validationState);
        if (type === 'ok') {
            const event = eventResult;
            viewState = viewStateHandlers[event.type](event, viewState, true);
            validationState = list.eventHandlers[event.type](event, validationState);
        } else {
            console.log('error: ', eventResult);
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
            let viewState = list.buildState(viewStateHandlers, serverSync.events(state.serverSync), emptyViewState);
            let validationState = list.buildState(list.eventHandlers, serverSync.events(state.serverSync), list.emptyState());
            const commands = serverSync.commands(state.serverSync);
            viewState = handleCommands(commands, validationState, viewState);
            const onNewTaskInput = (newTaskName) => store.dispatch(newTaskInput(newTaskName));
            const onNewTaskSubmit = () => store.dispatch(newTaskSubmit(store.getState()));
            ReactDOM.render(
                <App list={viewState} ui={state.uiState} onNewTaskInput={onNewTaskInput}
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

loadListEvents(listId, 1, 'latest').then((eventRecords) => {
    const store = createStore(
        update,
        {
            serverSync: serverSync.init(
                [],
                eventRecords.map(eventRecord => eventRecord.eventData),
                eventRecords[eventRecords.length - 1].listVersion
            ),
            uiState: {}
        },
        applyMiddleware(
            thunkMiddleware,
        )
    );
    renderUI(store);
    serverSync.syncWithServer(listId, store, (store) => store.getState().serverSync, loadListEvents);
    window.store = store;
});
