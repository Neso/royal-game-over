export class Piece {
    id: number;
    playerId: number;
    color: number;
    positionIndex: number | null;
    finished: boolean;

    constructor(id: number, playerId: number, color: number) {
        this.id = id;
        this.playerId = playerId;
        this.color = color;
        this.positionIndex = null; // null means in hand/home
        this.finished = false;
    }

    isHome() {
        return this.positionIndex === null && !this.finished;
    }

    isFinished() {
        return this.finished;
    }

    reset() {
        this.positionIndex = null;
        this.finished = false;
    }
}
