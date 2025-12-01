import { Dice } from '../src/game/Dice.js';

describe('Dice', () => {
    test('roll returns 4 dice and counts successes', () => {
        const dice = new Dice(() => 0.9); // always roll 4
        const result = dice.roll();
        expect(result.rolls).toHaveLength(4);
        expect(result.successes).toBe(4);
    });

    test('rollDie returns values between 1 and 4', () => {
        const values = [];
        const dice = new Dice(Math.random);
        for (let i = 0; i < 100; i++) {
            values.push(dice.rollDie());
        }
        expect(values.every(v => v >= 1 && v <= 4)).toBe(true);
    });
});
