import * as React from 'react'
import { Renderer } from '@tldraw/core'
import { app, useAppState } from 'state'
import styles from './editor.module.css'


import { io } from 'socket.io-client';
const socket = io('https://fosse.co', { path: "/8201/socket.io" })

export function Editor(): JSX.Element {
  const {
    onPinch,
    onPinchStart,
    onPinchEnd,
    onPan,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    shapeUtils,
  } = app
  const { page, pageState } = useAppState()

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.freehand = app


    socket.on('drawing', (data) => {
      app.page.shapes = data.shapes;
      app.pageState = data.pageState;
      app.notifyChange();
    });

    return () => {
      socket.off('drawing');
    };
  }, [])


  const handlePointerUp = React.useCallback((e) => {
    onPointerUp(e);
    socket.emit('drawing', { shapes: app.page.shapes, pageState: app.pageState });
  }, [onPointerUp]);


  return (
    <div className={styles.container}>
      <Renderer
        page={page}
        pageState={pageState}
        shapeUtils={shapeUtils as any}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPinch={onPinch}
        onPinchStart={onPinchStart}
        onPinchEnd={onPinchEnd}
        onPan={onPan}
      />
    </div>
  )
}
