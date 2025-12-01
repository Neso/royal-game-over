import { Application, Container, Text, Graphics } from 'pixi.js';

export class MainMenu extends Container {
    app: Application;
    onStartGame: () => void;
    onShowRules: () => void;

    constructor(app: Application) {
        super();
        this.app = app;
        this.visible = false; // Hidden by default
        this.onStartGame = () => {}; // Default empty callback
        this.onShowRules = () => {}; // Default empty callback
        this.setupMenu();
    }

    alignMenu() {
        this.x = this.app.screen.width / 2;
        this.y = this.app.screen.height / 2;
    }

    setupMenu() {
        // Start Game Button
        const startGameButton = this.createButton('Start Game', () => this.onStartGame());
        startGameButton.y = -50;
        this.addChild(startGameButton);

        // Rules Button
        const rulesButton = this.createButton('Rules', () => this.onShowRules());
        rulesButton.y = 50;
        this.addChild(rulesButton);
    }

    createButton(text, onClick) {
        const button = new Container();
        button.eventMode = 'static'; // Enable interactivity
        button.cursor = 'pointer';

        const background = new Graphics();
        background.beginFill(0x000000, 0.5); // Semi-transparent black background
        background.drawRect(-100, -30, 200, 60); // Centered rectangle
        background.endFill();
        button.addChild(background);

        const buttonText = new Text(text, {
            fill: 0xffffff,
            fontSize: 24,
            align: 'center',
        });
        buttonText.anchor.set(0.5); // Center the text
        button.addChild(buttonText);

        button.on('pointertap', onClick);

        return button;
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }
}
