import * as React from 'react';

export interface IColumnProps {
    column: IColumn,
    onNewItemInput: (columnId: string, newItemName: string) => {},
    onNewItemSubmit: (columnId: string) => {},
    onRemoveItemSubmit: (itemId: string, columnId: string) => {},
    newItemName: string,
}

export interface IColumn {
    id: string,
    name: string,
    items: IItem[]
}

export interface IColumnState {

}

export interface IItem {
    id: string,
    name: string,
}

export class Column extends React.PureComponent<IColumnProps, IColumnState> {
    render() {
        const {
            name,
            items
        } = this.props.column;
        const {
            newItemName
        } = this.props;

        return (<div style={{border: '1px solid black', margin: '5px', padding: '5px'}}>
            <h4>{name}</h4>
            <form onSubmit={this.onAddItem_}>
                <input onInput={this.onItemInputUpdated_} value={newItemName || ''} data-aid='NewItemName' />
                <button>Add item</button>
            </form>
            {items.reverse().map((item) => { 
                return <li key={item.id}>{item.name}{this.savingIndicator_(item)} - <button data-aid={item.id} onClick={this.onRemoveItemSubmit_} >❌</button></li>
            })}
            </div>);

    }

    savingIndicator_ = (item) => {
        if (item.pending) {
            return (<span>(saving)</span>);
        } else {
            return null;
        }
    };

    onRemoveItemSubmit_ = (e) => {
        this.props.onRemoveItemSubmit(e.target.getAttribute('data-aid'), this.props.column.id);
    };

    onItemInputUpdated_ = (e) => {
        this.props.onNewItemInput(this.props.column.id, e.target.value);
    };

    onAddItem_ = (e) => {
        e.preventDefault();
        this.props.onNewItemSubmit(this.props.column.id);
    };
}

