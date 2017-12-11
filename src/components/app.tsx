import * as React from 'react';
import { 
    IColumnProps, 
    IColumn,
    Column,
} from './column';

export interface IUIProps {
    newTaskNames: Map<string, string>,
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
    onRemoveItemSubmit: (itemId: string, columnId: string) => {},
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
            onNewTaskSubmit,
            onRemoveItemSubmit
        } = this.props;

        return (
            <div>
                <h3>{retro.name}</h3>
                <div style={{display: 'flex'}} >
                    { retro.columns.map((column) => {
                        return <Column key={column.id} 
                            column={column}
                            newTaskName={ui.newTaskNames[column.id]}
                            onRemoveItemSubmit={onRemoveItemSubmit}
                            onNewTaskInput={onNewTaskInput} 
                            onNewTaskSubmit={onNewTaskSubmit} />
                    }) }
                </div>
                <h3>Add Column</h3>
                <form onSubmit={this.onAddColumn_}>
                    <input onInput={this.onColumnInputUpdated_} 
                        value={ui.newColumnName || ''} 
                        data-aid='NewColumnName' />
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