function ok(v) {
    return {type: 'ok', v: v}
}

function err(v) {
    return {type: 'err', v: v}
}

function noop(v) {
    return v
}


/*                 tools                  */
export function buildState(handlers, currentState, events) {
    console.time('buildState');
    const nextState = events.reduce((state, event) => {
        const handler = handlers[event.type];
        if (handler) {
            return handler(event, state);
        } else {
            return state;
        }
    }, currentState);
    console.timeEnd('buildState');
    return nextState;
}


/*                events                 */
export function listCreated(listId, listName) {
    return {
        type: 'listCreated',
        listId,
        listName,
    }
}

export function itemAdded(item) {
    return {
        type: 'itemAdded',
        item,
    }
}

export function itemRemoved(itemId) {
    return {
        type: 'itemRemoved',
        itemId,
    }
}

export function itemCompleted(itemId) {
    return {
        type: 'itemCompleted',
        itemId,
    }
}

export function itemUncompleted(itemId) {
    return {
        type: 'itemUncompleted',
        itemId,
    }
}

/*               handlers                */

export const handlers = {
    listCreated: (event, state) => ({...state, created: true}),
    itemAdded: (event, state) => ({...state, itemIds: state.itemIds.concat(event.item.id)}),
    itemRemoved: (event, state) => ({...state, itemIds: state.itemIds.filter((id) => id === event.itemId)}),
    itemCompleted: noop,
    itemUncompleted: noop,
};

/*                 state                 */
export function emptyState() {
    return {
        created: false,
        itemIds: []
    }
}


/*             commands              */
export function createList(listId, listName, state) {
    const event = listCreated(listId, listName);
    return ok([
        event,
        handlers.listCreated.bind(null, event),
    ])
}

export function addItem(item, state) {
    const event = itemAdded(item);
    return ok([
        event,
        handlers.itemAdded.bind(null, event),
    ])
}

export function removeItem(itemId, state) {
    return ok([
        itemRemoved(itemId),
        handlers.itemRemoved.bind(null, event),
    ])
}

export function completeItem(itemId, state) {
    const event = itemCompleted(itemId);
    return ok([
        event,
        handlers.itemCompleted.bind(null, event),
    ])
}

export function uncompleteItem(itemId, state) {
    const event = itemUncompleted(itemId);
    return ok([
        event,
        handlers.itemUncompleted.bind(null, event),
    ])
}