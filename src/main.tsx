import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { deflateRaw } from 'zlib';

class TouchstoneType {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    createInstance(approval: boolean) {
        return new TouchstoneInstance(this, approval);
    }
}

class TouchstoneInstance {
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
    types: TouchstoneType[];

    constructor(types: TouchstoneType[]) {
        this.types = types;
    }

    draw(n: number): TouchstoneBag {
        let instances: TouchstoneInstance[] = [];

        for(let i = 0; i < n; i++) {
            let which = (Math.random() * this.types.length);
            let approval = Math.random() > .5;
            instances.push(new TouchstoneInstance(this.types[which], approval));
        }

        return new TouchstoneBag(instances);
    }
}

class TouchstoneBag {
    instances: TouchstoneInstance[];

    constructor(instances: TouchstoneInstance[]) {
        this.instances = instances;
    }

    union(other: TouchstoneBag): TouchstoneBag {

    }

}

let KnownTouchstones = new TouchstoneLibrary([
    new TouchstoneType("Liberal"),
    new TouchstoneType("Conservative"),
    new TouchstoneType("Religion"),
    new TouchstoneType("Education"),
    new TouchstoneType("Children")
]);

class Author extends TouchstoneBag {
    write(): Article {
        return null;
    }

}

class Article extends TouchstoneBag {
}

function MergeArticles(articles: Article[]): Newspaper {
    return new Newspaper(articles);
}

class Newspaper {
    articles: Article[];

    constructor(articles: Article[]) {
        this.articles = articles;
    }
}

class Population extends TouchstoneBag {
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

class World {
    hiredAuthors: Author[];
    availableArticles: Article[];
}
