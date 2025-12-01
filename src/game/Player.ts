import { Piece } from './Piece.js';

export class Player {
    id: number;
    color: number;
    pieces: Piece[];

    constructor(id: number, color: number) {
        this.id = id;
        this.color = color;
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
