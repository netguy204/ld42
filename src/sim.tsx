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

    toString(): string {
        let modifier = 'Pro-';
        if (!this.approval) {
            modifier = 'Anti-';
        }
        return modifier + this.identity.name;
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
    hireTimer: Timer;
    name: string;

    constructor(touchstones: TouchstoneInstance[], ticksPerArticle: number, name: string) {
        super(touchstones);

        this.progress = 0;
        this.articleTimer = new Timer(ticksPerArticle);
        this.hireTimer = new Timer(ticksPerArticle); // better authors go away faster
        this.name = name;
    }

    salary() {
        // an author that produces one article per newscycle makes the
        // baseline salary. an author that writes twice as fast makes
        // twice as much
        let salaryRatio = Constants.TicksPerNewscycle / this.articleTimer.startTicks;
        return Constants.BaselineSalaryPerNewscycle * salaryRatio;
    }

    static random(): Author {
        let traits = TouchstoneLibrary.draw(randomBetween(1, 4));
        let ticksPerArticle = randomBetween(4, 20);
        let name = authorNameGen.toString();
        return new Author(traits.instances, ticksPerArticle, name);
    }

    availableTick(): boolean {
        return this.hireTimer.tick();
    }

    employedTick(): Article|null {
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
    coveredTopics: TouchstoneInstance[];

    constructor(instances: TouchstoneInstance[], headline: string, timeout: number) {
        super(instances);
        this.coveredTopics = instances;
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

let populationNameGen = NameGen.compile("sV'i");

export class Population extends TouchstoneBag {
    name: string;
    numSubscribers: number;
    totalPopulation: number;
    lastLoyalty: number;

    constructor(touchstones: TouchstoneInstance[], name: string, totalPopulation: number) {
        super(touchstones);

        this.name = name;
        this.numSubscribers = 0;
        this.totalPopulation = totalPopulation;
    }

    static random(): Population {
        let nTraits = randomBetween(1, 3);
        let traits = TouchstoneLibrary.draw(nTraits);
        return new Population(
            traits.instances,
            populationNameGen.toString(),
            randomBetween(5000, 10000)
        );
    }

    loyaltyToPaper(paper: Newspaper): number {
        let total = 0;
        let touchstones = paper.touchstones();
        if (touchstones.length == 0) {
            return 0;
        }

        for (let touchI = 0; touchI < touchstones.length; touchI++) {
            let touch = touchstones[touchI];

            for (let popI = 0; popI < this.instances.length; popI++) {
                let popInst = this.instances[popI];

                if (touch.identity == popInst.identity) {
                    if (touch.approval == popInst.approval) {
                        total += 1;
                    } else {
                        total -= 1;
                    }
                }
            }
        }

        return total / touchstones.length;
    }

    loyalty(papers: Newspaper[]): number {
        let total = 0;
        papers.forEach((paper) => {
            total += this.loyaltyToPaper(paper);
        });
        return total / papers.length;
    }

    subscriberRatio(): number {
        return this.numSubscribers / this.totalPopulation;
    }

    numNonSubscribers(): number {
        return this.totalPopulation - this.numSubscribers;
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
    MaxLogMessages: 4,
    MaxApplicants: 1,
    MaxPendingArticles: 3,
    IncomePerPaper: 0.79,
    BaselineSalaryPerNewscycle: 2000,
    StartingSubscribers: 1000,
    CostPerArticle: 1000,
    StartingMoneyInBank: 30000,
};


export class World {
    employedAuthors: Author[];
    availableAuthors: Author[];

    pendingArticles: Article[];

    nextEdition: Newspaper;
    nextEditionTimer: Timer;
    publicMemory: Newspaper[];

    moneyInBank: number;

    currentEvents: WorldEvent[];

    populations: Population[];

    logMessages: string[];

    lastEditionSalaries: number;
    lastEditionArticleCost: number;
    lastEditionIncome: number;
    lastEditionSubChange: number;

    constructor() {
        this.employedAuthors = [];
        this.availableAuthors = [];
        this.pendingArticles = [];
        this.nextEdition = new Newspaper([]);
        this.nextEditionTimer = new Timer(Constants.TicksPerNewscycle);
        this.publicMemory = [];
        this.moneyInBank = Constants.StartingMoneyInBank;
        this.currentEvents = [];
        this.populations = [];
        this.logMessages = [];
        this.lastEditionSalaries = 0;
        this.lastEditionArticleCost = 0;
        this.lastEditionIncome = 0;
        this.lastEditionSubChange = 0;

        for (let i = 0; i < 5; i++) {
            this.populations.push(Population.random());
        }

        // tweak the first population to make it our home turf
        let homeTurf = this.populations[0];
        homeTurf.numSubscribers = 1000;
        let traits = homeTurf.instances;
        let author = new Author(traits, Constants.TicksPerNewscycle/2, "Susy Joe");
        this.employedAuthors.push(author);

        this.addLog("Welcome to Sim Tabloid!");
    }

    hire(author: Author): void {
        this.employedAuthors.push(author);
        let iToRemove = this.availableAuthors.indexOf(author)
        this.availableAuthors.splice(iToRemove, 1);
    }

    fire(author: Author): void {
        let iToRemove = this.employedAuthors.indexOf(author)
        this.employedAuthors.splice(iToRemove, 1);
    }

    // add a message to the log
    addLog(message: string): void {
        this.logMessages.push(message);
        if (this.logMessages.length > Constants.MaxLogMessages) {
            this.logMessages.splice(0, 1);
        }
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

    aWildApplicantAppeared(): void {
        if (Math.random() < 1.0 / Constants.TicksPerNewscycle) {
            this.availableAuthors.push(Author.random());
        }
    }

    numSubscribers(): number {
        let subscribers = 0;
        this.populations.forEach((pop) => {
            subscribers += pop.numSubscribers;
        });
        return subscribers;
    }

    updateCycleIncome(): void {
        // subscribers don't pay for a missing paper
        if (this.nextEdition.articles.length == 0) {
            this.lastEditionIncome = 0;
        } else {
            this.lastEditionIncome = this.numSubscribers() * Constants.IncomePerPaper; 
        }
        this.moneyInBank += this.lastEditionIncome;
    }

    updateCycleExpenses(): void {
        let salaries = 0;
        let utilities = randomBetween(142, 433);
        let commissions = 0;

        this.employedAuthors.forEach(author => {
            salaries += author.salary();
        });
        this.lastEditionSalaries = salaries;

        // pay for each of our articles
        this.nextEdition.articles.forEach((article) => {
            commissions += Constants.CostPerArticle;
        })
        this.lastEditionArticleCost = commissions;

        this.moneyInBank -= (salaries + utilities + commissions);
    }

    updateSubscribers(): void {
        let deltaSubscribers = 0;

        this.populations.forEach((pop) => {
            let loyalty = pop.loyalty(this.publicMemory);
            let prevSubscribers = pop.numSubscribers;
            let nextSubscribers = pop.numSubscribers;

            pop.lastLoyalty = loyalty;
            if (loyalty < 0) {
                nextSubscribers -= (pop.numSubscribers * Math.abs(loyalty));
            }
            if (loyalty > 0) {
                nextSubscribers += (pop.numNonSubscribers() * loyalty);
            }
            if (loyalty == 0) {
                // meh is bad
                nextSubscribers -= pop.numNonSubscribers() * 0.1;
            }

            // make sure the answer is in a reasonable bound
            nextSubscribers = Math.max(0, Math.min(pop.totalPopulation, nextSubscribers));
            deltaSubscribers += (nextSubscribers - prevSubscribers);
            pop.numSubscribers = nextSubscribers;
        });

        this.lastEditionSubChange = Math.floor(deltaSubscribers);
    }

    tick(): void {
        // give all authors a chance to finish writing
        this.employedAuthors.forEach((author) => {
            let maybeArticle = author.employedTick();
            if (maybeArticle != null) {
                this.pendingArticles.push(maybeArticle as Article);
            }
        });

        // give articles a chance to timeout
        let articlesToRemove: Article[] = [];
        this.pendingArticles.forEach((article) => {
            if (article.tick()) {
                articlesToRemove.push(article);
            }
        })

        // remove the articles that had timed out
        articlesToRemove.forEach((article) => {
            this.pendingArticles.splice(this.pendingArticles.indexOf(article), 1);
        })

        // drop the oldest article if we have too many
        if (this.pendingArticles.length > Constants.MaxPendingArticles) {
            this.pendingArticles.splice(0, 1);
        }

        // see if the current edition is timed out
        if (this.nextEditionTimer.tick()) {
            this.nextEditionTimer.reset();

            // add this, dropping off oldest if necessary
            this.publicMemory.push(this.nextEdition);
            if (this.publicMemory.length > Constants.NewpapersInPublicMemory) {
                this.publicMemory.splice(0, 1);
            }

            this.updateCycleIncome();
            this.updateCycleExpenses();

            // we get/lose subscribers after we get our income this cycle
            this.updateSubscribers();

            this.nextEdition = new Newspaper([]);
        }

        // remove any candidates that have timed out
        let applicantsToRemove: Author[] = [];
        this.availableAuthors.forEach((author) => {
            if(author.availableTick()) {
                applicantsToRemove.push(author);
            }
        });
        applicantsToRemove.forEach((author) => {
            this.availableAuthors.splice(this.availableAuthors.indexOf(author), 1);
        })

        // roll for a new candidate if we have space
        if (this.availableAuthors.length < Constants.MaxApplicants) {
            this.aWildApplicantAppeared();
        }
    }

    /*
    function subscriberChange(population: Population, publicMemory: Newspaper[]) {
        let appeal = 0;
        // sum of scores

        appeal = appeal / publicMemory.length;

        if (appeal > 0) {
            let count = population.getCurrentSubscriberCount();
            population.subscriberRatio = 
        }
    }
    pop.appeal = pop.evaluate(publicMemory);
    pop.subscribers += subscriberChange(pop.subscribers, pop.bigness, pop.appeal); // can be > 0 or < 0

    */
}


