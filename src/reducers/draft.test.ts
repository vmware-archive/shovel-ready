import { draftReducer } from './draft';
import { DraftState, INITIAL_DRAFT_STATE } from '../types/app';
import { newColumnInput } from '../actions/app';

test("newColumnInput sets newColumnName", () => {
    const action = newColumnInput('new column');
    expect(draftReducer(INITIAL_DRAFT_STATE, action).newColumnName).toBe('new column');
});
