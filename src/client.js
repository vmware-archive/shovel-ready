import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';

import * as list from './core/list';

const url = window.location.href;
const lastSlashIndex = url.lastIndexOf('/');
const listId = url.substring(lastSlashIndex + 1);

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

const render = (commands, events, uiState) => {
    console.time('render');
    const onNewTaskInput = (newTaskName) => {
        render(commands, events, {...uiState, newTaskName: newTaskName});
    };

    const onNewTaskSubmit = () => {
        const validationState = events.reduce(
            (validationState, event) => list.eventHandlers[event.type](event, validationState),
            list.emptyState()
        );
        const addItemCommand = list.addItem({id: guid(), name: uiState.newTaskName});
        const {type, v} = list.commandHandlers.addItem(addItemCommand, validationState);
        if (type === 'ok') {
            let [event,] = v;
            render(commands.concat([[addItemCommand, event]]), events, {...uiState, newTaskName: ''});
        } else {
            console.log("ERROR", type, v);
        }
    };

    let viewState = events.concat(commands.map(t => t[1])).reduce(
        (viewState, event) => viewStateHandlers[event.type](event, viewState),
        emptyViewState
    );

    ReactDOM.render(
        <App list={viewState} ui={uiState} onNewTaskInput={onNewTaskInput} onNewTaskSubmit={onNewTaskSubmit} />,
        document.getElementById('root')
    );
    console.timeEnd('render');
}

loadListEvents(listId, 1, 'latest').then((eventRecords) => {
    render([], eventRecords.map(eventRecord => eventRecord.eventData), {});
});
