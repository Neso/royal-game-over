import { Application, Container, Sprite, Assets, Graphics } from 'pixi.js';
import { Piece } from './Piece.js';

export type BoardSpace = {
    id: string;
    col: number;
    row: number;
    position: { x: number; y: number };
    isRosetta?: boolean;
    isFort?: boolean;
    isSafe?: boolean;
};

export class Board {
    app: Application;
    sprite: Sprite | null;
    grid: { cols: number; rows: number };
    spaces: BoardSpace[];
    paths: Record<number, BoardSpace[]>;
    spaceLayer: Container;
    pieceLayer: Container;
    pieceTokens: Map<string, Graphics>;

    constructor(app: Application) {
        this.app = app;
        this.sprite = null;
        this.grid = { cols: 3, rows: 8 };
        this.spaces = [];
        this.paths = { 0: [], 1: [] };
        this.spaceLayer = new Container();
        this.pieceLayer = new Container();
        this.pieceTokens = new Map(); // key: `${playerId}:${pieceId}`
    }

    async init() {
        const texture = Assets.get('/src/assets/board.png');
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.x = this.app.screen.width / 2;
        this.sprite.y = this.app.screen.height / 2;

        const scaleX = this.app.screen.width / this.sprite.width;
        const scaleY = this.app.screen.height / this.sprite.height;
        this.sprite.scale.set(Math.min(scaleX, scaleY));

        this.app.stage.addChild(this.sprite);
        this.app.stage.addChild(this.spaceLayer);
        this.app.stage.addChild(this.pieceLayer);

        this.initBoardSpaces();
        this.drawBoardSpaces();
    }

    cellToWorld(col: number, row: number) {
        const { cellWidth, cellHeight } = this.getCellSize();
        return {
            x: this.sprite.x + (col + 0.5) * cellWidth - this.sprite.width / 2,
            y: this.sprite.y + (row + 0.5) * cellHeight - this.sprite.height / 2
        };
    }

    getCellSize() {
        return {
            cellWidth: this.sprite.width / this.grid.cols,
            cellHeight: this.sprite.height / this.grid.rows
        };
    }

    initBoardSpaces() {
        const leftCol = 0;  // black/blue side
        const midCol = 1;   // shared
        const rightCol = 2; // white side

        // Rows are 0 (top) to 7 (bottom)
        // Layout per spec:
        // Row0: black, shared, white
        // Row1: black rosetta, shared, white rosetta
        // Row2: shared
        // Row3: shared
        // Row4: black, shared (rosetta + fort), white
        // Row5: black, shared, white
        // Row6: black, shared, white
        // Row7: black rosetta, shared, white rosetta

        const makeSpace = (id, col, row, flags = {}) => ({
            id,
            col,
            row,
            ...flags,
            position: this.cellToWorld(col, row)
        });

        const sharedSpaces = [
            makeSpace('shared-0', midCol, 0, {}),
            makeSpace('shared-1', midCol, 1, {}),
            makeSpace('shared-2', midCol, 2, {}),
            makeSpace('shared-3', midCol, 3, {}),
            makeSpace('shared-4', midCol, 4, { isRosetta: true, isFort: true }), // fort rosetta
            makeSpace('shared-5', midCol, 5, {}),
            makeSpace('shared-6', midCol, 6, {}),
            makeSpace('shared-7', midCol, 7, {})
        ];

        const blackSpaces = [
            makeSpace('black-0', leftCol, 0, { isSafe: true }),
            makeSpace('black-1', leftCol, 1, { isSafe: true, isRosetta: true }),
            makeSpace('black-4', leftCol, 4, { isSafe: true }),
            makeSpace('black-5', leftCol, 5, { isSafe: true }),
            makeSpace('black-6', leftCol, 6, { isSafe: true }),
            makeSpace('black-7', leftCol, 7, { isSafe: true, isRosetta: true })
        ];

        const whiteSpaces = [
            makeSpace('white-0', rightCol, 0, { isSafe: true }),
            makeSpace('white-1', rightCol, 1, { isSafe: true, isRosetta: true }),
            makeSpace('white-4', rightCol, 4, { isSafe: true }),
            makeSpace('white-5', rightCol, 5, { isSafe: true }),
            makeSpace('white-6', rightCol, 6, { isSafe: true }),
            makeSpace('white-7', rightCol, 7, { isSafe: true, isRosetta: true })
        ];

        this.spaces = [...sharedSpaces, ...blackSpaces, ...whiteSpaces];

        // Black/blue path: enter at black-4 -> black-5 -> black-6 -> black-7 (rosetta)
        // then shared 7→6→5→4(rosetta+fort)→3→2→1→0 -> black-0 -> black-1 (rosetta) -> exit
        this.paths[0] = [
            this.findSpace('black-4'),
            this.findSpace('black-5'),
            this.findSpace('black-6'),
            this.findSpace('black-7'),
            this.findSpace('shared-7'),
            this.findSpace('shared-6'),
            this.findSpace('shared-5'),
            this.findSpace('shared-4'),
            this.findSpace('shared-3'),
            this.findSpace('shared-2'),
            this.findSpace('shared-1'),
            this.findSpace('shared-0'),
            this.findSpace('black-0'),
            this.findSpace('black-1')
        ];

        // White path mirrors on right: enter white-4 -> white-5 -> white-6 -> white-7(rosetta)
        // then shared 7→6→5→4(rosetta+fort)→3→2→1→0 -> white-0 -> white-1(rosetta) -> exit
        this.paths[1] = [
            this.findSpace('white-4'),
            this.findSpace('white-5'),
            this.findSpace('white-6'),
            this.findSpace('white-7'),
            this.findSpace('shared-7'),
            this.findSpace('shared-6'),
            this.findSpace('shared-5'),
            this.findSpace('shared-4'),
            this.findSpace('shared-3'),
            this.findSpace('shared-2'),
            this.findSpace('shared-1'),
            this.findSpace('shared-0'),
            this.findSpace('white-0'),
            this.findSpace('white-1')
        ];
    }

