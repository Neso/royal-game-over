import { jest } from '@jest/globals';

jest.unstable_mockModule('pixi.js', () => {
    class BaseContainer {
        children: any[];
        visible: boolean;
        x: number;
        y: number;
        alpha: number;
        constructor() {
            this.children = [];
            this.visible = true;
            this.x = 0;
            this.y = 0;
            this.alpha = 1;
        }
        addChild(child: any) {
            this.children.push(child);
            return child;
        }
        removeChild() {}
        on() {}
        off() {}
    }

    class Application {
        stage: BaseContainer;
        screen: { width: number; height: number };
        canvas: any;
        options?: any;
        constructor() {
            this.stage = new BaseContainer();
            this.screen = { width: 800, height: 600 };
            this.canvas = {};
        }
        async init(options: any) {
            this.options = options;
        }
    }

    class Container extends BaseContainer {}

    class Graphics extends BaseContainer {
        beginFill() {}
        drawRoundedRect() {}
        drawRect() {}
        drawCircle() {}
        endFill() {}
        lineStyle() {}
    }

    class Text extends BaseContainer {
        text: string;
        anchor: { set: jest.Mock };
        constructor(text: string) {
            super();
            this.text = text;
            this.anchor = { set: jest.fn() };
        }
    }

    class Rectangle {
        x: number;
        y: number;
        width: number;
        height: number;
        constructor(x: number, y: number, width: number, height: number) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
    }

    class Sprite extends BaseContainer {
        width: number;
        height: number;
        anchor: { set: jest.Mock };
        constructor() {
            super();
            this.width = 100;
            this.height = 100;
            this.anchor = { set: jest.fn() };
        }
    }

    return {
        Application,
        Container,
        Graphics,
        Text,
        Rectangle,
        Sprite,
        Assets: { load: jest.fn(), get: jest.fn() }
    };
});

jest.unstable_mockModule('../src/game/UI/RulesScreen.js', () => ({
    RulesScreen: class {
        app: any;
        onBack: () => void;
        visible: boolean;
        constructor(app: any, onBack: () => void) {
            this.app = app;
            this.onBack = onBack;
            this.visible = false;
        }
        show() {
            this.visible = true;
        }
        hide() {
            this.visible = false;
        }
        alignScreen() {}
    }
}));

const { Game } = await import('../src/game/Game.js');

describe('Game.hasAnyValidMove', () => {
    let game;

    beforeEach(() => {
        game = new Game();
        game.board.paths[0] = [{ id: 'p0-0' }, { id: 'p0-1' }, { id: 'p0-2' }];
        game.board.paths[1] = [];
        game.board.getPathLength = jest.fn(
            (playerId: number) => (game.board.paths[playerId] || []).length
        );
        game.board.getSpaceForPlayer = jest.fn(
            (playerId: number, index: number) => (game.board.paths[playerId] || [])[index] || null
        );
        game.board.updatePieces = jest.fn();
    });

    test('recognizes a finishing move when landing exactly on the exit', () => {
        const piece = game.players[0].pieces[0];
        game.players[0].pieces = [piece];
        game.players[1].pieces = [];
        piece.positionIndex = game.board.getPathLength(0) - 1;

        const hasMove = game.hasAnyValidMove(0, 1);
        expect(hasMove).toBe(true);

        const move = game.tryPrepareMove(piece, 1);
        expect(move).toMatchObject({
            piece,
            finishes: true,
            targetIndex: null,
            targetSpace: null
        });
    });

    test('returns no valid move when roll would overshoot the exit', () => {
        const piece = game.players[0].pieces[0];
        game.players[0].pieces = [piece];
        game.players[1].pieces = [];
        piece.positionIndex = game.board.getPathLength(0) - 1;

        const hasMove = game.hasAnyValidMove(0, 2);
        expect(hasMove).toBe(false);
        expect(game.tryPrepareMove(piece, 2)).toBeNull();
    });

    test('all other tokens at home but one on last spot cannot move with roll of 2', () => {
        const pieces = game.players[0].pieces;
        const pathLength = game.board.getPathLength(0);

        const activePiece = pieces[0];
        activePiece.playerId = 0;
        activePiece.positionIndex = pathLength - 1;

        pieces.slice(1).forEach(piece => {
            piece.playerId = 99; // invalid path to prevent moves
            piece.positionIndex = null;
        });
        game.players[1].pieces = [];

        expect(game.hasAnyValidMove(0, 2)).toBe(false);
        expect(game.tryPrepareMove(activePiece, 2)).toBeNull();
    });

    test('finished pieces are ignored when checking for valid moves', () => {
        const pieces = game.players[0].pieces;
        const pathLength = game.board.getPathLength(0);
        const activePiece = pieces[0];
        activePiece.positionIndex = pathLength - 1;

        pieces.slice(1).forEach(piece => {
            piece.finished = true;
            piece.positionIndex = null;
        });
        game.players[1].pieces = [];

        expect(game.hasAnyValidMove(0, 2)).toBe(false);
    });
});
