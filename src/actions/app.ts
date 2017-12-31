import * as retro from '../core/retro';
import { guid } from '../helpers/guid';
import { AddColumn } from '../core/retro';

export type DraftAction = NewColumnInput | NewColumnSubmit | NewItemInput | NewItemSubmit | RemoveItemSubmit

export interface NewColumnInput {
    type: 'newColumnInput'
    newColumnName: string
}

export function newColumnInput(newColumnName: string): NewColumnInput {
    return {
        type: 'newColumnInput',
        newColumnName,
    }
}

export interface NewColumnSubmit {
    type: 'commandQueued'
    command: AddColumn
}

export function newColumnSubmit(newColumnName: string): NewColumnSubmit {
    const addColumnCommand = retro.addColumn(guid(), newColumnName);
    return {
        type: 'commandQueued',
        command: addColumnCommand,
    };
}

export interface NewItemInput {
    type: 'newItemInput',
    columnId: string,
    newItemName: string,
}

export function newItemInput(columnId: string, newItemName: string): NewItemInput {
    return {
        type: 'newItemInput',
        columnId,
        newItemName,
    }
}

export interface NewItemSubmit {
    type: 'commandQueued',
    command: retro.AddItem
}

export function newItemSubmit(columnId: string, newItemName: string): NewItemSubmit {
    const addItemCommand = retro.addItem({
        id: guid(), 
        name: newItemName,
        columnId: columnId 
    });
    return {
        type: 'commandQueued',
        command: addItemCommand,
    };
}

export interface RemoveItemSubmit {
    type: 'commandQueued',
    command: retro.RemoveItem
}

export function removeItemSubmit(itemId: string, columnId: string): RemoveItemSubmit {
    const removeItemCommand = retro.removeItem(
        itemId,
        columnId
    );
    return {
        type: 'commandQueued',
        command: removeItemCommand,
    };
}