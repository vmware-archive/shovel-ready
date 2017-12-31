import { Command, Event } from "../core/retro";

export interface ServerSync {
    commands: Command[]
    events: Event[]
    latestVersion: number
}

export const INITIAL_DRAFT_STATE: DraftState = {
    newItemNames: {},
    newColumnName: '',
};

export interface DraftState {
    newItemNames: Object,
    newColumnName: string
}

export interface StoreState {
    serverSync: ServerSync,
    draft: DraftState
}