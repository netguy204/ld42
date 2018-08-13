import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {World, Author, TouchstoneInstance, Constants, Newspaper, Article, Timer, Population} from './sim';
import * as numbro from 'numbro';

type TouchstoneProps = {
    touchstone: TouchstoneInstance;
    count: number;
}

class TouchstoneC extends React.Component<TouchstoneProps> {
    render() {
        let sentiment = '';
        if (this.props.touchstone.approval) {
            sentiment = ' fa-thumbs-up';
        } else {
            sentiment = ' fa-thumbs-down';
        }

        let name = this.props.touchstone.toString();
        let icon = this.props.touchstone.identity.icon;
        let cname = 'touchstone tooltip fas ' + icon;

        let countBadge: any = null;
        if (this.props.count > 1) {
            countBadge = (
                <div className="countBadge">
                    {this.props.count}
                </div>
            );
        }

        return (
            <i key={name} className={cname}>
                <div className="sentimentBadge">
                    <i className={"far " + sentiment}></i>
                </div>
                {countBadge}
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
        let counts: {[key: string]:number} = {};
        let instances: {[key: string]:any} = {};

        this.props.touchstones.forEach((tsi) => {
            let current = counts[tsi.toString()] || 0;
            counts[tsi.toString()] = current + 1;
            instances[tsi.toString()] = tsi;
        });

        let touchstones = [];
        for (let prop in counts) {
            if (counts.hasOwnProperty(prop)) {
                touchstones.push(<TouchstoneC key={prop} touchstone={instances[prop]} count={counts[prop]} />)
            }
        }
        return <div>{touchstones}</div>;
    }
}

type ProgressBarProps = {
    timer: Timer;
}

class RunningOutBar extends React.Component<ProgressBarProps> {
    render() {
        let ratio = this.props.timer.ticksRemaining / this.props.timer.startTicks;
        let style = {width: `${ratio*100}%`};

        return (
            <div className="barFrame">
                <div className="barFill" style={style}></div>
            </div>
        );
    }
}

class FillingUpBar extends React.Component<ProgressBarProps> {
    render() {
        let ratio = 1 - (this.props.timer.ticksRemaining / this.props.timer.startTicks);
        let style = {width: `${ratio*100}%`};

        return (
            <div className="barFrame">
                <div className="barFill" style={style}></div>
            </div>
        );
    }
}

type AuthorProps = {
    author: Author;
    onAction?: () => void;
}

class EmployedAuthorC extends React.Component<AuthorProps> {
    render() {
        return (
            <div className="author">
                <i className="far fa-address-book avatar" />
                <div className="rows">
                    <div className="name">{this.props.author.name}</div>
                    <TouchstonesC touchstones={this.props.author.instances} />
                    <FillingUpBar timer={this.props.author.articleTimer} />
                </div>
                <button className="rightJustify" onClick={this.props.onAction}>
                    <span className="vertical">
                        Fire
                    </span>
                </button>
            </div>
        );

    }
}

class AvailableAuthorC extends React.Component<AuthorProps> {
    render() {
        return (
            <div className="author">
                <i className="far fa-address-book avatar" />
                <div className="rows">
                    <div className="name">{this.props.author.name}</div>
                    <TouchstonesC touchstones={this.props.author.instances} />
                    <RunningOutBar timer={this.props.author.hireTimer} />
                </div>
                <button onClick={this.props.onAction}>
                    <span className="vertical">
                        Hire
                    </span>
                </button>
            </div>
        );
    }
}

class EmployedAuthorsC extends React.Component<AppProps> {
    render() {
        let authors = this.props.world.employedAuthors.map((auth) => {
            let fire = () => this.props.world.fire(auth);
            return <EmployedAuthorC key={auth.name} author={auth} onAction={fire} />
        });
        return (
            <div className="employedAuthors">
                {authors}
            </div>
        );
    }
}

class AvailableAuthorsC extends React.Component<AppProps> {
    render() {
        let authors = this.props.world.availableAuthors.map((auth) => {
            let hire = () => this.props.world.hire(auth);
            return <AvailableAuthorC key={auth.name} author={auth} onAction={hire} />
        });
        return (
            <div className="availableAuthors">
                {authors}
            </div>
        );
    }
}

class AuthorsC extends React.Component<AppProps> {
    render() {
        return (
            <div className="authors section">
                <h1>Employed Authors</h1>
                <EmployedAuthorsC world={this.props.world} />
                
                <h1>Available Authors</h1>
                <AvailableAuthorsC world={this.props.world} />
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
        let pendingTimer = null;
        if (this.props.articleState == ArticleState.PENDING) {
            toStagedButton = (
                <button className="rightJustify" onClick={this.props.onAction}>
                    <span className="vertical">
                        Publish
                    </span>
                </button>
            )

            pendingTimer = <RunningOutBar timer={this.props.article.pendingTimer} />;
        }

        let fromStagedButton = null;
        if (this.props.articleState == ArticleState.STAGED) {
            fromStagedButton = (
                <button onClick={this.props.onAction}>
                    <span className="vertical">
                        Scrap
                    </span>
                </button>
            );
        }

        return (
            <div className="article">
                {fromStagedButton}
                <i className="icon far fa-file-alt"></i>
                <div className="rows">
                    <span className="headline">{this.props.article.headline}</span>
                    <TouchstonesC touchstones={this.props.article.instances} /> 
                    {pendingTimer}
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
                <RunningOutBar timer={this.props.world.nextEditionTimer} />
                <PaperC paper={this.props.world.nextEdition}
                    isSummary={false}
                    onAction={(art) => this.props.world.removeArticleFromCurrent(art)}
                />
            </div>
        );
    }
}

class CollapsedPaperC extends React.Component<PaperProps> {
    render() {
        return (
            <div className="collapsedPaper">
                <TouchstonesC touchstones={this.props.paper.touchstones()} />
            </div>
        );
    }
}

type PublicMemoryProps = {
    papers: Newspaper[];
}

class MissedEdition extends React.Component<{}> {
    render() {
        return (
            <div className="collapsedPaper">
                Missed Edition!
            </div>
        );
    }
}

class PublicMemory extends React.Component<PublicMemoryProps> {
    render() {
        let publicMemory = this.props.papers.map(paper => {
            if (paper.articles.length > 0) {
                let key = paper.articles[0].headline;
                return <CollapsedPaperC paper={paper} key={key} isSummary={true} />
            }
            return <MissedEdition />
        });

        return (
            <div className="publicMemory">
                {publicMemory}
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
            <div className="statRow">
                <span className="title">{this.props.name}</span>
                <span className="value">{this.props.value}</span>
            </div>
        )
    }
}

class ConsoleC extends React.Component<AppProps> {
    render() {
        let logLines = this.props.world.logMessages.map((line) => {
            return <div className="logLine" key={line}>{line}</div>;
        });
        return (
            <div className="logMessages rows">
                {logLines}
            </div>
        );
    }
}


class StatsC extends React.Component<AppProps> {
    render() {
        let money = `\$${numbro(this.props.world.moneyInBank).format({average: true})}`;
        let subscribers = numbro(this.props.world.numSubscribers()).format({average: true});

        return (
            <div className="stats section">
                <div className="statGroup">
                    <h1>Public Memory</h1>
                    <PublicMemory papers={this.props.world.publicMemory} />
                </div>

                <div className="statGroup">
                    <h1>Stats</h1>
                    <StatRowC name="Money" value={money} />
                    <StatRowC name="Subscribers" value={subscribers} />
                </div>

                <div className="statGroup">
                    <h1>Log</h1>
                    <ConsoleC world={this.props.world} />
                </div>
            </div>
        );
    }
}

type PopulationProps = {
    population: Population;
    style?: {};
}

class SubscriberRatioC extends React.Component<PopulationProps> {
    render() {
        let ratio = this.props.population.subscriberRatio();
        let style = {width: `${ratio*100}%`};

        return (
            <div className="barFrame">
                <div className="barFill" style={style}></div>
            </div>
        );
    }
}

type LoyaltyProps = {
    loyalty: number;
}

class LoyaltyC extends React.Component<LoyaltyProps> {
    render() {
        let icon = "fa-meh";
        if (this.props.loyalty < -.3) {
            icon = "fa-frown";
        }
        if (this.props.loyalty < -.5) {
            icon = "fa-angry";
        }
        if (this.props.loyalty < -.7) {
            icon = "fa-dizzy";
        }

        if (this.props.loyalty > .3) {
            icon = "fa-grin-alt";
        }
        if (this.props.loyalty > .5) {
            icon = "fa-smile-wink";
        }
        if (this.props.loyalty > .7) {
            icon = "fa-grin-hearts";
        }

        return <i className={"far loyalty " + icon}></i>;
    }
}
class PopulationC extends React.Component<PopulationProps> {
    render() {

        return (
            <div className="population" style={this.props.style}>
                <div className="rows">
                    <div className="name">
                        {this.props.population.name}
                        <LoyaltyC loyalty={this.props.population.lastLoyalty} />
                    </div>
                    <TouchstonesC touchstones={this.props.population.instances} />
                    <SubscriberRatioC population={this.props.population} />
                </div>
            </div>
        );
    }
}

class RegionsC extends React.Component<AppProps> {
    render() {
        let worldPopulation = 0;
        this.props.world.populations.forEach((pop) => {
            worldPopulation += pop.totalPopulation;
        });

        let populations = this.props.world.populations.map((pop) => {
            let ratio = pop.totalPopulation / worldPopulation;
            let style = {width: `${ratio*100}%`};
            return <PopulationC key={pop.name} population={pop} style={style} />;
        });
        return (
            <div className="regions">
                {populations}
            </div>
        );
    }
}

class Game extends React.Component<AppProps, {}> {
    render() {
        return (
            <div className="gameRows">
                <div className="gameColumns">
                    <AuthorsC world={this.props.world} />
                    <PendingArticlesC world={this.props.world} />
                    <NextEditionC world={this.props.world} />
                    <StatsC world={this.props.world} />
                </div>
                <RegionsC world={this.props.world} />
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
