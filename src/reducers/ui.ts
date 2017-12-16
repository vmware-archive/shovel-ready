const INITIAL_UI_STATE = {
    newItemNames: {},
    newColumnName: '',
};

export function uiReducer(uiState = INITIAL_UI_STATE, action) {
    switch (action.type) {
        case 'newItemInput':
            return {
                ...uiState, 
                newItemNames: {
                    ...uiState.newItemNames, 
                    [action.columnId]: action.newItemName
                }
            };

        case 'newColumnInput':
            return {...uiState, newColumnName: action.newColumnName};

        case 'commandQueued':
            switch(action.command.type) {
                case 'addItem':
                    return {
                        ...uiState, 
                        newItemNames: {
                            ...uiState.newItemNames, 
                            [action.command.item.columnId]: ''
                        }
                    };
                case 'addColumn':
                    return {...uiState, newColumnName: ''};
                default:
                    return uiState;
            }

        default:
            return uiState;
    }
}
