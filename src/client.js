import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';

import * as list from './core/list';

const url = window.location.href;
const lastSlashIndex = url.lastIndexOf('/');
const listId = url.substring(lastSlashIndex + 1);

function loadListEvents(listId, fromVersion = 1, toVersion = 'latest') {
    return fetch(`/${listId}/events?fromVersion=${fromVersion}&toVersion=${toVersion}`).then((res) => res.json())
}

function loadListState(handlers, listId, currentState, currentVersion = 1) {
    return loadListEvents(listId, currentVersion, 'latest').then((eventRecords) => {
        const currentVersion = eventRecords.length > 0 ? eventRecords[eventRecords.length - 1].listVersion : 0;
        const currentState = list.buildState(handlers, currentState, eventRecords.map((e) => e.eventData));
        return {currentState, currentVersion};
    });
}

const emptyViewState = {
    name: 'Unknown',
    items: [],
};

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

loadListState(viewStateHandlers, listId, emptyViewState).then((stateResult) => {
    const {currentState,currentVersion} = stateResult;
    console.log(currentState);
    ReactDOM.render(<App/>, document.getElementById('root'));
});
