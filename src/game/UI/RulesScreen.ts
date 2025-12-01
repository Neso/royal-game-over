import { Application, Container, Text, Graphics, Rectangle } from 'pixi.js';

export class RulesScreen extends Container {
    app: Application;
    onBackCallback: () => void;

    constructor(app: Application, onBackCallback: () => void) {
        super();
        this.app = app;
        this.onBackCallback = onBackCallback;
        this.visible = false; // Hidden by default
        this.setupRulesScreen();
    }

    alignScreen() {
        this.x = this.app.screen.width / 2;
        this.y = this.app.screen.height / 2;
    }

    async setupRulesScreen() {
        // Background
        const background = new Graphics();
        background.beginFill(0x000000, 0.8);
        background.drawRect(-350, -250, 700, 500);
        background.endFill();
        this.addChild(background);

        // Scrollable container for rules
        const maskRect = new Rectangle(-320, -220, 640, 400);
        const maskGraphics = new Graphics();
        maskGraphics.beginFill(0xffffff);
        maskGraphics.drawRect(maskRect.x, maskRect.y, maskRect.width, maskRect.height);
        maskGraphics.endFill();

        const scrollContainer = new Container();
        scrollContainer.mask = maskGraphics;
        scrollContainer.eventMode = 'static';
        this.addChild(maskGraphics);
        this.addChild(scrollContainer);

        // Load rules text
        const rulesTextContent = await fetch('/src/assets/rules.txt').then(res => res.text());

        const rulesText = new Text(rulesTextContent, {
            fill: 0xffffff,
            fontSize: 18,
            wordWrap: true,
            wordWrapWidth: 620,
            lineHeight: 24
        });
        rulesText.anchor.set(0.5, 0); // Anchor top-center
        rulesText.y = maskRect.y; // start at top of mask
        scrollContainer.addChild(rulesText);

        const clampY = (y) => {
            const minY = maskRect.y - Math.max(0, rulesText.height - maskRect.height);
            const maxY = maskRect.y;
            return Math.min(maxY, Math.max(minY, y));
        };

        const updateScrollbar = () => {
            const overflow = Math.max(0, rulesText.height - maskRect.height);
            const trackHeight = maskRect.height;
            const thumbHeight = overflow > 0 ? Math.max(20, (maskRect.height / rulesText.height) * trackHeight) : trackHeight;
            const scrollRatio = overflow > 0 ? (maskRect.y - rulesText.y) / overflow : 0;
            scrollbarThumb.clear();
            scrollbarThumb.beginFill(0xffffff, 0.4);
            scrollbarThumb.drawRoundedRect(-4, -thumbHeight / 2, 8, thumbHeight, 4);
            scrollbarThumb.endFill();
            scrollbarThumb.y = maskRect.y + scrollRatio * (trackHeight - thumbHeight) + thumbHeight / 2;
        };

        // Scroll via mouse wheel
        scrollContainer.on('wheel', (event) => {
            const delta = Math.sign(event.deltaY) * 20;
            rulesText.y = clampY(rulesText.y - delta);
            updateScrollbar();
        });

        // Touch/drag scroll
        let dragStartY = null;
        let textStartY = null;
        const onPointerDown = (event) => {
            dragStartY = event.global.y;
            textStartY = rulesText.y;
            scrollContainer.cursor = 'grabbing';
        };
        const onPointerMove = (event) => {
            if (dragStartY === null) return;
            const dy = event.global.y - dragStartY;
            rulesText.y = clampY(textStartY + dy);
            updateScrollbar();
        };
        const onPointerUp = () => {
            dragStartY = null;
            textStartY = null;
            scrollContainer.cursor = 'grab';
        };

        scrollContainer.cursor = 'grab';
        scrollContainer.on('pointerdown', onPointerDown);
        scrollContainer.on('pointermove', onPointerMove);
        scrollContainer.on('pointerup', onPointerUp);
        scrollContainer.on('pointerupoutside', onPointerUp);
        scrollContainer.on('pointercancel', onPointerUp);

        // Scrollbar visuals
        const scrollbarTrack = new Graphics();
        scrollbarTrack.beginFill(0xffffff, 0.12);
        scrollbarTrack.drawRoundedRect(maskRect.x + maskRect.width + 6, maskRect.y, 6, maskRect.height, 3);
        scrollbarTrack.endFill();
        this.addChild(scrollbarTrack);

        const scrollbarThumb = new Graphics();
        scrollbarThumb.x = maskRect.x + maskRect.width + 9;
        this.addChild(scrollbarThumb);
        updateScrollbar();

        // Back Button
        const backButton = this.createButton('Back', this.onBackCallback);
        backButton.y = 200; // Position at the bottom
        this.addChild(backButton);
    }

    createButton(text, onClick) {
        const button = new Container();
        button.eventMode = 'static';
        button.cursor = 'pointer';

        const background = new Graphics();
        background.beginFill(0x555555);
        background.drawRect(-75, -25, 150, 50);
        background.endFill();
        button.addChild(background);

        const buttonText = new Text(text, {
            fill: 0xffffff,
            fontSize: 20,
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
