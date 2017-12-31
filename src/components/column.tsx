import * as React from 'react';
import { Item, IItemProps } from './item';

export interface IColumnProps {
    column: IColumn,
    onNewItemInput: (columnId: string, newItemName: string) => {},
    onNewItemSubmit: (columnId: string, newItemName: string) => {},
    onRemoveItemSubmit: (itemId: string, columnId: string) => {},
    newItemName: string,
}

export interface IColumn {
    id: string,
    name: string,
    items: IItemProps[]
}

export interface IColumnState {

}

export class Column extends React.PureComponent<IColumnProps, IColumnState> {
    render() {
        const {
            name,
            items
        } = this.props.column;
        const {
            newItemName,
            onRemoveItemSubmit
        } = this.props;

        return (<div style={{border: '1px solid black', margin: '5px', padding: '5px'}}>
            <h4>{name}</h4>
            <form onSubmit={this.onAddItem_}>
                <input onInput={this.onItemInputUpdated_} 
                    value={newItemName || ''} 
                    data-aid='NewItemName' />
                <button>Add item</button>
            </form>
            {items.reverse().map((item) => { 
                return <Item {...item} onRemoveItemSubmit={onRemoveItemSubmit}/>
            })}
            </div>);

    }

    onItemInputUpdated_ = (e) => {
        this.props.onNewItemInput(this.props.column.id, e.target.value);
    };

    onAddItem_ = (e) => {
        e.preventDefault();
        this.props.onNewItemSubmit(this.props.column.id, this.props.newItemName);
    };
}

