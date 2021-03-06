import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {World, Author, TouchstoneInstance, Constants, Newspaper, Article, Timer, Population} from './sim';
import * as numbro from 'numbro';
import Hotkeys from 'react-hot-keys';

type InfoProps = {
    modifier?: string;
}

class InfoIcon extends React.Component<InfoProps> {
    render() {
        let modifier = "";
        if (this.props.modifier != null) {
            modifier = this.props.modifier;
        }
        return (
            <i className="infoIcon fas fa-info-circle tooltip">
                <div className={"tooltiptext " + modifier}>
                    {this.props.children}
                </div>
            </i>
        );
    }
}

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
        let actionButton: any = null;
        if (this.props.onAction != null) {
            actionButton = <button onClick={this.props.onAction}>
                <span className="vertical">
                    Hire
                </span>
            </button>
        }

        return (
            <div className="author">
                <i className="far fa-address-book avatar" />
                <div className="rows">
                    <div className="name">{this.props.author.name}</div>
                    <TouchstonesC touchstones={this.props.author.instances} />
                    <RunningOutBar timer={this.props.author.hireTimer} />
                </div>
                {actionButton}
            </div>
        );
    }
}

class EmptyAuthorC extends React.Component<{}> {
    render() {
        return (
            <div className="emptyAuthor">
                <i className="far fa-address-book avatar" />
                <div className="rows">
                    <div className="name"></div>
                </div>
                <div className="overlay"></div>
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
        let blankAuthors: any[] = [];
        for (let i = authors.length; i < Constants.MaxAuthors; i++) {
            blankAuthors.push(<EmptyAuthorC key={i} />);
        }
        return (
            <div className="employedAuthors">
                {authors}
                {blankAuthors}
            </div>
        );
    }
}

class AvailableAuthorsC extends React.Component<AppProps> {
    render() {
        let authors = this.props.world.availableAuthors.map((auth) => {
            let hire: any = null;
            if (this.props.world.employedAuthors.length < Constants.MaxAuthors) {
                hire = () => this.props.world.hire(auth);
            }

            return <AvailableAuthorC key={auth.name} author={auth} onAction={hire} />
        });

        let blankAuthors: any[] = [];
        for (let i = authors.length; i < Constants.MaxApplicants; i++) {
            blankAuthors.push(<EmptyAuthorC key={i} />);
        }

        return (
            <div className="availableAuthors">
                {authors}
                {blankAuthors}
            </div>
        );
    }
}

class AuthorsC extends React.Component<AppProps> {
    render() {
        return (
            <div className="authors section">
                <div className="header">
                    <h1>Employed Authors</h1>
                    <InfoIcon>
                        <section>
                            These authors work for you. When their bar fills up they create an article that
                            you can choose to publish.
                        </section>
                        <section>
                            You can fire these authors and you should if they aren't producing the stories
                            your audience demands.
                        </section>
                    </InfoIcon>
                </div>
                <EmployedAuthorsC world={this.props.world} />
                
                <div className="header">
                    <h1>Available Authors</h1>
                    <InfoIcon>
                        <section>
                            These are authors that are available to hire. You should only hire them if they
                            appeal to an audience you are working to reach.
                        </section>
                    </InfoIcon>
                </div>
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

class EmptyArticleC extends React.Component<{}> {
    render() {
        return (
            <div className="emptyArticle">
                <i className="icon far fa-file-alt"></i>
                <div className="overlay"></div>
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
        let missing: any[] = [];
        for (let i = this.props.world.pendingArticles.length; i < Constants.MaxPendingArticles; ++i) {
            missing.push(<EmptyArticleC key={i} />);
        }

        return (
            <div className="pendingArticles section">
                <div className="header">
                    <h1>Pending Articles</h1>
                    <InfoIcon>
                        <section>
                            These articles have been written by your authors and are available
                            to be included in the next edition.
                        </section>
                        <section>
                            You should include them if they appeal to your audience.
                        </section>
                        <section>
                            They are losing their relevance and will eventually be worthless.
                        </section>
                    </InfoIcon>
                </div>
                <ArticlesC articles={this.props.world.pendingArticles}
                    articleState={ArticleState.PENDING}
                    onAction={(art) => this.props.world.addArticleToCurrent(art)}
                />
                {missing}
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
        let missing: any[] = [];
        for (let i = this.props.world.nextEdition.articles.length; i < Constants.MaxEditionArticles; ++i) {
            missing.push(<EmptyArticleC key={i} />);
        }

        return (
            <div className="currentPaper section">
                <div className="header">
                    <h1>Next Edition</h1>
                    <InfoIcon>
                        <section>
                            This is the next edition of your newspaper. It will be published when
                            the bar runs out.
                        </section>
                        <section>
                            You can add or remove articles until the paper is published. Once the
                            paper is published it will be part of the public memory and you will
                            be judged for its contents.
                        </section>
                    </InfoIcon>
                </div>
                <RunningOutBar timer={this.props.world.nextEditionTimer} />
                <PaperC paper={this.props.world.nextEdition}
                    isSummary={false}
                    onAction={(art) => this.props.world.removeArticleFromCurrent(art)}
                />
                {missing}
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
        let messages = this.props.world.logMessages.concat();
        messages.reverse();

        let logLines = messages.map((line) => {
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
        let formatAvg = (num: number) => numbro(num).format({average: true});
        let formatMoney = (num: number) => `\$${formatAvg(num)}`;
        let money = formatMoney(this.props.world.moneyInBank);
        let subscribers = formatAvg(this.props.world.numSubscribers());
        let salaries = formatMoney(this.props.world.lastEditionSalaries);
        let commisions = formatMoney(this.props.world.lastEditionArticleCost);
        let lastIncome = formatMoney(this.props.world.lastEditionIncome);
        let newSubscribers = formatAvg(this.props.world.lastEditionSubChange);

        return (
            <div className="stats section">
                <div className="statGroup">
                    <div className="header">
                        <h1>Public Memory</h1>
                        <InfoIcon modifier="shiftLeft">
                            <section>
                                These are your works that the public remembers. Each region will
                                base their feelings about you on these works and their content.
                            </section>
                        </InfoIcon>
                    </div>
                    <PublicMemory papers={this.props.world.publicMemory} />
                </div>

                <div className="statGroup">
                    <h1>Stats</h1>
                    <StatRowC name="New Subscribers" value={newSubscribers} />
                    <StatRowC name="Subscribers" value={subscribers} />
                    <StatRowC name="Salaries" value={salaries} />
                    <StatRowC name="Commisions" value={commisions} />
                    <StatRowC name="Sales" value={lastIncome} />
                    <StatRowC name="Money" value={money} />
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
    name: string;
    loyalty: number;
}

enum LoyaltyCategory {
    MEH = "is indifferent towards you",

    DISLIKE = "dislikes you",
    ANGRY = "is angry about your work",
    FURIOUS = "is furious about your work",

    LIKE = "likes you",
    PLEASED = "finds your work quite pleasing",
    LOVE = "hangs on your every word"
}

function loyaltyCategory(loyalty: number): LoyaltyCategory {
    let result = LoyaltyCategory.MEH;
    if (loyalty < -.3) {
        result = LoyaltyCategory.DISLIKE;
    }
    if (loyalty < -.5) {
        result = LoyaltyCategory.ANGRY;
    }
    if (loyalty < -.7) {
        result = LoyaltyCategory.FURIOUS;
    }

    if (loyalty > .3) {
        result = LoyaltyCategory.LIKE;
    }
    if (loyalty > .5) {
        result = LoyaltyCategory.PLEASED;
    }
    if (loyalty > .7) {
        result = LoyaltyCategory.LOVE;
    }
    return result;
}

class LoyaltyC extends React.Component<LoyaltyProps> {
    render() {
        let icon = "fa-meh";
        let loyalty = loyaltyCategory(this.props.loyalty);
        switch(loyalty) {
            case LoyaltyCategory.MEH:
            icon = "fa-meh";
            break;

            case LoyaltyCategory.DISLIKE:
            icon = "fa-frown";
            break;

            case LoyaltyCategory.ANGRY:
            icon = "fa-angry";
            break;

            case LoyaltyCategory.FURIOUS:
            icon = "fa-dizzy";
            break;

            case LoyaltyCategory.LIKE:
            icon = "fa-grin-alt";
            break;

            case LoyaltyCategory.PLEASED:
            icon = "fa-smile-wink";
            break;

            case LoyaltyCategory.LOVE:
            icon = "fa-grin-hearts";
            break;
        }

        return (
            <i className={"tooltip far loyalty " + icon}>
                <div className="tooltiptext">
                    {this.props.name} {loyalty}
                </div>
            </i>
        );
    }
}
class PopulationC extends React.Component<PopulationProps> {
    render() {

        return (
            <div className="population" style={this.props.style}>
                <div className="rows">
                    <div className="name">
                        {this.props.population.name}
                        <LoyaltyC loyalty={this.props.population.lastLoyalty} name={this.props.population.name} />
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
                <div className="scrollWrapper">
                    <div className="gameColumns">
                        <AuthorsC world={this.props.world} />
                        <PendingArticlesC world={this.props.world} />
                        <NextEditionC world={this.props.world} />
                        <StatsC world={this.props.world} />
                    </div>
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
    WIN,
    LOSE
}

type MenuProps = {
    onAction: () => void;
}

class StartMenu extends React.Component<MenuProps> {
    render() {
        return (
            <div className="instructions">
                <button onClick={this.props.onAction}>Start</button>
                <section>
                    <u>You are the editor</u> of a small-town newspaper. You start with one author who
                    appeals to a small local population. Decide which of their articles to publish,
                    hire new authors, and expand your subscriber base to take over your region.
                </section>
                <section>
                    <u>Try to make $100k.</u> You'll need to be careful about who you hire to acheive this.
                </section>
                <section>
                    <u>Pay attention to your bank account.</u> If you run out of money your newspaper will close.
                </section>
                <section>
                    <u>Press space to pause</u> so you can consider your moves. Press space again to unpause
                    and see your decisions play out.
                </section>
            </div>
        );
    }
}

class LoseMenu extends React.Component<MenuProps> {
    render() {
        //<button onClick={this.props.onAction}>Try Again</button>
        return (
            <div className="instructions">
                <h1>Game Over</h1>
                <section>
                    You ran out of money and your newspaper closed its doors. Any
                    authors in your employ are now looking for work again. Don't worry,
                    they're used to that.
                </section>
            </div>
        )
    }
}

class WinMenu extends React.Component<MenuProps> {
    render() {
        //<button onClick={this.props.onAction}>Do Even Better...</button>
        return (
            <div className="instructions">
                <h1>Success!</h1>
                <section>
                    You've expanded your paper and seem to be on solid financial footing.
                    Well done! You'll be an empire in no time.
                </section>
            </div>
        )
    }
}
type AppState = {
    gameState: GameState;
}

let myWindow = window as any;
myWindow.world = new World();

class App extends React.Component<AppProps, AppState> {
    timer: any;

    constructor(props: AppProps) {
        super(props);
        this.state = {gameState: GameState.BOOT};

    }

    onKeyUp(): void {
        if (this.state.gameState == GameState.PAUSED) {
            this.setState({gameState: GameState.RUNNING});
        } else if(this.state.gameState == GameState.RUNNING) {
            this.setState({gameState: GameState.PAUSED});
        }
    }

    componentDidMount() {
        let rendersPerTick = 2;
        let tickPeriod = 1000.0 / Constants.TicksPerSecond;

        // game loop
        let renderCount = 0;
        let updateAndRender = () => {
            let world = (myWindow.world as World);
            if ((renderCount % rendersPerTick) == 0 && this.state.gameState == GameState.RUNNING) {
                world.tick();
            }

            if (world.moneyInBank <= 0) {
                this.setState({gameState: GameState.LOSE});
            } else if (myWindow.world.moneyInBank >= 100000) {
                this.setState({gameState: GameState.WIN});
            } else {
                this.setState((prev) => ({...prev}));
            }
            this.timer = setTimeout(updateAndRender, tickPeriod/rendersPerTick);
            renderCount += 1;
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
        let onReset = () => {
            myWindow.world = new World();
            this.setState({gameState: GameState.BOOT});
        }

        if (this.state.gameState == GameState.BOOT) {
            return <StartMenu onAction={() => this.startGame()}></StartMenu>;
        } else if(this.state.gameState == GameState.LOSE) {
            return <LoseMenu onAction={onReset} />
        } else if(this.state.gameState == GameState.WIN) {
            return <WinMenu onAction={onReset} />
        } else {
            let pauseActionName = 'Pause';
            if (this.state.gameState == GameState.PAUSED) {
                pauseActionName = 'Un-Pause';
            }
            let pauseButton = <button onClick={() => this.pauseGame(pauseActionName == 'Pause')}>Pause</button>;
            return (
                <Hotkeys 
                    keyName="space"
                    onKeyUp={this.onKeyUp.bind(this)}>
                    <Game world={this.props.world}></Game>
                    {pauseButton}
                    Press space to {pauseActionName}
                    <div className="vspacer"></div>
                </Hotkeys>
            );
        }
    }

    startGame() {
        this.setState({gameState: GameState.PAUSED});
    }

    pauseGame(pause: boolean) {
        if (pause) {
            this.setState({gameState: GameState.PAUSED});
        } else {
            this.setState({gameState: GameState.RUNNING});
        }
    }
}


ReactDOM.render(
    <App world={myWindow.world}></App>,
    document.getElementById('app')
)
