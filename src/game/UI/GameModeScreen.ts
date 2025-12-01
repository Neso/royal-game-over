import { Application, Container, Graphics, Text } from 'pixi.js';

type Mode = 'hotseat' | 'ai';

export class GameModeScreen extends Container {
    app: Application;
    onSelectMode: (mode: Mode) => void;

    constructor(app: Application, onSelectMode: (mode: Mode) => void) {
        super();
        this.app = app;
        this.onSelectMode = onSelectMode;
        this.visible = false;
        this.setup();
    }

    setup() {
        const bg = new Graphics();
        bg.beginFill(0x000000, 0.65);
        bg.drawRoundedRect(-220, -140, 440, 280, 12);
        bg.endFill();
        this.addChild(bg);

        const title = new Text('Choose Mode', { fill: 0xffffff, fontSize: 24, align: 'center' });
        title.anchor.set(0.5);
        title.y = -90;
        this.addChild(title);

        const subtitle = new Text('Select how you want to play', { fill: 0xffffff, fontSize: 14 });
        subtitle.anchor.set(0.5);
        subtitle.y = -60;
        this.addChild(subtitle);

        const hotseat = this.createButton('Hot Seat', () => this.onSelectMode('hotseat'));
        hotseat.y = -10;
        this.addChild(hotseat);

        const ai = this.createButton('Play Against AI', () => this.onSelectMode('ai'));
        ai.y = 60;
        this.addChild(ai);
    }

    createButton(label: string, onClick: () => void) {
        const button = new Container();
        button.eventMode = 'static';
        button.cursor = 'pointer';
        const bg = new Graphics();
        bg.beginFill(0x1565c0, 0.85);
        bg.drawRoundedRect(-150, -25, 300, 50, 10);
        bg.endFill();
        button.addChild(bg);

        const txt = new Text(label, { fill: 0xffffff, fontSize: 18, align: 'center' });
        txt.anchor.set(0.5);
        button.addChild(txt);

        button.on('pointertap', onClick);
        return button;
    }

    align() {
        this.x = this.app.screen.width / 2;
        this.y = this.app.screen.height / 2;
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }
}
