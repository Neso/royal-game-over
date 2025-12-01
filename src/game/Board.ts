import { Application, Container, Sprite, Assets, Graphics } from 'pixi.js';
import { Piece } from './Piece.js';
import boardTextureUrl from '../assets/board.png';
import boardConfig from '../assets/boardConfig.json' with { type: 'json' };

export type BoardSpace = {
    id: string;
    col: number;
    row: number;
    position: { x: number; y: number };
    isRosetta?: boolean;
    isFort?: boolean;
    isSafe?: boolean;
};

type BoardSpaceConfig = Omit<BoardSpace, 'position'>;
type BoardConfig = {
    grid: { cols: number; rows: number };
    spaces: BoardSpaceConfig[];
    paths: Record<number, string[]>;
};

export class Board {
    app: Application;
    sprite: Sprite | null;
    baseWidth: number;
    baseHeight: number;
    grid: { cols: number; rows: number };
    spaces: BoardSpace[];
    paths: Record<number, BoardSpace[]>;
    spaceLayer: Container;
    pieceLayer: Container;
    pieceTokens: Map<string, Graphics>;

    constructor(app: Application) {
        this.app = app;
        this.sprite = null;
        this.baseWidth = 0;
        this.baseHeight = 0;
        this.grid = { cols: 3, rows: 8 };
        this.spaces = [];
        this.paths = { 0: [], 1: [] };
        this.spaceLayer = new Container();
        this.pieceLayer = new Container();
        this.pieceTokens = new Map(); // key: `${playerId}:${pieceId}`
    }

    async init() {
        await Assets.load(boardTextureUrl);
        const texture = Assets.get(boardTextureUrl);
        this.sprite = new Sprite(texture);
        this.baseWidth = texture.width;
        this.baseHeight = texture.height;
        this.sprite.anchor.set(0.5);
        this.applyScaleAndPosition();

        this.app.stage.addChild(this.sprite);
        this.app.stage.addChild(this.spaceLayer);
        this.app.stage.addChild(this.pieceLayer);

        this.applyBoardConfig(boardConfig);
        this.drawBoardSpaces();
    }

    applyBoardConfig(config: BoardConfig) {
        this.grid = config.grid;
        this.spaces = config.spaces.map(space => ({
            ...space,
            position: this.cellToWorld(space.col, space.row)
        }));

        this.paths = {};
        Object.entries(config.paths).forEach(([playerIdStr, ids]) => {
            const playerId = Number(playerIdStr);
            this.paths[playerId] = ids
                .map(id => this.findSpace(id))
                .filter(Boolean) as BoardSpace[];
        });
    }

    applyScaleAndPosition() {
        if (!this.sprite) return;
        this.sprite.x = this.app.screen.width / 2;
        this.sprite.y = this.app.screen.height / 2;
        const scaleX = this.app.screen.width / this.baseWidth;
        const scaleY = this.app.screen.height / this.baseHeight;
        this.sprite.scale.set(Math.min(scaleX, scaleY));
    }

    handleResize() {
        if (!this.sprite) return;
        this.applyScaleAndPosition();
        this.updateSpacePositions();
        this.redrawBoardSpaces();
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

    redrawBoardSpaces() {
        this.spaceLayer.removeChildren();
        this.drawBoardSpaces();
    }

    updateSpacePositions() {
        this.spaces.forEach(space => {
            space.position = this.cellToWorld(space.col, space.row);
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
