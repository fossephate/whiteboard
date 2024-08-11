import * as React from 'react'
import styles from './panel.module.css'
import { app, useAppState } from 'state'
import { GitHubLogoIcon, HamburgerMenuIcon, EnterFullScreenIcon, ExitFullScreenIcon } from '@radix-ui/react-icons';

export function Panel(props: any) {
  const tool = useAppState((s) => s.appState.tool)
  const zoomLevel = useAppState((s) => s.pageState.camera.zoom)
  const isPenModeEnabled = useAppState((s) => s.appState.isPenModeEnabled)
  const status = useAppState((s) => s.appState.status);
  const roomCode = window.location.pathname.split('/').pop();


  

  return (
    <>
      <div className={[styles.top, styles.center].join(' ')}>
        <a
          href="https://github.com/fossephate/whiteboard"
          target="_blank"
          rel="noopener nofollow"
        >
          fridge-board #{roomCode}
        </a>
      </div>
      <div className={[styles.container, styles.top, styles.left].join(' ')}>
        <a onClick={app.togglePanelOpen}>
          <HamburgerMenuIcon height={24} width={24} color="black" />
        </a>
      </div>
      {!props.isFullscreen && (<div className={[styles.container, styles.top, styles.right].join(' ')}>
        <a
          href="https://github.com/fossephate/whiteboard"
          target="_blank"
          rel="noopener nofollow"
        >
          <GitHubLogoIcon height={24} width={24} />
        </a>
      </div>)}
      <div className={[styles.container, styles.bottom, styles.right, 'mb-2 mr-2 flex flex-col'].join(' ')}>

        <div className={'flex flex-row gap-2 justify-end'}>
          <button
            onClick={app.selectDrawingTool}
            data-active={tool === 'draw'}
          >
            Draw
          </button>
          <button
            onClick={app.selectErasingTool}
            data-active={tool === 'eraser'}
          >
            Erase
          </button>
          <button
            onClick={app.selectPanningTool}
            data-active={tool === 'pan'}
          >
            Pan
          </button>
        </div>
        <div className='flex flex-row gap-2 justify-end'>
          <button onClick={() => {
            // app.undo();
            app.undo2();
          }}>Undo</button>
          <button onClick={() => {
            // app.redo();
            app.redo2();
          }}>Redo</button>
        </div>

        <div className='flex flex-row gap-2 justify-end'>
          <button onClick={() => {
            app.zoomTo1();
          }}>{(zoomLevel * 100).toPrecision(3)}%</button>
          <button onClick={app.resetDoc}>Clear</button>
        </div>

        <div className='flex flex-row gap-2 justify-end'>
          <button onClick={() => {
            app.zoomOut();
          }}>-</button>
          <button onClick={() => {
            app.zoomIn();
          }}>+</button>
        </div>
        <div className='flex flex-row gap-2 justify-end'>
          <button onClick={() => {
            props.setIsFullscreen();
          }}>
            <div>
              {(props.isFullscreen == true) ? <ExitFullScreenIcon height={24} width={24} color="black" /> : <EnterFullScreenIcon height={24} width={24} color="black" />}
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
