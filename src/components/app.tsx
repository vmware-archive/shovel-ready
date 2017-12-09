import * as React from 'react';

export interface UIProps {
    newTaskName: string,
    newColumnName: string,
}

export interface Retro {
    name: string,
    items: RetroItem[],
    columns: RetroColumn[],
}

export interface RetroItem {
    id: string,
    name: string,
}

export interface RetroColumn {
    id: string,
    name: string,
}

export interface AppProps {
    retro: Retro,
    ui: UIProps,
    onNewTaskInput: (string) => {},
    onNewTaskSubmit: () => {},
    onNewColumnInput: (string) => {},
    onNewColumnSubmit: () => {},
}

export interface AppState {
    
}

export default class App extends React.PureComponent<AppProps, AppState> {
    render() {
        const {retro, ui} = this.props;

        return (
            <div>
                <span>{retro.name}</span>
                <h1>Columns</h1>
                { retro.columns.map((column) => { return <div key={column.id}>{column.name}</div> })}
                <form onSubmit={this.onAddColumn_}>
                    <input onInput={this.onColumnInputUpdated_} value={ui.newColumnName || ''} data-aid='NewColumnName' />
                    <button>Add Column</button> 
                </form>
                <form onSubmit={this.onAddItem_}>
                    <span>{retro.items.length}</span>
                    <input onInput={this.onTaskInputUpdated_} value={ui.newTaskName || ''} data-aid='NewTaskName' />
                    <button>Add item</button>
                </form>
                {retro.items.reverse().map((item) => { return <li key={item.id}>{item.name}{this.savingIndicator_(item)}</li> })}
            </div>
        );
    }

    savingIndicator_ = (item) => {
        if (item.pending) {
            return (<span>(saving)</span>);
        } else {
            return null;
        }
    };

    onColumnInputUpdated_ = (e) => {
        this.props.onNewColumnInput(e.target.value);
    };

    onAddColumn_ = (e) => {
        e.preventDefault();
        this.props.onNewColumnSubmit();
    };

    onTaskInputUpdated_ = (e) => {
        this.props.onNewTaskInput(e.target.value);
    };

    onAddItem_ = (e) => {
        e.preventDefault();
        this.props.onNewTaskSubmit();
    };
}