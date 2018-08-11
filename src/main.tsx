import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {World, Author, TouchstoneInstance, Constants} from './sim';
import { tickStep, Timer } from '../node_modules/@types/d3/index';

type TouchstoneProps = {
    touchstone: TouchstoneInstance;
}

class TouchstoneC extends React.Component<TouchstoneProps> {
    render() {
        let cname = 'touchstone';
        if (this.props.touchstone.approval) {
            cname += ' positive';
        } else {
            cname += ' negative';
        }

        return <span className={cname}>{this.props.touchstone.identity.name}</span>;
    }
}

type AuthorProps = {
    author: Author;
}

class AuthorC extends React.Component<AuthorProps> {
    render() {
        let touchstones = this.props.author.instances.map((tsi) => <TouchstoneC touchstone={tsi}></TouchstoneC>);
        return <div>{touchstones}</div>;
    }
}

type AuthorsProps = {
    authors: Author[];
}

class EmployedAuthorsC extends React.Component<AuthorsProps> {
    render() {
        let authors = this.props.authors.map((auth) => <AuthorC author={auth}></AuthorC>);
        return <div>{authors}</div>;
    }
}

type AppProps = {
    world: World;
}

class Game extends React.Component<AppProps, {}> {
    render() {
        return (
            <div className="game">
                <EmployedAuthorsC authors={this.props.world.employedAuthors}></EmployedAuthorsC>
            </div>
        )
    }
}

enum GameState {
    BOOT,
    RUNNING,
    PAUSED,
    OVER
}

type StartProps = {
    onStart: () => void;
}

class StartMenu extends React.Component<StartProps> {
    render() {
        return <button onClick={this.props.onStart}>Start</button>;
    }
}
type AppState = {
    gameState: GameState;
}

class App extends React.Component<AppProps, AppState> {
    timer: any;

    constructor(props: AppProps) {
        super(props);
        this.state = {gameState: GameState.BOOT};

    }

    componentDidMount() {
        let tickPeriod = 1000.0 / Constants.TicksPerSecond;
        // game loop
        let updateAndRender = () => {
            if (this.state.gameState == GameState.RUNNING) {
                myWindow.world.tick();
            }

            this.setState((prev) => ({...prev}));
            this.timer = setTimeout(updateAndRender, tickPeriod);
        }
        updateAndRender();
    }

    componentWillUnmount() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    render() {
        if (this.state.gameState == GameState.BOOT) {
            return <StartMenu onStart={() => this.startGame()}></StartMenu>;
        } else {
            return <Game world={this.props.world}></Game>;
        }
    }

    startGame() {
        this.setState({gameState: GameState.RUNNING});
    }
}

let myWindow = window as any;
myWindow.world = new World();

ReactDOM.render(
    <App world={myWindow.world}></App>,
    document.getElementById('app')
)
