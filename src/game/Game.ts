import { Application, Assets, Container, Text, Graphics } from 'pixi.js';
import { Board, type BoardSpace } from './Board.js';
import { MainMenu } from './UI/MainMenu.js';
import { RulesScreen } from './UI/RulesScreen.js';
import { VictoryScreen } from './UI/VictoryScreen.js';
import { LogPanel } from './UI/LogPanel.js';
import { Dice } from './Dice.js';
import { Player } from './Player.js';
import { Statistics } from './Statistics.js';

type PendingMove = {
    piece: Player['pieces'][number];
    targetIndex: number | null;
    targetSpace: BoardSpace | null;
    captures: Player['pieces'][number] | null;
    finishes: boolean;
};

export class Game {
    app: Application;
    board: Board;
    mainMenu: MainMenu;
    rulesScreen: RulesScreen;
    victoryScreen: VictoryScreen;
    logPanel: LogPanel;
    statistics: Statistics;

    dice: Dice;
    players: Player[];
    currentPlayer: number;
    pendingMove: PendingMove | null;
    lastRoll: number | null;
    passTimeout: ReturnType<typeof setTimeout> | null;
    controls: Container | null;
    statusText: Text | null;
    rollButton!: Container;
    confirmButton!: Container;
    cancelButton!: Container;

    constructor() {
        this.app = new Application();
        this.board = new Board(this.app);
        this.mainMenu = new MainMenu(this.app);
        this.rulesScreen = new RulesScreen(this.app, this.showMainMenu.bind(this));
        this.victoryScreen = new VictoryScreen(this.app, this.showMainMenu.bind(this));
        this.logPanel = new LogPanel(this.app);
        this.statistics = new Statistics(this.app);

        this.dice = new Dice();
        this.players = [new Player(0, 0x1565c0), new Player(1, 0xffffff)];
        this.currentPlayer = 0;
        this.pendingMove = null;
        this.lastRoll = null;
        this.passTimeout = null;
        this.controls = null;
        this.statusText = null;
    }

    async init(container) {
        await this.app.init({
            width: 800,
            height: 600,
            backgroundColor: 0x1099bb
        });
        container.appendChild(this.app.canvas);
        await this.loadAssets();
        await this.board.init();

        this.app.stage.addChild(this.mainMenu);
        this.app.stage.addChild(this.rulesScreen);
        this.app.stage.addChild(this.victoryScreen);

        this.mainMenu.alignMenu();
        this.rulesScreen.alignScreen();
        this.victoryScreen.alignScreen();

        this.mainMenu.onStartGame = this.startGame.bind(this);
        this.mainMenu.onShowRules = this.showRulesScreen.bind(this);

        this.setupGameplayUI();
        this.setupLogPanel();
        this.setupStatistics();
        this.showMainMenu();
    }

    async loadAssets() {
        await Assets.load('/src/assets/board.png');
    }

    setupGameplayUI() {
        this.controls = new Container();
        this.controls.visible = false;
        this.controls.x = 10;
        this.controls.y = 10;

        const panel = new Graphics();
        panel.beginFill(0x000000, 0.45);
        panel.drawRoundedRect(0, 0, 220, 120, 8);
        panel.endFill();
        this.controls.addChild(panel);

        this.rollButton = this.createButton('Roll Dice', () => this.handleRoll(), 10, 10);
        this.confirmButton = this.createButton('Confirm Move', () => this.confirmMove(), 10, 60);
        this.cancelButton = this.createButton('Cancel', () => this.cancelMove(), 120, 60);

        this.controls.addChild(this.rollButton);
        this.controls.addChild(this.confirmButton);
        this.controls.addChild(this.cancelButton);

        this.statusText = new Text('Ready', {
            fill: 0xffffff,
            fontSize: 14
        });
        this.statusText.x = 110;
        this.statusText.y = 15;
        this.controls.addChild(this.statusText);

        this.app.stage.addChild(this.controls);
    }

