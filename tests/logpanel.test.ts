import { jest } from '@jest/globals';

// Lightweight Pixi mocks to avoid DOM/canvas dependency in tests
jest.unstable_mockModule('pixi.js', () => {
    class MockContainer {
        children: any[];
        x: number;
        y: number;
        visible: boolean;
        eventMode: string;
        constructor() {
            this.children = [];
            this.x = 0;
            this.y = 0;
            this.visible = true;
            this.eventMode = 'none';
        }
        addChild(child: any) {
            this.children.push(child);
        }
        on() {}
    }

    class MockGraphics extends MockContainer {
        beginFill() { return this; }
        endFill() { return this; }
        drawRoundedRect() { return this; }
        drawRect() { return this; }
    }

    class MockText extends MockContainer {
        text: string;
        style: any;
        height: number;
        mask: any;
        wordWrapWidth: number;
        constructor(text = '', style: any = {}) {
            super();
            this.text = text;
            this.style = style;
            this.height = 0;
            this.mask = null;
            this.wordWrapWidth = style.wordWrapWidth || 0;
        }
    }

    return {
        Container: MockContainer,
        Graphics: MockGraphics,
        Text: MockText
    };
});

const { LogPanel } = await import('../src/game/UI/LogPanel.js');

// Minimal stub for app; LogPanel only needs .stage optionally and screen when we call init
const createStubApp = () => ({
    stage: { addChild: jest.fn() },
    screen: { width: 800, height: 600 }
});

describe('LogPanel', () => {
    test('appends messages and keeps text', () => {
        const panel = new LogPanel(createStubApp());
        panel.init({ x: 0, y: 0, width: 180, height: 200 });
        panel.append('first');
        panel.append('second');

        expect(panel.entries).toEqual(['first', 'second']);
        expect(panel.text.text).toContain('first');
        expect(panel.text.text).toContain('second');
    });

    test('reset clears entries and scroll', () => {
        const panel = new LogPanel(createStubApp());
        panel.init({ x: 0, y: 0, width: 180, height: 200 });
        panel.append('first');
        panel.scrollOffset = 10;

        panel.reset();

        expect(panel.entries).toEqual([]);
        expect(panel.text.text).toBe('');
        expect(panel.scrollOffset).toBe(0);
    });
});
