import { types } from "util";

function randomInt(max: number) {
    return Math.floor(Math.random() * max);
}

function randomBetween(min: number, max: number) {
    let span = max - min;
    return min + Math.floor(Math.random() * span);
}

class TouchstoneType {
    name: string;

    constructor(name: string) {
        this.name = name;
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
        new TouchstoneType("Liberal"),
        new TouchstoneType("Conservative"),
        new TouchstoneType("Religion"),
        new TouchstoneType("Education"),
        new TouchstoneType("Children"),
        new TouchstoneType("Celebrity")
    ];

    static draw(n: number): TouchstoneBag {
        let instances: TouchstoneInstance[] = [];

        for(let i = 0; i < n; i++) {
            let which = randomInt(TouchstoneLibrary.types.length);
            let approval = Math.random() > .5;
            instances.push(new TouchstoneInstance(TouchstoneLibrary.types[which], approval));
        }

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

// let KnownTouchstones = new ;

export class Author extends TouchstoneBag {
    progress: number; // [0,1] when they'll have their next article ready
    ticksPerArticle: number; // how many game ticks it takes to write an article
    numWrittenLastInterval: number; // how many articles they've produce in the last interval
    numPublishedLastInterval: number; // how many of their articles we've published

    constructor(touchstones: TouchstoneInstance[], ticksPerArticle: number) {
        super(touchstones);
        this.progress = 0;
        this.ticksPerArticle = ticksPerArticle;
        this.numWrittenLastInterval = 0;
        this.numPublishedLastInterval = 0;
    }

    static random(touchstones: number): Author {
        let traits = TouchstoneLibrary.draw(touchstones);
        let ticksPerArticle = randomBetween(4, 20);
        return new Author(traits.instances, ticksPerArticle);
    }

    /*
    write(): Article {

        return null;
    }
    */
}

export class Article extends TouchstoneBag {
}

function MergeArticles(articles: Article[]): Newspaper {
    return new Newspaper(articles);
}

export class Newspaper {
    articles: Article[];
    progressToPublish: number; // [0, 1] 1 means it's published, 0 means we just started

    constructor(articles: Article[]) {
        this.articles = articles;
    }
}

export class Population extends TouchstoneBag {
    loyalty: number;
    subscriberRatio: number; // 0-1, what percentage subscribe?
    largeness: number; // 0-1, how many from teeny tiny to massive

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
    TicksPerSecond: 10,
};

export class World {
    employedAuthors: Author[];
    availableAuthors: Author[];

    pendingArticles: Article[];

    nextEdition: Newspaper;
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
        this.publicMemory = [];
        this.moneyInBank = 5000;
        this.currentSubscribers = 1000;
        this.currentEvents = [];
        this.populations = [];

        this.employedAuthors.push(Author.random(3));
    }

    hire(author: Author): void {
        this.employedAuthors.push(author);
    }

    fire(author: Author): void {
        let iToRemove = this.employedAuthors.indexOf(author)
        this.employedAuthors = this.employedAuthors.slice(iToRemove);
    }

    addArticleToCurrent(article: Article): void {

    }

    removeArticleFromCurrent(article: Article): void {

    }

    transferReadyArticles() {

    }

    tick(): void {
        console.log("tick");
        this.transferReadyArticles();
    }
    // authors can quit if you don't publish enough of their articles
}