    setupLogPanel() {
        const width = 180;
        const height = 520;
        const margin = 10;
        this.logPanel.init({
            x: this.app.screen.width - width - margin,
            y: margin,
            width,
            height
        });
        this.logPanel.container.visible = false;
        this.app.stage.addChild(this.logPanel.container);
    }

    setupStatistics() {
        const x = this.controls.x;
        const y = this.controls.y + 140;
        this.statistics.init({ x, y, width: 220, height: 200 });
        this.statistics.container.visible = false;
        this.app.stage.addChild(this.statistics.container);
    }

    createButton(label, onClick, x, y) {
        const button = new Container();
        button.eventMode = 'static';
        button.cursor = 'pointer';
        const bg = new Graphics();
        bg.beginFill(0x444444);
        bg.drawRoundedRect(0, 0, 90, 34, 6);
        bg.endFill();
        const txt = new Text(label, { fill: 0xffffff, fontSize: 12 });
        txt.anchor.set(0.5);
        txt.x = 45;
        txt.y = 17;
        button.addChild(bg);
        button.addChild(txt);
        button.x = x;
        button.y = y;
        button.on('pointertap', onClick);
        return button;
    }

    showMainMenu() {
        this.mainMenu.show();
        this.rulesScreen.hide();
        this.victoryScreen.hide();
        this.controls.visible = false;
        if (this.statistics?.container) {
            this.statistics.container.visible = false;
        }
        if (this.logPanel?.container) {
            this.logPanel.container.visible = false;
        }
    }

    showRulesScreen() {
        this.mainMenu.hide();
        this.rulesScreen.show();
        this.victoryScreen.hide();
        this.controls.visible = false;
        if (this.statistics?.container) {
            this.statistics.container.visible = false;
        }
        if (this.logPanel?.container) {
            this.logPanel.container.visible = false;
        }
    }

    showVictoryScreen() {
        this.mainMenu.hide();
        this.rulesScreen.hide();
        this.victoryScreen.show();
        this.controls.visible = false;
        if (this.statistics?.container) {
            this.statistics.container.visible = false;
        }
        if (this.logPanel?.container) {
            this.logPanel.container.visible = false;
        }
    }

    startGame() {
        this.mainMenu.hide();
        this.rulesScreen.hide();
        this.victoryScreen.hide();
        this.controls.visible = true;
        if (this.statistics?.container) {
            this.statistics.container.visible = true;
        }
        if (this.logPanel?.container) {
            this.logPanel.container.visible = true;
        }
        this.resetGameState();
        this.beginTurn();
    }

    resetGameState() {
        this.players.forEach(player => player.reset());
        this.currentPlayer = 0;
        this.pendingMove = null;
        this.lastRoll = null;
        this.clearScheduledAdvance();
        this.board.updatePieces(this.getAllPieces());
        this.updateStatus('Player 1: roll the dice');
        this.enableRoll(true);
        this.enableConfirm(false);
        this.enableCancel(false);
        this.logPanel?.reset();
        const startStamp = new Date().toLocaleTimeString();
        this.logPanel?.append(`Game started at ${startStamp}`);
        this.logPanel?.append('New game started');
        this.logPanel?.append('Player 1 turn');
        this.statistics?.reset();
        this.statistics?.syncPieces(this.players);

        // wire piece tokens for interaction
        this.board.pieceTokens.forEach((token, key) => {
            token.off('pointertap');
            token.on('pointertap', () => this.handlePieceClick(key));
        });
    }

    getAllPieces() {
        return [...this.players[0].pieces, ...this.players[1].pieces];
    }

    updateStatus(text) {
        if (this.statusText) {
            this.statusText.text = text;
        }
    }

    enableRoll(enabled) {
        this.rollButton.alpha = enabled ? 1 : 0.4;
        this.rollButton.eventMode = enabled ? 'static' : 'none';
    }

    enableConfirm(enabled) {
        this.confirmButton.alpha = enabled ? 1 : 0.4;
        this.confirmButton.eventMode = enabled ? 'static' : 'none';
    }

