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


/*               commands                */
export function createList(listId, listName) {
    return {
        type: 'createList',
        listId,
        listName,
    }
}

export function addItem(item) {
    return {
        type: 'addItem',
        item
    }
}

export function removeItem(itemId) {
    return {
        type: 'removeItem',
        itemId,
    }
}

export function completeItem(itemId) {
    return {
        type: 'completeItem',
        itemId,
    }
}

export function uncompleteItem(itemId) {
    return {
        type: 'uncompleteItem',
        itemId,
    }
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

/*             event handlers            */

export const eventHandlers = {
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
export const commandHandlers = {
    createList: (command, state) => {
        const event = listCreated(command.listId, command.listName);
        if (state.created) {
            return err(ERROR_CANNOT_CREATE_ALREADY_CREATED_LIST);
        }
        return ok([
            event,
            eventHandlers.listCreated.bind(null, event),
        ])
    },

    addItem: (command, state) => {
        const event = itemAdded(command.item);
        if (state.itemIds.indexOf(command.item.id) !== -1) {
            return err(ERROR_ITEM_ALREADY_EXISTS);
        }
        return ok([
            event,
            eventHandlers.itemAdded.bind(null, event),
        ])
    },

    removeItem: (command, state) => {
        return ok([
            itemRemoved(command.itemId),
            eventHandlers.itemRemoved.bind(null, event),
        ])
    },

    completeItem: (command, state) => {
        const event = itemCompleted(command.itemId);
        return ok([
            event,
            eventHandlers.itemCompleted.bind(null, event),
        ])
    },

    uncompleteItem: (command, state) => {
        const event = itemUncompleted(command.itemId);
        return ok([
            event,
            eventHandlers.itemUncompleted.bind(null, event),
        ])
    },
}
