import { Player } from '../src/game/Player.js';

describe('Player', () => {
    test('reset clears finished state', () => {
        const player = new Player(0, 0x000000);
        player.pieces[0].finished = true;
        player.reset();
        expect(player.pieces.every(p => !p.finished && p.positionIndex === null)).toBe(true);
    });
});