    enableCancel(enabled) {
        this.cancelButton.alpha = enabled ? 1 : 0.4;
        this.cancelButton.eventMode = enabled ? 'static' : 'none';
    }

    beginTurn() {
        this.pendingMove = null;
        this.lastRoll = null;
        this.clearScheduledAdvance();
        this.enableRoll(true);
        this.enableConfirm(false);
        this.enableCancel(false);
        this.updateStatus(`Player ${this.currentPlayer + 1}: roll the dice`);
        this.logPanel?.append(`Player ${this.currentPlayer + 1} turn`);
        this.updateTokenHighlights();
    }

    handleRoll() {
        const result = this.dice.roll();
        this.lastRoll = result.successes;
        this.updateStatus(`Rolled ${result.rolls.join(', ')} → ${result.successes} moves`);
        this.logPanel?.append(
            `Player ${this.currentPlayer + 1} rolled ${result.successes} (${result.rolls.join(', ')})`
        );
        this.statistics?.recordRoll(this.currentPlayer, this.lastRoll);
        this.enableRoll(false);
        this.enableCancel(false);
        this.enableConfirm(false);
        this.updateTokenHighlights();

        if (this.lastRoll === 0) {
            this.scheduleAutoAdvance('No moves available, passing turn');
            return;
        }

        if (!this.hasAnyValidMove(this.currentPlayer, this.lastRoll)) {
            this.scheduleAutoAdvance('No valid moves, passing turn');
        }
    }

    hasAnyValidMove(playerId, steps) {
        return this.players[playerId].pieces
            .filter(piece => !piece.isFinished())
            .some(piece => this.tryPrepareMove(piece, steps));
    }

    handlePieceClick(key) {
        if (this.lastRoll === null || this.lastRoll === 0) {
            return;
        }
        const [playerIdStr, pieceIdStr] = key.split(':');
        const playerId = Number(playerIdStr);
        if (playerId !== this.currentPlayer) {
            return;
        }
        const piece = this.players[playerId].pieces[Number(pieceIdStr)];
        if (piece.isFinished()) {
            return;
        }
        const move = this.tryPrepareMove(piece, this.lastRoll);
        if (!move) {
            this.updateStatus('Invalid move for that piece; choose another');
            if (!this.hasAnyValidMove(this.currentPlayer, this.lastRoll)) {
                this.scheduleAutoAdvance('No valid moves, passing turn');
            }
            return;
        }
        this.pendingMove = move;
        this.enableConfirm(true);
        this.enableCancel(true);
        this.updateStatus(
            `Move piece ${piece.id + 1} by ${this.lastRoll} (tap Confirm or Cancel)`
        );
    }

    tryPrepareMove(piece, steps) {
        if (piece.isFinished()) {
            return null;
        }
        const pathLength = this.board.getPathLength(piece.playerId);
        const startIndex = piece.positionIndex === null ? -1 : piece.positionIndex;
        const targetIndex = startIndex + steps;

        if (steps <= 0) {
            return null;
        }

        if (targetIndex > pathLength) {
            // must land exactly on exit
            return null;
        }

        if (targetIndex === pathLength) {
            return {
                piece,
                targetIndex: null,
                targetSpace: null,
                captures: null,
                finishes: true
            };
        }

        const targetSpace = this.board.getSpaceForPlayer(piece.playerId, targetIndex);
        if (!targetSpace) {
            return null;
        }

        const occupant = this.findPieceOnSpace(targetSpace.id);
        if (occupant && occupant.playerId === piece.playerId) {
            return null;
        }

        if (occupant && (targetSpace.isSafe || targetSpace.isFort)) {
            return null;
        }

        return {
            piece,
            targetIndex,
            targetSpace,
            captures: occupant || null,
            finishes: false
        };
    }

    findPieceOnSpace(spaceId) {
        return this.getAllPieces().find(
            p =>
                p.positionIndex !== null &&
                this.board.getSpaceForPlayer(p.playerId, p.positionIndex)?.id === spaceId
        );
    }

