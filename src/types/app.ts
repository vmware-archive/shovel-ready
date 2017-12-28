import { Command, Event } from "../core/retro";

export interface ServerSync {
    commands: Command[]
    events: Event[]
    latestVersion: number
}

export interface DraftState {
    newItemNames: Object,
    newColumnName: string
}

export interface StoreState {
    serverSync: ServerSync,
    draft: DraftState
}