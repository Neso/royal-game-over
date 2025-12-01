import { Application, Container, Text, Graphics } from 'pixi.js';

export class VictoryScreen extends Container {
    app: Application;
    onBackToMainMenu: () => void;
    subText: Text | null;

    constructor(app: Application, onBackToMainMenu: () => void) {
        super();
        this.app = app;
        this.onBackToMainMenu = onBackToMainMenu;
        this.visible = false; // Hidden by default
        this.subText = null;
        this.setupVictoryScreen();
    }

    alignScreen() {
        this.x = this.app.screen.width / 2;
        this.y = this.app.screen.height / 2;
    }

    setupVictoryScreen() {
        // Background
        const background = new Graphics();
        background.beginFill(0x000000, 0.8);
        background.drawRect(-200, -150, 400, 300);
        background.endFill();
        this.addChild(background);

        // Victory Text
        const victoryText = new Text('VICTORY!', {
            fill: 0xffff00,
            fontSize: 48,
            align: 'center',
            fontWeight: 'bold'
        });
        victoryText.anchor.set(0.5);
        victoryText.y = -50;
        this.addChild(victoryText);

        const subText = new Text('', { fill: 0xffffff, fontSize: 18, align: 'center' });
        subText.anchor.set(0.5);
        subText.y = 10;
        this.subText = subText;
        this.addChild(subText);

        // Back to Main Menu Button
        const backButton = this.createButton('Back to Main Menu', this.onBackToMainMenu);
        backButton.y = 100;
        this.addChild(backButton);
    }

    createButton(text, onClick) {
        const button = new Container();
        button.eventMode = 'static';
        button.cursor = 'pointer';

        const background = new Graphics();
        background.beginFill(0x555555);
        background.drawRect(-100, -25, 200, 50);
        background.endFill();
        button.addChild(background);

        const buttonText = new Text(text, {
            fill: 0xffffff,
            fontSize: 20,
            align: 'center',
        });
        buttonText.anchor.set(0.5);
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

    setWinner(name: string) {
        if (this.subText) {
            this.subText.text = `${name} wins!`;
        }
    }
}
