import { Board, type BoardSpace } from '../Board.js';
import { Player } from '../Player.js';

type Move = {
    piece: Player['pieces'][number];
    targetIndex: number | null;
    targetSpace: BoardSpace | null;
    captures: Player['pieces'][number] | null;
    finishes: boolean;
};

type GameState = {
    board: Board;
    players: Player[];
};

export class JimmyAI {
    playerId: number;
    board: Board;

    constructor(playerId: number, board: Board) {
        this.playerId = playerId;
        this.board = board;
    }

    chooseMove(gameState: GameState, availableMoves: Move[]): Move | null {
        if (!availableMoves.length) return null;

        const moves = availableMoves.filter(m => m.piece.playerId === this.playerId);

        // Priority 1: move that lands on a rosetta (bonus)
        const rosettaMoves = moves.filter(m => m.targetSpace?.isRosetta);
        if (rosettaMoves.length) {
            return this.pickDeterministic(rosettaMoves);
        }

        // Priority 1b (per spec wording): enter board (from hand)
        const entryMoves = moves.filter(m => m.piece.positionIndex === null);
        if (entryMoves.length) {
            return this.pickDeterministic(entryMoves);
        }

        // Priority 2: capture
        const captureMoves = moves.filter(m => !!m.captures);
        if (captureMoves.length) {
            return this.pickDeterministic(captureMoves);
        }

        // Priority 3: exit
        const exitMoves = moves.filter(m => m.finishes);
        if (exitMoves.length) {
            return this.pickDeterministic(exitMoves);
        }

        // Priority 4: advance closest-to-exit, non-fort
        const nonFortMoves = moves
            .map(move => {
                const space = this.getCurrentSpace(move.piece);
                return { move, space };
            })
            .filter(({ space }) => space && !space.isFort);

        if (nonFortMoves.length) {
            const distances = nonFortMoves.map(({ move, space }) => ({
                move,
                distance: this.distanceToExit(move.piece)
            }));
            const minDist = Math.min(...distances.map(d => d.distance));
            const closest = distances.filter(d => d.distance === minDist).map(d => d.move);
            if (closest.length) {
                return this.pickDeterministic(closest);
            }
        }

        // Priority 5: from fort (either capture or only option)
        const fortMoves = moves
            .map(move => {
                const space = this.getCurrentSpace(move.piece);
                return { move, space };
            })
            .filter(({ space }) => space?.isFort);

        if (fortMoves.length) {
            const capturingFromFort = fortMoves.filter(f => f.move.captures);
            if (capturingFromFort.length) {
                return this.pickDeterministic(capturingFromFort.map(f => f.move));
            }
            return this.pickDeterministic(fortMoves.map(f => f.move));
        }

        return null;
    }

    private pickDeterministic(moves: Move[]): Move {
        // Stable choice: lowest piece id, then lowest targetIndex (null last)
        return moves.sort((a, b) => {
            if (a.piece.id !== b.piece.id) return a.piece.id - b.piece.id;
            const aIdx = a.targetIndex === null ? Infinity : a.targetIndex;
            const bIdx = b.targetIndex === null ? Infinity : b.targetIndex;
            return aIdx - bIdx;
        })[0];
    }

    private getCurrentSpace(piece: Player['pieces'][number]) {
        if (piece.positionIndex === null) return null;
        return this.board.getSpaceForPlayer(piece.playerId, piece.positionIndex);
    }

    private distanceToExit(piece: Player['pieces'][number]) {
        const pathLength = this.board.getPathLength(piece.playerId);
        const positionIndex = piece.positionIndex ?? -1;
        return pathLength - positionIndex;
    }
}
