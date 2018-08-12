import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {World, Author, TouchstoneInstance, Constants, Newspaper, Article} from './sim';
import { tickStep, Timer } from '../node_modules/@types/d3/index';

type TouchstoneProps = {
    touchstone: TouchstoneInstance;
}

class TouchstoneC extends React.Component<TouchstoneProps> {
    render() {
        let cname = 'touchstone tooltip';
        if (this.props.touchstone.approval) {
            cname += ' positive';
        } else {
            cname += ' negative';
        }

        let name = this.props.touchstone.identity.name;
        let icon = this.props.touchstone.identity.icon;
        cname += " fas " + icon;

        return (
            <i key={name} className={cname}>
                <div className="tooltiptext">
                    {name}
                </div>
            </i>
        );
    }
}

type TouchstonesProps = {
    touchstones: TouchstoneInstance[];
}

class TouchstonesC extends React.Component<TouchstonesProps> {
    render() {
        let touchstones = this.props.touchstones.map((tsi) => {
            let key = tsi.identity.name;
            return <TouchstoneC key={key} touchstone={tsi} />
        });
        return <div>{touchstones}</div>;
    }
}

type AuthorProps = {
    author: Author;
}

class AuthorC extends React.Component<AuthorProps> {
    render() {
        return (
            <div className="author">
                <i className="fas fa-address-book avatar" />
                <div className="rows">
                    <div className="name">{this.props.author.name}</div>
                    <TouchstonesC touchstones={this.props.author.instances} />
                </div>
            </div>
        );
    }
}

type AuthorsProps = {
    authors: Author[];
}

class EmployedAuthorsC extends React.Component<AuthorsProps> {
    render() {
        let authors = this.props.authors.map((auth) => {
            return <AuthorC key={auth.name} author={auth} />
        });
        return (
            <div className="employedAuthors section">
                <h1>Employed Authors</h1>
                {authors}
            </div>
        );
    }
}

enum ArticleState {
    PENDING,
    STAGED,
    PUBLISHED
}

type ArticleProps = {
    article: Article;
    articleState: ArticleState;
    onAction?: () => void;
    onUnstage?: () => void;
}

class ArticleC extends React.Component<ArticleProps> {
    render() {
        let toStagedButton = null;
        if (this.props.articleState == ArticleState.PENDING) {
            toStagedButton = (
                <button className="rightJustify" onClick={this.props.onAction}>
                    <i className="fas fa-chevron-right"></i>
                </button>
            )
        }

        let fromStagedButton = null;
        if (this.props.articleState == ArticleState.STAGED) {
            fromStagedButton = (
                <button onClick={this.props.onAction}>
                    <i className="fas fa-chevron-left"></i>
                </button>
            );
        }
        return (
            <div className="article">
                {fromStagedButton}
                <i className="icon fas fa-file-alt"></i>
                <div className="rows">
                    <span className="headline">{this.props.article.headline}</span>
                    <TouchstonesC touchstones={this.props.article.instances} /> 
                </div>
                {toStagedButton}
            </div>
        );
    }
}

type ArticlesProps = {
    articles: Article[];
    articleState: ArticleState;
    onAction?: (article: Article) => void;
}

class ArticlesC extends React.Component<ArticlesProps> {
    render() {
        let articles = this.props.articles.map((art) => {
            let onAction: () => void = () => null;
            if (this.props.onAction !== undefined) {
                let target = this.props.onAction as (article: Article) => void;
                onAction = () => target(art);
            }

            return <ArticleC article={art}
                key={art.headline}
                articleState={this.props.articleState}
                onAction={onAction} />;
        });
        return (
            <div className="articles">
                {articles}
            </div>
        );
    }
}

type AppProps = {
    world: World;
}

class PendingArticlesC extends React.Component<AppProps> {
    render() {
        return (
            <div className="pendingArticles section">
                <h1>Pending Articles</h1>
                <ArticlesC articles={this.props.world.pendingArticles}
                    articleState={ArticleState.PENDING}
                    onAction={(art) => this.props.world.addArticleToCurrent(art)}
                />
            </div>
        );
    }
}

type PaperProps = {
    paper: Newspaper;
    isSummary: boolean;
    onAction?: (art: Article) => void;
}

class PaperC extends React.Component<PaperProps> {
    render() {
        return (
            <div className="paper">
                <ArticlesC articles={this.props.paper.articles}
                    articleState={ArticleState.STAGED}
                    onAction={this.props.onAction}
                />
            </div>
        );
    }
}

class NextEditionC extends React.Component<AppProps> {
    render() {
        return (
            <div className="currentPaper section">
                <h1>Next Edition</h1>
                <PaperC paper={this.props.world.nextEdition}
                    isSummary={false}
                    onAction={(art) => this.props.world.removeArticleFromCurrent(art)}
                />
            </div>
        );
    }
}

type StatProps = {
    name: string;
    value: string;
}

class StatRowC extends React.Component<StatProps> {
    render() {
        return (
            <div className="row">
                <span className="title">{this.props.name}</span>
                <span className="value">{this.props.value}</span>
            </div>
        )
    }
}

class StatsC extends React.Component<AppProps> {
    render() {
        let money = `\$${Math.floor(this.props.world.moneyInBank)}`;
        return (
            <div className="stats section">
                <h1>Stats</h1>
                <StatRowC name="Money" value={money} />
            </div>
        );
    }
}

class Game extends React.Component<AppProps, {}> {
    render() {
        return (
            <div className="game">
                <EmployedAuthorsC authors={this.props.world.employedAuthors} />
                <PendingArticlesC world={this.props.world} />
                <NextEditionC world={this.props.world} />
                <StatsC world={this.props.world} />
            </div>
        );
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
            let pauseButton = <button onClick={() => this.pauseGame(true)}>Pause</button>;
            if (this.state.gameState == GameState.PAUSED) {
                pauseButton = <button onClick={() => this.pauseGame(false)}>Un-Pause</button>;
            }
            return (
                <div>
                    <Game world={this.props.world}></Game>
                    {pauseButton}
                </div>
            );
        }
    }

    startGame() {
        this.setState({gameState: GameState.RUNNING});
    }

    pauseGame(pause: boolean) {
        if (pause) {
            this.setState({gameState: GameState.PAUSED});
        } else {
            this.setState({gameState: GameState.RUNNING});
        }
    }
}

let myWindow = window as any;
myWindow.world = new World();

ReactDOM.render(
    <App world={myWindow.world}></App>,
    document.getElementById('app')
)
