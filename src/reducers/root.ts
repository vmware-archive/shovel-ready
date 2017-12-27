import { combineReducers } from "redux";
import { draftReducer } from "./draft";
import { serverSyncReducer } from './serverSync';

export const rootReducer = combineReducers({
    draft: draftReducer,
    serverSync: serverSyncReducer,
});