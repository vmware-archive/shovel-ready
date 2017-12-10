import * as React from 'react';
import { 
    IColumnProps, 
    IColumn,
    Column,
} from './column';

export interface IUIProps {
    newTaskName: string,
    newColumnName: string,
}

export interface IRetro {
    name: string,
    columns: IColumn[],
}

export interface IAppProps {
    retro: IRetro,
    ui: IUIProps,
    onNewTaskInput: (columnId: any, newTaskName: any) => {},
    onNewTaskSubmit: (columnId: any) => {},
    onNewColumnInput: (string) => {},
    onNewColumnSubmit: () => {},
}

export interface IAppState {
    
}

export default class App extends React.PureComponent<IAppProps, IAppState> {
    render() {
        const {
            retro, 
            ui,
            onNewTaskInput,
            onNewTaskSubmit
        } = this.props;
        console.log("retro.columns", retro.columns);

        return (
            <div>
                <h3>{retro.name}</h3>
                { retro.columns.map((column) => {
                    return <Column key={column.id} 
                        column={column}
                        newTaskName={ui.newTaskName}
                        onNewTaskInput={onNewTaskInput} 
                        onNewTaskSubmit={onNewTaskSubmit} />
                }) }
                <h3>Add Columns</h3>
                <form onSubmit={this.onAddColumn_}>
                    <input onInput={this.onColumnInputUpdated_} value={ui.newColumnName || ''} data-aid='NewColumnName' />
                    <button>Add Column</button> 
                </form>
            </div>
        );
    }

    onColumnInputUpdated_ = (e) => {
        this.props.onNewColumnInput(e.target.value);
    };

    onAddColumn_ = (e) => {
        e.preventDefault();
        this.props.onNewColumnSubmit();
    };
}