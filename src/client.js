import { createStore } from 'redux';
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

function newTaskSubmit() {
    return {
        type: 'newTaskSubmit',
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

const render = (store) => {
    console.time('render');
    const state = store.getState();
    console.log('state', state);
    const viewState = state.events.concat(state.commands.map(t => t[1])).reduce(
        (viewState, event) => viewStateHandlers[event.type](event, viewState),
        emptyViewState
    );
    const onNewTaskInput = (newTaskName) => store.dispatch(newTaskInput(newTaskName));
    const onNewTaskSubmit = () => store.dispatch(newTaskSubmit());
    ReactDOM.render(
        <App list={viewState} ui={state.uiState} onNewTaskInput={onNewTaskInput} onNewTaskSubmit={onNewTaskSubmit} />,
        document.getElementById('root')
    );
    console.timeEnd('render');
};

function update(state, action) {
    console.log("UPDATE", state, action);
    switch (action.type) {
        case 'newTaskInput':
            return {...state, uiState: {...state.uiState, newTaskName: action.newTaskName}};

        case 'newTaskSubmit':
            const validationState = state.events.reduce(
                (validationState, event) => list.eventHandlers[event.type](event, validationState),
                list.emptyState()
            );
            const addItemCommand = list.addItem({id: guid(), name: state.uiState.newTaskName});
            const {type, v} = list.commandHandlers.addItem(addItemCommand, validationState);

            if (type === 'ok') {
                let [event,] = v;

                return {
                    ...state,
                    uiState: {...state.uiState, newTaskName: ''},
                    commands: state.commands.concat([[addItemCommand, event]])
                };
            } else {
                return state;
            }
        default:
            return state;
    }
}

loadListEvents(listId, 1, 'latest').then((eventRecords) => {
    const store = createStore(
        update,
        {
            commands: [],
            events: eventRecords.map(eventRecord => eventRecord.eventData),
            latestVersion: eventRecords[eventRecords.length - 1].listVersion,
            uiState: {}
        }
    );
    store.subscribe(render.bind(null, store));
    render(store);
});
