import { ServerSync } from '../types/app';

const INITIAL_SERVER_SYNC: ServerSync = {
    commands: [],
    events: [],
    latestVersion: 0
}

export function serverSyncReducer(state: ServerSync = INITIAL_SERVER_SYNC, action) {
    switch (action.type) {
        case 'commandQueued':
            switch (action.command.type) {
                case 'addItem':
                case 'addColumn':
                case 'removeItem':
                    return {
                        ...state,
                        commands: state.commands.concat([action.command])
                    };
            }
        case 'commandSuccessfullyExecutedOnServer':
            return {
                ...state,
                events: state.events.concat([action.event]),
                commands: state.commands.slice(1),
                latestVersion: state.latestVersion + 1,
            };
        case 'outOfDate':
            return {
                ...state,
                events: state.events.concat(action.missingEvents),
                latestVersion: state.latestVersion + action.missingEvents.length,
            };
        case 'eventsReceived':
            if (state.commands.length > 0) {
                return state;
            } else {
                if (action.latestVersion > state.latestVersion) {
                    return {
                        ...state,
                        events: state.events.concat(action.events),
                        latestVersion: action.latestVersion,
                    };
                } else {
                    return state;
                }
            }
        default:
            return state;
    }
}