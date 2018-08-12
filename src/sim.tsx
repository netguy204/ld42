import NameGen from './namegen';

function randomInt(max: number) {
    return Math.floor(Math.random() * max);
}

function randomBetween(min: number, max: number) {
    let span = max - min;
    return min + Math.floor(Math.random() * span);
}

export class Timer {
    ticksRemaining: number;
    startTicks: number;

    constructor(startTicks: number) {
        this.startTicks = startTicks;
        this.ticksRemaining = startTicks;
    }

    tick(): boolean {
        if (this.ticksRemaining == 0) {
            return true;
        }
        this.ticksRemaining -= 1;
        return false;
    }

    reset(): void {
        this.ticksRemaining = this.startTicks;
    }
}

class TouchstoneType {
    name: string;
    icon: string;

    constructor(name: string, icon: string) {
        this.name = name;
        this.icon = icon;
    }

    createInstance(approval: boolean) {
        return new TouchstoneInstance(this, approval);
    }
}

export class TouchstoneInstance {
    identity: TouchstoneType;
    // how you feel about it
    approval: boolean;

    // could be [-1, 1]
    // could be like/dislike and intensity

    constructor(identity: TouchstoneType, approval: boolean) {
        this.identity = identity;
        this.approval = approval;
    }

    equals(other: TouchstoneInstance): boolean {
        return this.identity == other.identity && this.approval == other.approval;
    }
}

class TouchstoneLibrary {
    static types = [
        new TouchstoneType(
            "Liberal",
            "fa-university"
        ),
        new TouchstoneType(
            "Conservative",
            "fa-toolbox"
        ),
        new TouchstoneType(
            "Religion",
            "fa-church"
        ),
        new TouchstoneType(
            "Education",
            "fa-graduation-cap"
        ),
        new TouchstoneType(
            "Children",
            "fa-child"
        ),
        new TouchstoneType(
            "Celebrity",
            "fa-grin-stars"
        ),
    ];

    static draw(n: number): TouchstoneBag {
        let kinds: TouchstoneType[] = [];

        for(let i = 0; i < n; i++) {
            let which = randomInt(TouchstoneLibrary.types.length);
            let kind = TouchstoneLibrary.types[which];
            while (true) {
                if (kinds.indexOf(kind) < 0) {
                    kinds.push(kind);
                    break
                }
                which = randomInt(TouchstoneLibrary.types.length);
                kind = TouchstoneLibrary.types[which];
            }
        }

        let instances = kinds.map((kind) => {
            let approval = Math.random() > .5;
            return new TouchstoneInstance(kind, approval);
        });

        return new TouchstoneBag(instances);
    }

    static drawRandom() {
        let random = randomInt(TouchstoneLibrary.types.length);
        this.draw(random);
    }
}

class TouchstoneBag {
    instances: TouchstoneInstance[];

    constructor(instances: TouchstoneInstance[]) {
        this.instances = instances;
    }
}

let authorNameGen = NameGen.compile("sV'i");
let articleNameGen = NameGen.compile("sV'i");

export class Author extends TouchstoneBag {
    progress: number; // [0,1] when they'll have their next article ready
    articleTimer: Timer;
    numWrittenLastInterval: number; // how many articles they've produce in the last interval
    numPublishedLastInterval: number; // how many of their articles we've published
    name: string;

    constructor(touchstones: TouchstoneInstance[], ticksPerArticle: number, name: string) {
        super(touchstones);
        this.progress = 0;
        this.articleTimer = new Timer(ticksPerArticle);
        this.numWrittenLastInterval = 0;
        this.numPublishedLastInterval = 0;
        this.name = name;
    }

    static random(touchstones: number): Author {
        let traits = TouchstoneLibrary.draw(touchstones);
        let ticksPerArticle = randomBetween(4, 20);
        let name = authorNameGen.toString();
        return new Author(traits.instances, ticksPerArticle, name);
    }

    tick(): Article|null {
       if(this.articleTimer.tick()) {
           this.articleTimer.reset();
           return this.write();
       } else {
           return null;
       }
    }

    write(): Article {
        // sample from our interests to product an article
        let samples = randomBetween(1, this.instances.length);
        let instances: TouchstoneInstance[] = [];
        for (let i = 0; i < samples; i++) {
            instances.push(this.instances[randomInt(this.instances.length)]);
        }

        // how long the article is relevent
        let timeout = randomBetween(20, 50);
        return new Article(instances, articleNameGen.toString(), timeout);
    }
}

export class Article extends TouchstoneBag {
    headline: string;
    pendingTimer: Timer;

    constructor(instances: TouchstoneInstance[], headline: string, timeout: number) {
        super(instances);
        this.headline = headline;
        this.pendingTimer = new Timer(timeout);
    }

    // return true if we should expire
    tick(): boolean {
        return this.pendingTimer.tick();
    }
}

