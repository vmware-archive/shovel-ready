export const viewStateHandlers = {
    retroCreated: (event, state) => {
        return {...state, name: event.retroName};
    },
    columnAdded: (event, state, pending = false) => {
        return {...state, columns: state.columns.concat({name: event.name, id: event.id, items: [], pending: pending})};
    },
    columnRemoved: (event, state, pending = false) => {
        return {...state, columns: state.columns.filter((id) => id === event.id)};
    },
    itemAdded: (event, state, pending = false) => {
        // TODO: MORE FUNCTIONAL WAY TO DO THIS?
        // THIS IS SUPER DIRTY!!
        let foundColumnIndex = 0;
        let column = state.columns.find((column, columnIndex) => {
            foundColumnIndex = columnIndex;
            return event.item.columnId === column.id;
        });  
        state.columns[foundColumnIndex].items = state.columns[foundColumnIndex].items.concat(event.item);
        return state;
    },
    itemRemoved: (event, state, pending = false) => {
        // TODO: Do this in a better way
        let newColumns = [...state.columns];
        newColumns.forEach((column) => {
            if (column.id === event.columnId) {
                column.items = column.items.filter((item) => item.id !== event.itemId);
            }
        });
        let newState = {...state, columns: newColumns};
        return newState
    }
};
