export interface CannotCreateAlreadyCreatedList {
    type: 'cannot_create_already_created_list'
}

export function cannotCreateAlreadyCreatedList(): CannotCreateAlreadyCreatedList {
    return {
        type: 'cannot_create_already_created_list'
    };
}

export interface ItemAlreadyExists {
    type: 'item_already_exists'
}

export function itemAlreadyExists(): ItemAlreadyExists {
    return {
        type: 'item_already_exists'
    };
}

export type CommandErrorType = ItemAlreadyExists | CannotCreateAlreadyCreatedList;

export type CommandHandlerResponse = Result<Event, CommandErrorType>

export type Result<O, E> = Ok<O> | Err<E>

export interface Ok<T> {
    type: "ok",
    value: T,
}

export interface Err<T> {
    type: "err",
    value: T,
}

export interface ValidationState {
    created: boolean,
    itemIds: string[],
}

export function ok<O, E>(value: O): Result<O, E> {
    return {type: "ok", value}
}

export function err<O, E>(value: E): Result<O, E> {
    return {type: "err", value}
}

export function noopHandler(event: Event, state: ValidationState): ValidationState {
    return state;
}

/*                 tools                  */
export function buildState(handlers: HandlerMap, events: Event[], currentState: ValidationState): ValidationState {
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

/*               commands                */
export interface CreateList {
    type: "createList",
    listId: string,
    listName: string,
}

export function createList(listId: string, listName: string): CreateList {
    return {
        type: "createList",
        listId,
        listName,
    }
}

export interface AddItem {
    type: "addItem",
    item: any
}

export function addItem(item: any): AddItem {
    return {
        type: "addItem",
        item
    }
}

export interface RemoveItem {
    type: "removeItem",
    itemId: string,
}

export function removeItem(itemId: string): RemoveItem {
    return {
        type: "removeItem",
        itemId
    }
}

export interface CompleteItem {
    type: "completeItem",
    itemId: string,
}

export function completeItem(itemId: string): CompleteItem {
    return {
        type: "completeItem",
        itemId
    }
}

export interface UncompleteItem {
    type: "uncompleteItem",
    itemId: string,
}

export function uncompleteItem(itemId: string): UncompleteItem {
    return {
        type: "uncompleteItem",
        itemId
    }
}

export type Command = CreateList | AddItem | RemoveItem | CompleteItem | UncompleteItem;


/*                events                 */

export interface ListCreated {
    type: "listCreated",
    listId: string,
    listName: string,
}

export function listCreated(listId: string, listName: string): ListCreated {
    return {
        type: "listCreated",
        listId,
        listName,
    }
}

export interface ItemAdded {
    type: "itemAdded",
    item: any,
}


export function itemAdded(item: string): ItemAdded {
    return {
        type: "itemAdded",
        item,
    }
}

export interface ItemRemoved {
    type: "itemRemoved",
    itemId: string
}

export function itemRemoved(itemId: string): ItemRemoved {
    return {
        type: "itemRemoved",
        itemId,
    }
}

export interface ItemCompleted {
    type: "itemCompleted",
    itemId: string
}

export function itemCompleted(itemId: string): ItemCompleted {
    return {
        type: "itemCompleted",
        itemId,
    }
}

export interface ItemUncompleted {
    type: "itemUncompleted",
    itemId: string    
}

export function itemUncompleted(itemId: string): ItemUncompleted {
    return {
        type: "itemUncompleted",
        itemId,
    }
}

export type Event = ListCreated | ItemAdded | ItemRemoved | ItemCompleted | ItemUncompleted;

/*             event handlers            */

export interface HandlerMap {
    [eventName: string]: Function
}

export interface HandlersMap {
    [eventName: string]: Function[]
}

export const eventHandlers:HandlerMap = {
    listCreated: (event, state) => ({...state, created: true}),
    itemAdded: (event, state) => ({...state, itemIds: state.itemIds.concat(event.item.id)}),
    itemRemoved: (event, state) => ({...state, itemIds: state.itemIds.filter((id) => id === event.itemId)}),
    itemCompleted: noopHandler,
    itemUncompleted: noopHandler,
};

/*                 state                 */
export function emptyState():ValidationState {
    return {
        created: false,
        itemIds: []
    }
}

/*             command handlers             */
export const commandHandlers = {
    createList: (command: CreateList, state: ValidationState): CommandHandlerResponse => {
        const event = listCreated(command.listId, command.listName);
        if (state.created) {
            return err(cannotCreateAlreadyCreatedList());
        }
        return ok(event);
    },

    addItem: (command: AddItem, state: ValidationState): CommandHandlerResponse => {
        const event = itemAdded(command.item);
        if (state.itemIds.indexOf(command.item.id) !== -1) {
            return err(itemAlreadyExists());
        }
        return ok(event);
    },

    removeItem: (command: RemoveItem, state: ValidationState): CommandHandlerResponse => {
        return ok(itemRemoved(command.itemId));
    },

    completeItem: (command: CompleteItem, state: ValidationState): CommandHandlerResponse => {
        const event = itemCompleted(command.itemId);
        return ok(event);
    },

    uncompleteItem: (command: UncompleteItem, state: ValidationState): CommandHandlerResponse => {
        const event = itemUncompleted(command.itemId);
        return ok(event);
    },
}
