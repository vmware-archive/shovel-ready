import * as React from 'react';

export interface UIProps {
    newTaskName: string,
}

export interface Retro {
    name: string,
    items: RetroItem[],
}

export interface RetroItem {
    id: string,
    name: string,
}

export interface AppProps {
    retro: Retro,
    ui: UIProps,
    onNewTaskInput: (string) => {},
    onNewTaskSubmit: () => {},
}

export interface AppState {
    
}

export default class App extends React.PureComponent<AppProps, AppState> {
    render() {
        const {retro, ui} = this.props;

        return (
            <div>
                <span>{retro.name}</span>
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

    onTaskInputUpdated_ = (e) => {
        this.props.onNewTaskInput(e.target.value);
    };

    onAddItem_ = (e) => {
        e.preventDefault();
        this.props.onNewTaskSubmit();
    };
}