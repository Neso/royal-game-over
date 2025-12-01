import { Container, Graphics, Text } from 'pixi.js';

type Counts = [number, number, number, number, number]; // results 0-4

type PlayerStats = {
    counts: Counts;
    total: number;
    captures: number;
    bonuses: number;
    waiting: number;
    home: number;
};

export class Statistics {
    app: any;
    container: Container;
    data: Record<number, PlayerStats>;
    rows: Record<number, Text>;
    headers: Record<number, Text>;
    round: number;
    roundText: Text | null;
    startingPlayer: number | null;

    constructor(app: any) {
        this.app = app;
        this.container = new Container();
        this.data = {
            0: { counts: [0, 0, 0, 0, 0], total: 0, captures: 0, bonuses: 0, waiting: 0, home: 0 },
            1: { counts: [0, 0, 0, 0, 0], total: 0, captures: 0, bonuses: 0, waiting: 0, home: 0 }
        };
        this.rows = {};
        this.headers = {};
        this.round = 1;
        this.roundText = null;
        this.startingPlayer = null;
    }

    init(opts: { x: number; y: number; width?: number; height?: number }) {
        const { x, y, width = 240, height = 200 } = opts;
        this.container.x = x;
        this.container.y = y;

        const panel = new Graphics();
        panel.beginFill(0x000000, 0.45);
        panel.drawRoundedRect(0, 0, width, height, 8);
        panel.endFill();
        this.container.addChild(panel);

        const title = new Text('Statistics', { fill: 0xffffff, fontSize: 14 });
        title.x = 10;
        title.y = 8;
        this.container.addChild(title);

        const roundText = new Text('Round 1', { fill: 0xffffff, fontSize: 12 });
        roundText.x = width - 90;
        roundText.y = 8;
        this.roundText = roundText;
        this.container.addChild(roundText);

        const colWidth = (width - 30) / 2;
        [0, 1].forEach(playerId => {
            const header = new Text('', { fill: 0xffffff, fontSize: 12 });
            header.x = 10 + playerId * (colWidth + 10);
            header.y = 32;
            this.container.addChild(header);
            this.headers[playerId] = header;

            const row = new Text('', { fill: 0xffffff, fontSize: 11 });
            row.x = header.x + 4;
            row.y = header.y + 16;
            this.rows[playerId] = row;
            this.container.addChild(row);
        });

        this.renderHeaders();
        this.render();
    }

    reset() {
        this.data[0] = { counts: [0, 0, 0, 0, 0], total: 0, captures: 0, bonuses: 0, waiting: 0, home: 0 };
        this.data[1] = { counts: [0, 0, 0, 0, 0], total: 0, captures: 0, bonuses: 0, waiting: 0, home: 0 };
        this.round = 1;
        this.startingPlayer = null;
        this.updateRoundText();
        this.renderHeaders();
        this.render();
    }

    recordRoll(playerId: number, successes: number) {
        if (!(playerId in this.data)) return;
        const clamped = Math.max(0, Math.min(4, successes));
        this.data[playerId].counts[clamped] += 1;
        this.data[playerId].total += 1;
        this.render();
    }

    setStartingPlayer(playerId: number) {
        this.startingPlayer = playerId;
        this.renderHeaders();
    }

    private renderHeaders() {
        [0, 1].forEach(playerId => {
            const header = this.headers[playerId];
            if (!header) return;
            const isStarter = this.startingPlayer === playerId;
            header.text = `Player ${playerId + 1}${isStarter ? ' (start)' : ''}`;
        });
    }

    setRound(round: number) {
        this.round = round;
        this.updateRoundText();
    }

    private updateRoundText() {
        if (this.roundText) {
            this.roundText.text = `Round ${this.round}`;
        }
    }

    recordCapture(playerId: number) {
        if (!(playerId in this.data)) return;
        this.data[playerId].captures += 1;
        this.render();
    }

    recordBonus(playerId: number) {
        if (!(playerId in this.data)) return;
        this.data[playerId].bonuses += 1;
        this.render();
    }

    syncPieces(players: { id: number; pieces: { isFinished: () => boolean; positionIndex: number | null }[] }[]) {
        players.forEach(player => {
            const entry = this.data[player.id];
            if (!entry) return;
            entry.waiting = 0;
            entry.home = 0;
            player.pieces.forEach(piece => {
                if (piece.isFinished()) {
                    entry.home += 1;
                } else if (piece.positionIndex === null) {
                    entry.waiting += 1;
                }
            });
        });
        this.render();
    }

    render() {
        [0, 1].forEach(playerId => {
            const row = this.rows[playerId];
            if (!row) return;
            const entry = this.data[playerId];
            const total = entry.total || 1; // avoid div by zero
            const rollLines = entry.counts.map((count, idx) => {
                const pct = Math.round((count / total) * 100);
                return `  ${idx}: ${count} (${pct}%)`;
            });
            const lines = [
                'Rolls:',
                ...rollLines,
                `Bonus rolls: ${entry.bonuses}`,
                `Captures: ${entry.captures}`,
                `Waiting: ${entry.waiting}`,
                `Home: ${entry.home}`
            ];
            row.text = lines.join('\n');
        });
    }
}
