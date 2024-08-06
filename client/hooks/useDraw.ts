import { useEffect, useRef, useState } from 'react'

export const useDraw = (onDraw: ({ ctx, currentPoint, prevPoint }: Draw) => void) => {
  const [mouseDown, setMouseDown] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prevPoint = useRef<null | Point>(null)

  const onMouseDown = () => setMouseDown(true)
  const onTouchStart = () => setMouseDown(true)

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (!mouseDown) return

      let currentPoint: Point | null = null
      if (e instanceof MouseEvent) {
        currentPoint = computePointInCanvas(e)
      } else if (e instanceof TouchEvent) {
        currentPoint = computePointInCanvas(e.touches[0])
      }

      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx || !currentPoint) return

      onDraw({ ctx, currentPoint, prevPoint: prevPoint.current })
      prevPoint.current = currentPoint
    }

    const computePointInCanvas = (e: MouseEvent | Touch) => {
      const canvas = canvasRef.current
      if (!canvas) return null

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      return { x, y }
    }

    const mouseUpHandler = () => {
      setMouseDown(false)
      prevPoint.current = null
    }

    // Add event listeners
    const canvas = canvasRef.current
    canvas?.addEventListener('mousemove', handler)
    canvas?.addEventListener('touchmove', handler)
    window.addEventListener('mouseup', mouseUpHandler)
    window.addEventListener('touchend', mouseUpHandler)

    // Remove event listeners
    return () => {
      canvas?.removeEventListener('mousemove', handler)
      canvas?.removeEventListener('touchmove', handler)
      window.removeEventListener('mouseup', mouseUpHandler)
      window.removeEventListener('touchend', mouseUpHandler)
    }
  }, [mouseDown, onDraw])

  return { canvasRef, onMouseDown, onTouchStart, clear }
}
