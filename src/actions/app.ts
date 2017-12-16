import * as retro from '../core/retro';
import { guid } from '../helpers/guid';

export function newColumnInput(newColumnName) {
    return {
        type: 'newColumnInput',
        newColumnName,
    }
}

export function newColumnSubmit(newColumnName) {
    const addColumnCommand = retro.addColumn(guid(), newColumnName);
    return {
        type: 'commandQueued',
        command: addColumnCommand,
    };
}

export function newItemInput(columnId, newItemName) {
    return {
        type: 'newItemInput',
        columnId,
        newItemName,
    }
}

export function newItemSubmit(columnId, newItemName) {
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

export function removeItemSubmit(itemId, columnId) {
    const removeItemCommand = retro.removeItem(
        itemId,
        columnId
    );
    return {
        type: 'commandQueued',
        command: removeItemCommand,
    };
}