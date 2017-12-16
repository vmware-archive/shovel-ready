import { connect } from 'react-redux';
import * as appActions from '../actions/app';
import App from '../components/app';
import * as retro from '../core/retro';
import {viewStateHandlers} from '../handlers/viewState';
import * as serverSync from '../server_sync';
import {handleCommands} from '../handlers/command';
import { IRetro } from '../components/app';

function calcViewState(state): retro.ViewState {
    console.time('calcViewState');
    let viewState = retro.buildViewState(viewStateHandlers, serverSync.events(state.serverSync), retro.emptyViewState());
    let validationState = retro.buildValidationState(retro.eventHandlers, serverSync.events(state.serverSync), retro.emptyState());
    const commands = serverSync.commands(state.serverSync);
    viewState = handleCommands(commands, validationState, viewState);
    console.timeEnd('calcViewState');
    return viewState;
}

const mapStateToProps = state => {
    return {
        ui: (state || {}).uiState,
        retro: calcViewState(state) as IRetro, // BOO!
    }
}

const mapDispatchToProps = dispatch => {
    return {
        onNewColumnInput: name => dispatch(appActions.newColumnInput(name)),
        onNewColumnSubmit: name => dispatch(appActions.newColumnSubmit(name)),
        onNewItemInput: (columnId, newItemName) => dispatch(appActions.newItemInput(columnId, newItemName)),
        onNewItemSubmit: (columnId, newItemName) => dispatch(appActions.newItemSubmit(columnId, newItemName)),
        onRemoveItemSubmit: (itemId, columnId) => dispatch(appActions.removeItemSubmit(itemId, columnId)),
    }
}

const AppContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(App);

export default AppContainer