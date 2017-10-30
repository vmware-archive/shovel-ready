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

function executeCommand(state, command) {
    const validationState = state.events.reduce(
        (validationState, event) => list.eventHandlers[event.type](event, validationState),
        list.emptyState()
    );
    return list.commandHandlers.addItem(command, validationState);
}

function newTaskSubmit() {
    return function (dispatch, getState) {
        const addItemCommand = list.addItem({id: guid(), name: getState().uiState.newTaskName});

        dispatch({
            type: 'commandQueued',
            command: addItemCommand,
        });

        if (getState().commands.length === 1) {
            processNextCommand(dispatch, getState);
        }
    }
}

function processNextCommand(dispatch, getState) {
    if (getState().commands.length >= 1) {
        const command = getState().commands[0];
        const {type} = executeCommand(getState(), command);

        if (type === 'ok') {
            const body = {
                clientVersion: getState().latestVersion,
                command: command,
            };

            return fetch(`/${listId}/commands`, {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)
            }).then((res) => res.json()).then((resData) => {
                if (resData.type === 'success') {
                    dispatch({type: 'commandSuccessfullyExecutedOnServer', event: resData.event});
                } else if (resData.type === 'outOfDate') {
                    dispatch({type: 'outOfDate', missingEvents: resData.missingEvents});
                } else {
                    dispatch({type: 'commandFailureResponse', err: resData});
                }
                processNextCommand(dispatch, getState);
            });
        } else {
            return null;
        }
    }
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
    console.log('state', state);
    let viewState = state.events.reduce(
        (viewState, event) => viewStateHandlers[event.type](event, viewState),
        emptyViewState
    );
    state.commands.forEach((command) => {
        const {type, v: eventResult} = executeCommand(state, command);
        if (type === 'ok') {
            let [event,] = eventResult;
            viewState = viewStateHandlers[event.type](event, viewState);
        } else {
            console.log('error: ', eventResult);
        }
    });
    const onNewTaskInput = (newTaskName) => store.dispatch(newTaskInput(newTaskName));
    const onNewTaskSubmit = () => store.dispatch(newTaskSubmit());
    ReactDOM.render(
        <App list={viewState} ui={state.uiState} onNewTaskInput={onNewTaskInput} onNewTaskSubmit={onNewTaskSubmit} />,
        document.getElementById('root')
    );
    console.timeEnd('render');
}

function update(state, action) {
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
                    return {
                        ...state,
                        events: state.events.concat(action.events),
                        latestVersion: state.latestVersion + action.events.length,
                    };
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
            });
            pollForEvents(listId, store);
        });
    }, 5000);
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
    pollForEvents(listId, store);
});
