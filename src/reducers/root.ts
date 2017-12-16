import { combineReducers } from "redux";
import { uiReducer } from "./ui";
import { serverSyncReducer } from './serverSync';

export const rootReducer = combineReducers({
    uiState: uiReducer,
    serverSync: serverSyncReducer,
});