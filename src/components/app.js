import React from 'react';

export default class App extends React.Component {
    render() {
        const {list, ui} = this.props;
        console.log("LIST.ITEMS", list.items);

        return (
            <div>
                <span>Hello World {list.name}</span>
                {list.items.map((item) => { return <li key={item.id}>{item.name}</li> })}
                <form onSubmit={this.onAddItem_}>
                    <input onInput={this.onTaskInputUpdated_} value={ui.newTaskName || ''} />
                    <button>Add item</button>
                </form>
            </div>
        );
    }

    onTaskInputUpdated_ = (e) => {
        this.props.onNewTaskInput(e.target.value);
    }

    onAddItem_ = (e) => {
        e.preventDefault();
        this.props.onNewTaskSubmit();
    }
}