    confirmMove() {
        if (!this.pendingMove) {
            return;
        }
        const move = this.pendingMove;

        if (move.captures) {
            move.captures.reset();
            this.logPanel?.append(
                `Player ${this.currentPlayer + 1} captured piece ${move.captures.id + 1}`
            );
            this.statistics?.recordCapture(this.currentPlayer);
        }

        if (move.finishes) {
            move.piece.finished = true;
            move.piece.positionIndex = null;
            this.logPanel?.append(
                `Player ${this.currentPlayer + 1} moved piece ${move.piece.id + 1} off the board`
            );
        } else {
            move.piece.positionIndex = move.targetIndex;
            this.logPanel?.append(
                `Player ${this.currentPlayer + 1} moved piece ${move.piece.id + 1} to ${move.targetSpace.id}`
            );
        }

        this.board.updatePieces(this.getAllPieces());
        this.statistics?.syncPieces(this.players);
        this.updateTokenHighlights();
        const isRosetta =
            move.targetSpace?.isRosetta ||
            (move.finishes && false); // finish does not trigger re-roll

        if (this.players[this.currentPlayer].allFinished()) {
            this.showVictoryScreen();
            this.logPanel?.append(`Player ${this.currentPlayer + 1} wins!`);
            return;
        }

        if (isRosetta) {
            this.pendingMove = null;
            this.lastRoll = null;
            this.enableConfirm(false);
            this.enableCancel(false);
            this.enableRoll(true);
            this.updateStatus(`Player ${this.currentPlayer + 1}: bonus roll`);
            this.logPanel?.append(`Player ${this.currentPlayer + 1} earned a bonus roll`);
            this.statistics?.recordBonus(this.currentPlayer);
            this.updateTokenHighlights();
            return;
        }

        this.advanceTurn();
    }

    cancelMove() {
        this.pendingMove = null;
        this.enableConfirm(false);
        this.enableCancel(false);
        if (this.lastRoll !== null) {
            this.updateStatus(`Player ${this.currentPlayer + 1}: choose a piece`);
        }
    }

    advanceTurn() {
        this.pendingMove = null;
        this.lastRoll = null;
        this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
        this.enableConfirm(false);
        this.enableCancel(false);
        this.enableRoll(true);
        this.updateStatus(`Player ${this.currentPlayer + 1}: roll the dice`);
        this.logPanel?.append(`Player ${this.currentPlayer + 1} turn`);
        this.updateTokenHighlights();
    }

    scheduleAutoAdvance(message) {
        this.updateStatus(message);
        this.logPanel?.append(message);
        this.enableConfirm(false);
        this.enableCancel(false);
        this.clearScheduledAdvance();
        this.passTimeout = setTimeout(() => {
            this.advanceTurn();
        }, 800);
    }

    clearScheduledAdvance() {
        if (this.passTimeout) {
            clearTimeout(this.passTimeout);
            this.passTimeout = null;
        }
    }

    updateTokenHighlights() {
        const currentRoll = this.lastRoll;
        const activePlayer = this.currentPlayer;
        this.getAllPieces().forEach(piece => {
            const key = `${piece.playerId}:${piece.id}`;
            const token = this.board.pieceTokens.get(key);
            if (!token) return;
            if (piece.isFinished()) {
                token.alpha = 0.5;
                token.eventMode = 'none';
                token.cursor = 'default';
                return;
            }
            const eligible =
                currentRoll !== null &&
                currentRoll > 0 &&
                piece.playerId === activePlayer &&
                !!this.tryPrepareMove(piece, currentRoll);
            const disabled = currentRoll !== null && (!eligible || currentRoll === 0);
            token.alpha = disabled ? 0.35 : 1;
            token.eventMode = disabled ? 'none' : 'static';
            token.cursor = disabled ? 'not-allowed' : 'pointer';
        });
    }
}
