import { DraftState } from '../types/app';

const INITIAL_DRAFT_STATE: DraftState = {
    newItemNames: {},
    newColumnName: '',
};

export function draftReducer(draft = INITIAL_DRAFT_STATE, action): DraftState {
    switch (action.type) {
        case 'newItemInput':
            return {
                ...draft, 
                newItemNames: {
                    ...draft.newItemNames, 
                    [action.columnId]: action.newItemName
                }
            };

        case 'newColumnInput':
            return {...draft, newColumnName: action.newColumnName};

        case 'commandQueued':
            switch(action.command.type) {
                case 'addItem':
                    return {
                        ...draft, 
                        newItemNames: {
                            ...draft.newItemNames, 
                            [action.command.item.columnId]: ''
                        }
                    };
                case 'addColumn':
                    return {...draft, newColumnName: ''};
                default:
                    return draft;
            }

        default:
            return draft;
    }
}
