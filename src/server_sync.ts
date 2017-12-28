import * as retro from './core/retro';
import { Store } from 'redux';
import { StoreState, ServerSync } from './types/app';
import { CommandHandlerResponse, ValidationState, Command, Event } from './core/retro';

export function init(commands: Command[], events: Event[], latestVersion: number): ServerSync {
    return {
        commands,
        events,
        latestVersion,
    };
}

export function commands(state) {
    return state.commands;
}

export function events(state) {
    return state.events;
}

export function syncWithServer(retroId: string, store: Store<StoreState>, fetchSyncState, fetchEvents) {
    processCommands(retroId, store, fetchSyncState);
    pollForEvents(retroId, store, fetchSyncState, fetchEvents);
}

function pollForEvents(retroId: string, store: Store<StoreState>, fetchSyncState, fetchEvents) {
    setTimeout(() => {
        fetchEvents(retroId, fetchSyncState(store).latestVersion + 1).then((eventRecords) => {
            if (eventRecords.length > 0) {
                store.dispatch({
                    type: 'eventsReceived',
                    events: eventRecords.map(eventRecord => eventRecord.eventData),
                    latestVersion: eventRecords.length > 0 ? eventRecords[eventRecords.length - 1].retroVersion : undefined,
                });
            }
            pollForEvents(retroId, store, fetchSyncState, fetchEvents);
        });
    }, 1000);
}

function executeCommand(state: ServerSync, command: Command): CommandHandlerResponse {
    const validationState = retro.buildValidationState(retro.eventHandlers, state.events, retro.emptyState());

    if (command.type === 'addItem') {
        return retro.commandHandlers.addItem(command, validationState);
    } else if (command.type === 'addColumn') {
        return retro.commandHandlers.addColumn(command, validationState);
    } else if (command.type === 'removeItem') {
        return retro.commandHandlers.removeItem(command, validationState);
    } else {
        throw "command not handled in executeCommand"
    }
}

function processCommands(retroId: string, store: Store<StoreState>, fetchSyncState) {
    let processingCommands = false;
    const processNextCommand = () => {
        const state = fetchSyncState(store);
        if (state.commands.length >= 1 && !processingCommands) {
            processingCommands = true;
            const command = state.commands[0];
            const {type} = executeCommand(state, command);

            if (type === 'ok') {
                const body = {
                    clientVersion: state.latestVersion,
                    command: command,
                };

                return fetch(`/${retroId}/commands`, {
                    method: "POST",
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(body)
                }).then((res) => res.json()).then((resData) => {
                    if (resData.type === 'success') {
                        store.dispatch({type: 'commandSuccessfullyExecutedOnServer', event: resData.event});
                    } else if (resData.type === 'outOfDate') {
                        store.dispatch({type: 'outOfDate', missingEvents: resData.missingEvents});
                    } else {
                        store.dispatch({type: 'commandFailureResponse', err: resData});
                    }
                    processingCommands = false;
                    processNextCommand();
                });
            } else {
                return null;
            }
        }
    };
    store.subscribe(processNextCommand);
}