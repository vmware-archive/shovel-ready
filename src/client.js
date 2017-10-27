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

function loadListEvents(listId, fromVersion = 1, toVersion = 'latest') {
    return fetch(`/${listId}/events?fromVersion=${fromVersion}&toVersion=${toVersion}`).then((res) => res.json())
}

function loadListState(listId, currentStates, currentVersion, handlerList) {
    return loadListEvents(listId, currentVersion, 'latest').then((eventRecords) => {
        const currentVersion = eventRecords.length > 0 ? eventRecords[eventRecords.length - 1].listVersion : 0;
        return handlerList.map((handlers, i) => {
            return {
                currentState: list.buildState(handlers, eventRecords.map((e) => e.eventData), currentStates[i]),
                currentVersion
            }
        });
    });
}

const emptyViewState = {
    name: 'Unknown',
    items: [],
};

const viewStateHandlers = {
    listCreated: (event, state) => {
        console.log('STATE', state);
        return {...state, name: event.listName};
    },
    itemAdded: (event, state) => {
        return {...state, items: state.items.concat(event.item)};
    },
    itemRemoved: (event, state) => {
        return {...state, items: state.items.filter((item) => item.id === event.itemId)};
    }
};

const render = (validationState, viewState, uiState) => {
    console.log(validationState, viewState, uiState);
    const onNewTaskInput = (newTaskName) => {
        render(validationState, viewState, {...uiState, newTaskName: newTaskName});
    }
    const onNewTaskSubmit = () => {
        let result = list.addItem({id: guid(), name: uiState.newTaskName}, validationState);
        if (result.type === 'ok') {
            const [event,nextStateFn] = result.v;
            const nextValidationState = nextStateFn(validationState);
            const nextViewState = viewStateHandlers[event.type](event, viewState);
            const nextUiState = {...uiState, newTaskName: ''};
            render(nextValidationState, nextViewState, nextUiState);
        } else {
            render(validationState, viewState, {...uiState, error: result.v});
        }

    }

    ReactDOM.render(<App list={viewState} ui={uiState} onNewTaskInput={onNewTaskInput} onNewTaskSubmit={onNewTaskSubmit} />, document.getElementById('root'));
};

loadListState(listId, [emptyViewState, list.emptyState()], 1, [viewStateHandlers, list.handlers]).then((stateResults) => {
    const [viewStateResult, validationStateResult] = stateResults;
    const viewState = viewStateResult.currentState;
    const validationState = validationStateResult.currentState;
    render(validationState, viewState, {})
});
