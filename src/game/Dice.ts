export class Dice {
    rng: () => number;

    constructor(rng: () => number = Math.random) {
        this.rng = rng;
    }

    rollDie(): number {
        // Returns a single d4 result between 1 and 4 inclusive
        return 1 + Math.floor(this.rng() * 4);
    }

    roll(): { rolls: number[]; successes: number } {
        const rolls = Array.from({ length: 4 }, () => this.rollDie());
        const successes = rolls.filter(value => value >= 3).length;

        return { rolls, successes };
    }
}
