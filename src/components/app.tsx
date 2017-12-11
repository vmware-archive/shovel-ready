import * as React from 'react';
import { 
    IColumnProps, 
    IColumn,
    Column,
} from './column';

export interface IUIProps {
    newItemNames: Map<string, string>,
    newColumnName: string,
}

export interface IRetro {
    name: string,
    columns: IColumn[],
}

export interface IAppProps {
    retro: IRetro,
    ui: IUIProps,
    onNewItemInput: (columnId: any, newItemName: any) => {},
    onNewItemSubmit: (columnId: any) => {},
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
            onNewItemInput,
            onNewItemSubmit,
            onRemoveItemSubmit
        } = this.props;

        return (
            <div>
                <h3>{retro.name}</h3>
                <div style={{display: 'flex'}} >
                    { retro.columns.map((column) => {
                        return <Column key={column.id} 
                            column={column}
                            newItemName={ui.newItemNames[column.id]}
                            onRemoveItemSubmit={onRemoveItemSubmit}
                            onNewItemInput={onNewItemInput} 
                            onNewItemSubmit={onNewItemSubmit} />
                    }) }
                </div>
                <h3>Add Column</h3>
                <form onSubmit={this.onAddColumn_}>
                    <input onInput={this.onColumnInputUpdated_} 
                        value={ui.newColumnName || ''} 
                        data-aid='NewColumnName' />
                    <button>Add Column</button> 
                </form>
                <a href="/">Back to all retros</a>
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