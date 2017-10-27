function ok(v) {
    return {type: 'ok', v: v}
}

function err(v) {
    return {type: 'err', v: v}
}

function noopHandler(event, state) {
    return state
}


/*                errors                    */
export const ERROR_CANNOT_CREATE_ALREADY_CREATED_LIST = 'cannon_create_already_created_list';
export const ERROR_ITEM_ALREADY_EXISTS = 'item_already_exists';

/*                 tools                  */
export function buildState(handlers, events, currentState) {
    console.time('buildState');
    console.log('currentState', currentState);
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
    itemCompleted: noopHandler,
    itemUncompleted: noopHandler,
};

/*                 state                 */
export function emptyState() {
    return {
        created: false,
        itemIds: []
    }
}


/*             command handlers             */
export function createList(listId, listName, state) {
    const event = listCreated(listId, listName);
    if (state.created) {
        return err(ERROR_CANNOT_CREATE_ALREADY_CREATED_LIST);
    }
    return ok([
        event,
        handlers.listCreated.bind(null, event),
    ])
}

export function addItem(item, state) {
    const event = itemAdded(item);
    if (state.itemIds.indexOf(item.id) !== -1) {
        return err(ERROR_ITEM_ALREADY_EXISTS);
    }
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