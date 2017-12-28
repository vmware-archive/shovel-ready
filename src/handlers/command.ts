import * as retro from '../core/retro';
import { viewStateHandlers } from '../handlers/viewState';
import { ViewState } from '../core/retro';

export function handleCommands(commands: retro.Command[], validationState: retro.ValidationState, viewState: ViewState): ViewState {
    for (let i = 0; i < commands.length; i++) {
        let command = commands[i];
        let response: retro.CommandHandlerResponse | null;

        switch (command.type) {
            case "addItem": 
                response = retro.commandHandlers.addItem(command, validationState);
                break;
            case "removeItem": 
                response = retro.commandHandlers.removeItem(command, validationState);
                break;
            case "addColumn":
                response = retro.commandHandlers.addColumn(command, validationState);
                break;
            default:
                response = null;
        }
        if (response) {
            switch(response.type) {
                case 'ok':
                    const event = response.value;
                    viewState = viewStateHandlers[event.type](event, viewState, true);
                    validationState = retro.eventHandlers[event.type](event, validationState);
                    break;
                case 'err':
                    console.log('error: ', response.value);
                    break;
            }
        }
    }
    return viewState;
}

