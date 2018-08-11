import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {World} from './sim';


class App extends React.Component<{}, {}> {
    render() {
        return <h1>Hello World</h1>;
    }
}

let myWindow = window as any;
myWindow.world = new World();

ReactDOM.render(
    <App></App>,
    document.getElementById('app')
)