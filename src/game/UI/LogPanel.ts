import { Application, Container, Graphics, Text } from 'pixi.js';

export class LogPanel {
    app: any;
    container: Container;
    entries: string[];
    scrollOffset: number;
    inner: { x: number; y: number; width: number; height: number };
    text: Text | null;
    mask: Graphics | null;
    scrollbar: {
        track: Graphics | null;
        thumb: Graphics | null;
        dragging: boolean;
        dragStartY: number;
        startOffset: number;
    };

    constructor(app: any) {
        this.app = app;
        this.container = new Container();
        this.entries = [];
        this.scrollOffset = 0;
        this.inner = { x: 0, y: 0, width: 0, height: 0 };

        this.text = null;
        this.mask = null;
        this.scrollbar = {
            track: null,
            thumb: null,
            dragging: false,
            dragStartY: 0,
            startOffset: 0
        };
    }

    init({ x, y, width = 230, height = 540 }) {
        this.container.x = x;
        this.container.y = y;

        const bg = new Graphics();
        bg.beginFill(0x000000, 0.45);
        bg.drawRoundedRect(0, 0, width, height, 8);
        bg.endFill();
        this.container.addChild(bg);

        const innerX = 12;
        const innerY = 12;
        const innerWidth = width - innerX * 2;
        const innerHeight = height - innerY * 2;
        this.inner = { x: innerX, y: innerY, width: innerWidth, height: innerHeight };

        const mask = new Graphics();
        mask.beginFill(0xffffff);
        mask.drawRect(innerX, innerY, innerWidth, innerHeight);
        mask.endFill();
        this.mask = mask;
        this.container.addChild(mask);

        this.text = new Text('', {
            fill: 0xffffff,
            fontSize: 12,
            wordWrap: true,
            wordWrapWidth: innerWidth
        });
        this.text.x = innerX;
        this.text.y = innerY;
        this.text.mask = mask;
        this.container.addChild(this.text);

        this.initScrollbar();

        this.container.eventMode = 'static';
        this.container.on('wheel', event => {
            const delta = Math.sign(event.deltaY) * 20;
            this.scrollOffset = Math.max(
                0,
                Math.min(this.getMaxScroll(), this.scrollOffset + delta)
            );
            this.updateView();
        });
        this.container.on('pointermove', event => this.handleDragMove(event));
        this.container.on('pointerup', () => this.stopDrag());
        this.container.on('pointerupoutside', () => this.stopDrag());
    }

    setPosition(x: number, y: number) {
        this.container.x = x;
        this.container.y = y;
    }

    reset() {
        this.entries = [];
        this.scrollOffset = 0;
        this.render();
    }

    append(message) {
        const atBottom = this.scrollOffset >= this.getMaxScroll() - 4;
        this.entries.push(message);
        this.render();
        if (atBottom) {
            this.scrollOffset = this.getMaxScroll();
            this.updateView();
        }
    }

    render() {
        if (!this.text) return;
        this.text.text = this.entries.join('\n');
        this.updateView();
    }

    getMaxScroll() {
        if (!this.text) return 0;
        const overflow = this.text.height - this.inner.height;
        return overflow > 0 ? overflow : 0;
    }

    updateView() {
        if (!this.text) return;
        const maxScroll = this.getMaxScroll();
        this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset));
        this.text.y = this.inner.y - this.scrollOffset;
        this.updateScrollbar();
    }

    initScrollbar() {
        const trackWidth = 6;
        const track = new Graphics();
        track.beginFill(0xffffff, 0.12);
        track.drawRoundedRect(0, 0, trackWidth, this.inner.height, 3);
        track.endFill();
        track.x = this.inner.x + this.inner.width - trackWidth;
        track.y = this.inner.y;
        this.scrollbar.track = track;
        this.container.addChild(track);

        const thumb = new Graphics();
        thumb.beginFill(0xffffff, 0.6);
        thumb.drawRoundedRect(0, 0, trackWidth, 20, 3);
        thumb.endFill();
        thumb.x = track.x;
        thumb.y = track.y;
        thumb.eventMode = 'static';
        thumb.cursor = 'grab';
        thumb.on('pointerdown', event => this.startDrag(event));
        this.scrollbar.thumb = thumb;
        this.container.addChild(thumb);

        // allow dragging from the content area too
        this.container.on('pointerdown', event => this.startDrag(event));
    }

    startDrag(event) {
        if (this.getMaxScroll() === 0) return;
        this.scrollbar.dragging = true;
        this.scrollbar.dragStartY = event.globalY;
        this.scrollbar.startOffset = this.scrollOffset;
        this.scrollbar.thumb.cursor = 'grabbing';
    }

    handleDragMove(event) {
        if (!this.scrollbar.dragging) return;
        const maxScroll = this.getMaxScroll();
        if (maxScroll === 0) return;

        const track = this.scrollbar.track;
        const thumb = this.scrollbar.thumb;
        const thumbRange = track.height - thumb.height;

        const deltaY = event.globalY - this.scrollbar.dragStartY;
        const scrollRatio = maxScroll / (thumbRange || 1);
        this.scrollOffset = Math.max(
            0,
            Math.min(maxScroll, this.scrollbar.startOffset + deltaY * scrollRatio)
        );
        this.updateView();
    }

    stopDrag() {
        if (this.scrollbar.dragging) {
            this.scrollbar.dragging = false;
            this.scrollbar.thumb.cursor = 'grab';
        }
    }

    updateScrollbar() {
        const maxScroll = this.getMaxScroll();
        const track = this.scrollbar.track;
        const thumb = this.scrollbar.thumb;
        if (!track || !thumb) return;

        if (maxScroll === 0) {
            thumb.height = track.height;
            thumb.y = track.y;
            thumb.alpha = 0.3;
            return;
        }

        const visibleRatio = this.inner.height / (this.text.height || this.inner.height);
        thumb.height = Math.max(24, track.height * visibleRatio);
        const thumbRange = track.height - thumb.height;
        thumb.y = track.y + thumbRange * (this.scrollOffset / maxScroll);
        thumb.alpha = 0.8;
    }
}
