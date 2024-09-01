import * as React from 'react'
import styles from './panel.module.css'
// import { app, useAppState } from 'state'
import { GitHubLogoIcon, HamburgerMenuIcon, EnterFullScreenIcon, ExitFullScreenIcon } from '@radix-ui/react-icons';
import { DefaultColorStyle, DefaultSizeStyle, useEditor } from '@tldraw/tldraw';

export function Panel(props: any) {

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const editor = useEditor();

  return (
    <>
      {/* <div className={[styles.top, styles.center].join(' ')}>
        <a
          href="https://github.com/fossephate/fridge-board"
          target="_blank"
          rel="noopener nofollow"
        >
          fridge-board #{roomCode} {pingCount}
        </a>
      </div> */}
      {/* <div className={[styles.container, styles.top, styles.left].join(' ')}>
        <a onClick={app.togglePanelOpen}>
          <HamburgerMenuIcon height={24} width={24} color="black" />
        </a>
      </div> */}
      {!props.isFullscreen && (<div className={[styles.container, styles.top, styles.right].join(' ')}>
        <a
          href="https://github.com/fossephate/fridge-board"
          target="_blank"
          rel="noopener nofollow"
        >
          <GitHubLogoIcon height={24} width={24} />
        </a>
      </div>)}
      <div className={[styles.container, styles.bottom, styles.right, 'mb-20 mr-2 flex flex-col'].join(' ')}>

        <div className={'flex flex-row gap-2 justify-end'}>
          {/* <button
            onClick={app.selectDrawingTool}
            data-active={tool === 'draw'}
          >
            Draw
          </button> */}
          {/* <button
            // onClick={app.selectErasingTool}
            onClick={() => {
              // editor.setCurrentTool('eraser');
              // editor.setStyleForNextShapes(DefaultColorStyle, "#F8F9FA", { ephemeral: true });
              editor.setStyleForNextShapes(DefaultColorStyle, "white", { ephemeral: true });
              editor.setStyleForNextShapes(DefaultSizeStyle, "xl", { ephemeral: true });

            }}
          >
            True Eraser
          </button> */}
          <button
            onClick={() => {
              // editor.setCurrentTool('eraser');
              let allShapes = Array.from(editor.getCurrentPageShapeIds());
              editor.deleteShapes(allShapes);
            }}
          >
            Clear
          </button>
        </div>
        {!isMobile && (
          <div className='flex flex-row gap-2 justify-end'>
            <button onClick={() => {
              if (!props.isFullscreen) {
                props.setFullscreen();
                app.setFullscreen(true);
              } else {
                document.exitFullscreen();
                app.setFullscreen(false);
              }
            }}>
              <div>
                {(props.isFullscreen == true) ? <ExitFullScreenIcon height={24} width={24} color="black" /> : <EnterFullScreenIcon height={24} width={24} color="black" />}
              </div>
            </button>
          </div>)}
      </div>
    </>
  )
}
