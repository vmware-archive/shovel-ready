import * as React from 'react';

export interface IItemProps {
    id: string,
    name: string,
    pending: boolean,
    columnId: string,
    onRemoveItemSubmit: (itemId: string, columnId: string) => {},
}

export interface IItemState {

}

export class Item extends React.PureComponent<IItemProps, IItemState> {
    render() {
        const {
            name, id
        } = this.props;

        return <li key={id}>
            {name}{this.savingIndicator_()} - 
            <button data-aid={id} onClick={this.onRemoveItemSubmit_}>❌</button>
            </li>
    }

    savingIndicator_ = () => {
        if (this.props.pending) {
            return (<span>(saving)</span>);
        } else {
            return null;
        }
    };

    onRemoveItemSubmit_ = (e) => {
        this.props.onRemoveItemSubmit(e.target.getAttribute('data-aid'), this.props.columnId);
    };
}