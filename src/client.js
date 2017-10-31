import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk'
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';

import * as list from './core/list';

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
    itemAdded: (event, state) => {
        return {...state, items: state.items.concat(event.item)};
    },
    itemRemoved: (event, state) => {
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

function render(store) {
    console.time('render');
    const state = store.getState();
    let viewState = state.events.reduce(
        (viewState, event) => viewStateHandlers[event.type](event, viewState),
        emptyViewState
    );
    let validationState = state.events.reduce(
        (validationState, event) => list.eventHandlers[event.type](event, validationState),
        list.emptyState()
    );
    for (let i = 0; i < state.commands.length; i++) {
        const {type, v: eventResult} = list.commandHandlers.addItem(state.commands[0], validationState);
        if (type === 'ok') {
            let event = eventResult;
            viewState = viewStateHandlers[event.type](event, viewState);
            validationState = list.eventHandlers[event.type](event, validationState);
        } else {
            console.log('error: ', eventResult);
            break;
        }
    }
    const onNewTaskInput = (newTaskName) => store.dispatch(newTaskInput(newTaskName));
    const onNewTaskSubmit = () => store.dispatch(newTaskSubmit(store.getState()));
    ReactDOM.render(
        <App list={viewState} ui={state.uiState} onNewTaskInput={onNewTaskInput} onNewTaskSubmit={onNewTaskSubmit} />,
        document.getElementById('root')
    );
    console.timeEnd('render');
}

function update(state, action) {
    console.log(state, action);
    switch (action.type) {
        case 'newTaskInput':
            return {...state, uiState: {...state.uiState, newTaskName: action.newTaskName}};

        case 'commandQueued':
            switch(action.command.type) {
                case 'addItem':
                    return {
                        ...state,
                        uiState: {...state.uiState, newTaskName: ''},
                        commands: state.commands.concat([action.command])
                    };
            }
        case 'commandSuccessfullyExecutedOnServer':
            return {
                ...state,
                events: state.events.concat([action.event]),
                commands: state.commands.slice(1),
                latestVersion: state.latestVersion + 1,
            };
        case 'outOfDate':
            return {
                ...state,
                events: state.events.concat(action.missingEvents),
                latestVersion: state.latestVersion + action.missingEvents.length,
            };
        case 'eventsReceived':
            if(state.commands.length > 0) {
                return state;
            } else {
                if (action.events.length === 0) {
                    return state;
                } else {
                    if (action.latestVersion > state.latestVersion) {
                        return {
                            ...state,
                            events: state.events.concat(action.events),
                            latestVersion: action.latestVersion,
                        };
                    } else {
                        return state;
                    }
                }
            }
        default:
            return state;
    }
}

function pollForEvents(listId, store) {
    setTimeout(() => {
        loadListEvents(listId, store.getState().latestVersion + 1).then((eventRecords) => {
            store.dispatch({
                type: 'eventsReceived',
                events: eventRecords.map(eventRecord => eventRecord.eventData),
                latestVersion: eventRecords.length > 0 ? eventRecords[eventRecords.length - 1].listVersion : undefined,
            });
            pollForEvents(listId, store);
        });
    }, 1000);
}

function executeCommand(state, command) {
    const validationState = state.events.reduce(
        (validationState, event) => list.eventHandlers[event.type](event, validationState),
        list.emptyState()
    );
    return list.commandHandlers.addItem(command, validationState);
}

function processCommands(listId, store) {
    let processingCommands = false;
    const processNextCommand = () => {
        if (store.getState().commands.length >= 1 && !processingCommands) {
            processingCommands = true;
            const command = store.getState().commands[0];
            const {type} = executeCommand(store.getState(), command);

            if (type === 'ok') {
                const body = {
                    clientVersion: store.getState().latestVersion,
                    command: command,
                };

                return fetch(`/${listId}/commands`, {
                    method: "POST",
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(body)
                }).then((res) => res.json()).then((resData) => {
                    if (resData.type === 'success') {
                        store.dispatch({type: 'commandSuccessfullyExecutedOnServer', event: resData.event});
                    } else if (resData.type === 'outOfDate') {
                        store.dispatch({type: 'outOfDate', missingEvents: resData.missingEvents});
                    } else {
                        store.dispatch({type: 'commandFailureResponse', err: resData});
                    }
                    processingCommands = false;
                    processNextCommand();
                });
            } else {
                return null;
            }
        }
    };
    store.subscribe(processNextCommand);
}

loadListEvents(listId, 1, 'latest').then((eventRecords) => {
    const store = createStore(
        update,
        {
            commands: [],
            events: eventRecords.map(eventRecord => eventRecord.eventData),
            latestVersion: eventRecords[eventRecords.length - 1].listVersion,
            uiState: {}
        },
        applyMiddleware(
            thunkMiddleware,
        )
    );
    store.subscribe(render.bind(null, store));
    render(store);
    processCommands(listId, store);
    pollForEvents(listId, store);
    window.appStore = store;
});