    findSpace(id: string) {
        return this.spaces.find(space => space.id === id);
    }

    drawBoardSpaces() {
        const width = this.sprite.width / this.grid.cols;
        const height = this.sprite.height / this.grid.rows;

        const drawn = new Set();
        this.paths[0].concat(this.paths[1]).forEach(space => {
            if (!space || drawn.has(space.id)) return;
            drawn.add(space.id);

            const graphics = new Graphics();
            let color = 0xa8d0f0; // player-only spaces: light blue
            let alpha = 0.5;

            if (!space.isSafe && space.col === 1) {
                color = 0xa8e6a1; // shared non-rosetta: light green
            }
            if (space.isRosetta) {
                color = space.isFort ? 0x1565c0 : 0xff9800; // fort rosetta blue, otherwise orange
            }

            graphics.beginFill(color, alpha);
            graphics.drawRect(
                -width / 2 + 1,
                -height / 2 + 1,
                width - 2,
                height - 2
            );
            graphics.endFill();

            graphics.x = space.position.x;
            graphics.y = space.position.y;

            this.spaceLayer.addChild(graphics);
        });
    }

    getSpaceForPlayer(playerId: number, pathIndex: number) {
        const path = this.paths[playerId];
        return path ? path[pathIndex] : null;
    }

    getPathLength(playerId: number) {
        const path = this.paths[playerId];
        return path ? path.length : 0;
    }

    placePieceToken(piece: Piece, position: { x: number; y: number }) {
        const key = `${piece.playerId}:${piece.id}`;
        let token = this.pieceTokens.get(key);
        if (!token) {
            token = new Graphics();
            token.beginFill(piece.color || (piece.playerId === 0 ? 0x000000 : 0xffffff));
            token.lineStyle(2, 0x333333, 0.6);
            token.drawCircle(0, 0, 12);
            token.endFill();
            this.pieceTokens.set(key, token);
            this.pieceLayer.addChild(token);
        }
        token.tint = piece.color || (piece.playerId === 0 ? 0x000000 : 0xffffff);
        token.x = position.x;
        token.y = position.y;
        token.eventMode = piece.isFinished() ? 'none' : 'static';
        token.cursor = piece.isFinished() ? 'default' : 'pointer';
        return token;
    }

    homePosition(playerId: number, pieceIndex: number) {
        // Stack near each player's entry space, outside the board
        const startSpace = this.paths[playerId][0];
        const { cellWidth, cellHeight } = this.getCellSize();
        const xOffset = playerId === 0 ? -cellWidth : cellWidth;
        const x = startSpace.position.x + xOffset;
        const y = startSpace.position.y + (pieceIndex - 3) * (cellHeight / 4);
        return { x, y };
    }

    finishedPosition(playerId: number, pieceIndex: number) {
        // Stack near each player's last space, outside the board
        const endSpace = this.paths[playerId][this.paths[playerId].length - 1];
        const { cellWidth, cellHeight } = this.getCellSize();
        const xOffset = playerId === 0 ? -cellWidth : cellWidth;
        const x = endSpace.position.x + xOffset;
        const y = endSpace.position.y + (pieceIndex - 3) * (cellHeight / 4);
        return { x, y };
    }

    updatePieces(pieces: Piece[]) {
        pieces.forEach(piece => {
            let targetPosition;
            if (piece.isFinished()) {
                targetPosition = this.finishedPosition(piece.playerId, piece.id);
            } else if (piece.positionIndex === null) {
                targetPosition = this.homePosition(piece.playerId, piece.id);
            } else {
                const space = this.getSpaceForPlayer(piece.playerId, piece.positionIndex);
                targetPosition = space ? space.position : this.homePosition(piece.playerId, piece.id);
            }
            this.placePieceToken(piece, targetPosition);
        });
    }
}
