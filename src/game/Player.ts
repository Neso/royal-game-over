import { Piece } from './Piece.js';

export class Player {
    name: string;
    isAI: boolean;
    id: number;
    color: number;
    pieces: Piece[];

    constructor(id: number, color: number, name?: string, isAI = false) {
        this.id = id;
        this.color = color;
        this.name = name || `Player ${id + 1}`;
        this.isAI = isAI;
        this.pieces = Array.from({ length: 7 }, (_, index) => new Piece(index, id, color));
    }

    reset() {
        this.pieces.forEach(piece => piece.reset());
    }

    allFinished() {
        return this.pieces.every(piece => piece.isFinished());
    }

    availablePieces() {
        return this.pieces.filter(piece => !piece.isFinished());
    }
}