export class Newspaper {
    articles: Article[];
    progressToPublish: number; // [0, 1] 1 means it's published, 0 means we just started

    constructor(articles: Article[]) {
        this.articles = articles;
    }

    touchstones(): TouchstoneInstance[] {
        let touchstones: TouchstoneInstance[] = [];
        for (let artI = 0; artI < this.articles.length; artI++) {
            let article = this.articles[artI];
            touchstones = touchstones.concat(article.instances);
        }
        return touchstones;
    }
}

export class Population extends TouchstoneBag {
    name: string;
    loyalty: number; // -1 to 1, -1 most displeased. 1 is estatic
    subscriberRatio: number; // 0-1, what percentage subscribe?
    largeness: number; // 0-1, how many from teeny tiny to massive

    constructor(touchstones: TouchstoneInstance[], name: string, largeness: number) {
        super(touchstones);

        this.name = name;
        this.loyalty = 0;
        this.subscriberRatio = 0;
        this.largeness = largeness;
    }

    score(paper: Newspaper): number {
        let total = 0;
        for (let artI = 0; artI < paper.articles.length; artI) {
            let article = paper.articles[artI];

            for (let artTouchI = 0; artTouchI < article.instances.length; artTouchI++) {
                let artTouch = article.instances[artTouchI];

                for (let popI = 0; popI < this.instances.length; popI++) {
                    let popInst = this.instances[popI];

                    if (artTouch.identity == popInst.identity) {
                        if (artTouch.approval == popInst.approval) {
                            total += 1;
                        } else {
                            total -= 1;
                        }
                    }
                }

            }
        }

        return total;
    }

    judge(paper: Newspaper) {
        let score = this.score(paper);
        this.loyalty += score;
    }
}

export class WorldEvent {
    instance: TouchstoneInstance;

    name(): string {
        return this.instance.identity.name;
    }
}

export let Constants = {
    TicksPerNewscycle: 10,
    TicksPerSecond: 2,
    NewpapersInPublicMemory: 4,
};

let populationNameGen = NameGen.compile("sV'i");

export class World {
    employedAuthors: Author[];
    availableAuthors: Author[];

    pendingArticles: Article[];

    nextEdition: Newspaper;
    nextEditionTimer: Timer;
    publicMemory: Newspaper[];

    moneyInBank: number;
    currentSubscribers: number;

    currentEvents: WorldEvent[];

    populations: Population[];

    constructor() {
        this.employedAuthors = [];
        this.availableAuthors = [];
        this.pendingArticles = [];
        this.nextEdition = new Newspaper([]);
        this.nextEditionTimer = new Timer(Constants.TicksPerNewscycle);
        this.publicMemory = [];
        this.moneyInBank = 5000;
        this.currentSubscribers = 1000;
        this.currentEvents = [];
        this.populations = [];

        this.employedAuthors.push(Author.random(3));
        this.populations.push(new Population(
            TouchstoneLibrary.draw(1).instances,
            populationNameGen.toString(),
            Math.random() / 2 + 0.5
        ))
    }

    hire(author: Author): void {
        this.employedAuthors.push(author);
    }

    fire(author: Author): void {
        let iToRemove = this.employedAuthors.indexOf(author)
        this.employedAuthors.splice(iToRemove, 1);
    }

    addArticleToCurrent(article: Article): void {
        // remove from old
        this.pendingArticles.splice(this.pendingArticles.indexOf(article), 1);

        // add to new
        this.nextEdition.articles.push(article);
    }

    removeArticleFromCurrent(article: Article): void {
        // remove from old
        this.nextEdition.articles.splice(this.nextEdition.articles.indexOf(article), 1);

        // add to new
        this.pendingArticles.push(article);
    }

    transferReadyArticles() {

    }

    tick(): void {
        // give all authors a chance to finish writing
        this.employedAuthors.forEach((author) => {
            let maybeArticle = author.tick();
            if (maybeArticle != null) {
                console.log("new article");
                this.pendingArticles.push(maybeArticle as Article);
            }
        });

        // give articles a chance to timeout
        let toRemove: Article[] = [];
        this.pendingArticles.forEach((article) => {
            if (article.tick()) {
                toRemove.push(article);
            }
        })

        // remove the articles that had timed out
        toRemove.forEach((article) => {
            this.pendingArticles.splice(this.pendingArticles.indexOf(article), 1);
        })

        // see if the current edition is timed out
        if (this.nextEditionTimer.tick()) {
            this.nextEditionTimer.reset();

            // add this, dropping off oldest if necessary
            this.publicMemory.push(this.nextEdition);
            if (this.publicMemory.length > Constants.NewpapersInPublicMemory) {
                this.publicMemory.splice(0, 1);
            }

            this.nextEdition = new Newspaper([]);
        }
        this.transferReadyArticles();
    }
    // authors can quit if you don't publish enough of their articles
}


