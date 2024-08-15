import { StateNode, Tldraw } from '@tldraw/tldraw';
import 'tldraw/tldraw.css'

// There's a guide at the bottom of this file!

const OFFSET = 12

// [1]
export class Eraser2Tool extends StateNode {
    static override id = 'eraser2'

    // [a]
    override onEnter() {
        this.editor.setCursor({ type: 'cross', rotation: 0 })
    }

    // [b]
    override onPointerDown() {
        const { currentPagePoint } = this.editor.inputs
        this.editor.createShape({
            type: 'text',
            x: currentPagePoint.x - OFFSET,
            y: currentPagePoint.y - OFFSET,
            props: { text: '❤️' },
        })
    }
}