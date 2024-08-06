'use client'

import { FC, useEffect, useState, useRef } from 'react'
import { useDraw } from '../hooks/useDraw'
import { ChromePicker } from 'react-color'

import { io } from 'socket.io-client'
import { drawLine } from '../utils/drawLine'
// const socket = io('http://192.168.0.111:8201')
// const socket = io('https://fosse.co/8201/')
const socket = io('https://fosse.co', { path: "/8201/socket.io" })

interface pageProps { }

type DrawLineProps = {
  prevPoint: Point | null
  currentPoint: Point
  color: string
}

const page: FC<pageProps> = ({ }) => {
  const [color, setColor] = useState<string>('#000')
  const [history, setHistory] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const { canvasRef, onMouseDown, clear } = useDraw(createLine)
  const isDrawing = useRef(false)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')

    socket.emit('client-ready')

    socket.on('get-canvas-state', () => {
      if (!canvasRef.current?.toDataURL()) return
      console.log('sending canvas state')
      socket.emit('canvas-state', canvasRef.current.toDataURL())
    })

    socket.on('canvas-state-from-server', (state: string) => {
      console.log('I received the state')
      const img = new Image()
      img.src = state
      img.onload = () => {
        ctx?.drawImage(img, 0, 0)
      }
      setHistory([state])
    })

    socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLineProps) => {
      if (!ctx) return console.log('no ctx here')
      drawLine({ prevPoint, currentPoint, ctx, color })
      saveState()
    })

    socket.on('clear', () => {
      clear()
      saveState()
    })

    return () => {
      socket.off('draw-line')
      socket.off('get-canvas-state')
      socket.off('canvas-state-from-server')
      socket.off('clear')
    }
  }, [canvasRef])

  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    socket.emit('draw-line', { prevPoint, currentPoint, color })
    drawLine({ prevPoint, currentPoint, ctx, color })
  }

  function saveState() {
    if (!canvasRef.current) {
      return
    }
    const dataUrl = canvasRef.current.toDataURL()
    setHistory(prev => [...prev, dataUrl])
    setRedoStack([])
  }

  function undo() {
    if (history.length <= 1) return

    const newHistory = [...history]
    const lastState = newHistory.pop()
    setHistory(newHistory)

    if (lastState) {
      setRedoStack(prev => [lastState, ...prev])
    }

    restoreState(newHistory[newHistory.length - 1])
  }

  function redo() {
    if (redoStack.length === 0) return

    const newRedoStack = [...redoStack]
    const nextState = newRedoStack.shift()
    setRedoStack(newRedoStack)

    if (nextState) {
      setHistory(prev => [...prev, nextState])
      restoreState(nextState)
    }
  }

  function restoreState(state: string) {
    const ctx = canvasRef.current?.getContext('2d')
    const img = new Image()
    img.src = state
    img.onload = () => {
      ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
      ctx?.drawImage(img, 0, 0)
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    onMouseDown(e)
  }

  function handleMouseUp() {
    saveState();
  }

  function toggleFullscreen() {
    const elem = document.documentElement
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  return (
    <div className='w-screen pt-12 bg-white flex flex-col justify-center items-center gap-10'>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        width={750}
        height={750}
        className='border border-black rounded-md'
      />
      <div className='flex flex-col gap-10 pr-10'>
        <div className='flex flex-row gap-4'>
          <button
            type='button'
            className='p-2 rounded-md border border-black'
            onClick={() => { socket.emit('clear'); setHistory([]); setRedoStack([]); }}>
            Clear canvas
          </button>

          <button
            type='button'
            className='p-2 rounded-md border border-black'
            onClick={undo}>
            Undo
          </button>

          <button
            type='button'
            className='p-2 rounded-md border border-black'
            onClick={redo}>
            Redo
          </button>

          <button type="button" className="p-2 rounded-md border border-black" onClick={event => { { toggleFullscreen; } }}>
            Fullscreen
          </button>
        </div>
        <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
      </div>
    </div>
  )
}

export default page
