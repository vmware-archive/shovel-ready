import { ValidationMap } from "react";

export interface CannotCreateAlreadyCreatedRetro {
    type: 'cannot_create_already_created_retro'
}

export function cannotCreateAlreadyCreatedRetro(): CannotCreateAlreadyCreatedRetro {
    return {
        type: 'cannot_create_already_created_retro'
    };
}

export interface ColumnAlreadyExists {
    type: "column_already_exists"   
}

export function columnAlreadyExists(): ColumnAlreadyExists {
    return {
        type: "column_already_exists"
    }
}

export interface ItemAlreadyExists {
    type: 'item_already_exists'
}

export function itemAlreadyExists(): ItemAlreadyExists {
    return {
        type: 'item_already_exists'
    };
}

export type CommandErrorType = ItemAlreadyExists | ColumnAlreadyExists | CannotCreateAlreadyCreatedRetro

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
    columnIds: string[],
}

export interface ViewState {
    name: 'Unknown',
    items: any[],
    columns: any[],
}

export function emptyViewState(): ViewState {
    return {
        name: 'Unknown',
        items: [],
        columns: [],
    }
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
export function buildViewState(handlers: HandlerMap, events: Event[], currentState: ViewState): ViewState {
    console.time('buildViewState');
    const nextState = events.reduce((state, event) => {
        const handler = handlers[event.type];
        if (handler) {
            return handler(event, state);
        } else {
            return state;
        }
    }, currentState);
    console.timeEnd('buildViewState');
    return nextState;
}

export function buildValidationState(handlers: HandlerMap, events: Event[], currentState: ValidationState): ValidationState {
    console.time('buildValidationState');
    const nextState = events.reduce((state, event) => {
        const handler = handlers[event.type];
        if (handler) {
            return handler(event, state);
        } else {
            return state;
        }
    }, currentState);
    console.timeEnd('buildValidationState');
    return nextState;
}

/*               commands                */
export interface CreateRetro {
    type: "createRetro",
    retroId: string,
    retroName: string,
}

export function createRetro(retroId: string, retroName: string): CreateRetro {
    return {
        type: "createRetro",
        retroId,
        retroName,
    }
}

export interface AddColumn {
    type: "addColumn",
    id: string,
    name: string
}

export function addColumn(id: string, name: string): AddColumn {
    return {
        type: "addColumn",
        id,
        name
    }
}

export interface RemoveColumn {
    type: "removeColumn",
    id: string,
}

export function removeColumn(id: string): RemoveColumn {
    return {
        type: "removeColumn",
        id
    }
}

export interface Item {
    id: string,
    columnId: string,
    name: string
}

export interface AddItem {
    type: "addItem",
    item: Item
}

export function addItem(item: Item): AddItem {
    return {
        type: "addItem",
        item
    }
}

export interface RemoveItem {
    type: "removeItem",
    itemId: string,
    columnId: string
}

export function removeItem(itemId: string, columnId: string): RemoveItem {
    return {
        type: "removeItem",
        itemId,
        columnId
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

export type Command = CreateRetro | AddColumn | RemoveColumn | AddItem | RemoveItem | CompleteItem | UncompleteItem;


/*                events                 */

export interface RetroCreated {
    type: "retroCreated",
    retroId: string,
    retroName: string,
}

export function retroCreated(retroId: string, retroName: string): RetroCreated {
    return {
        type: "retroCreated",
        retroId,
        retroName,
    }
}

export interface ColumnAdded {
    type: "columnAdded",
    id: string,
    name: string,
}

export function columnAdded(id: string, name: string): ColumnAdded {
    return {
        type: "columnAdded",
        id,
        name
    }
}

export interface ColumnRemoved {
    type: "columnRemoved",
    id: string,
}

export function columnRemoved(id: string): ColumnRemoved{
    return {
        type: "columnRemoved",
        id,
    }
}

export interface ItemAdded {
    type: "itemAdded",
    item: Item,
}

export function itemAdded(item: Item): ItemAdded {
    return {
        type: "itemAdded",
        item,
    }
}

export interface ItemRemoved {
    type: "itemRemoved",
    itemId: string,
    columnId: string
}

export function itemRemoved(itemId: string, columnId: string): ItemRemoved {
    return {
        type: "itemRemoved",
        itemId,
        columnId
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

export type Event = RetroCreated | ColumnAdded | ColumnRemoved | ItemAdded | ItemRemoved | ItemCompleted | ItemUncompleted;

/*             event handlers            */

export interface HandlerMap {
    [eventName: string]: Function
}

export interface HandlersMap {
    [eventName: string]: Function[]
}

export const eventHandlers:HandlerMap = {
    retroCreated: (event, state) => ({...state, created: true}),
    columnAdded: (event, state) => ({
        ...state, 
        columnIds: state.columnIds.concat(event.id)
    }),
    columnRemoved: (event, state) => ({
        ...state, 
        columnIds: state.columnIds.filter((id) => id === event.id)
     }),
    itemAdded: (event, state) => ({
        ...state, 
        itemIds: state.itemIds.concat(event.item.id)
    }),
    itemRemoved: (event, state) => ({
        ...state, 
        itemIds: state.itemIds.filter((id) => id === event.itemId)
    }),
    itemCompleted: noopHandler,
    itemUncompleted: noopHandler,
};

/*                 state                 */
export function emptyState():ValidationState {
    return {
        created: false,
        columnIds: [],
        itemIds: []
    }
}

/*             command handlers             */
export const commandHandlers = {
    createRetro: (command: CreateRetro, state: ValidationState): CommandHandlerResponse => {
        const event = retroCreated(command.retroId, command.retroName);
        if (state.created) {
            return err(cannotCreateAlreadyCreatedRetro());
        }
        return ok(event);
    },

    addColumn: (command: AddColumn, state: ValidationState): CommandHandlerResponse => {
        const event = columnAdded(command.id, command.name);
        if (state.columnIds.indexOf(command.id) !== -1) {
            return err(columnAlreadyExists());
        }
        return ok(event);
    },

    removeColumn: (command: RemoveColumn, state: ValidationState): CommandHandlerResponse => {
        return ok(columnRemoved(command.id));
    },

    addItem: (command: AddItem, state: ValidationState): CommandHandlerResponse => {
        const event = itemAdded(command.item);
        if (state.itemIds.indexOf(command.item.id) !== -1) {
            return err(itemAlreadyExists());
        }
        return ok(event);
    },

    removeItem: (command: RemoveItem, state: ValidationState): CommandHandlerResponse => {
        return ok(itemRemoved(command.itemId, command.columnId));
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
