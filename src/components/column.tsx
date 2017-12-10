import * as React from 'react';

export interface IColumnProps {
    column: IColumn,
    onNewTaskInput: (columnId: string, newTaskName: string) => {},
    onNewTaskSubmit: (columnId: string) => {},
    newTaskName: string,
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
            newTaskName
        } = this.props;

        return (<div>
            <h4>{name}</h4>
            <form onSubmit={this.onAddItem_}>
                <input onInput={this.onTaskInputUpdated_} value={newTaskName || ''} data-aid='NewTaskName' />
                <button>Add item</button>
            </form>
            {items.reverse().map((item) => { return <li key={item.id}>{item.name}{this.savingIndicator_(item)}</li> })}
            </div>);

    }

    savingIndicator_ = (item) => {
        if (item.pending) {
            return (<span>(saving)</span>);
        } else {
            return null;
        }
    };

    onTaskInputUpdated_ = (e) => {
        this.props.onNewTaskInput(this.props.column.id, e.target.value);
    };

    onAddItem_ = (e) => {
        e.preventDefault();
        this.props.onNewTaskSubmit(this.props.column.id);
    };
}

