'use client'

import { FC, useEffect, useState, useRef } from 'react'
import { Editor } from '../components/editor'
import { Controls } from '../components/controls'
import { Panel } from '../components/panel'
import { useKeyboardShortcuts } from '../hooks'
import useFullscreenStatus from '../utils/useFullscreenStatus'

interface pageProps { }

const page: FC<pageProps> = ({ }) => {
    useKeyboardShortcuts();
    
    const maximizableElement = useRef(null);
    const [isFullscreen, setIsFullscreen] = useFullscreenStatus(maximizableElement);
    const handleExitFullscreen = () => document.exitFullscreen();

    return (
        <div ref={maximizableElement} className='w-screen pt-12 bg-white flex flex-col justify-center items-center gap-10'>
            <Editor />
            <Controls />
            <Panel isFullscreen={isFullscreen} onExitFullscreen={handleExitFullscreen} setIsFullscreen={setIsFullscreen}/>
            {/* <div className="maximizable-actions">
                {isFullscreen ? (
                    <button onClick={handleExitFullscreen}>Exit Fullscreen</button>
                ) : (
                    <button onClick={setIsFullscreen}>Fullscreen</button>
                )}
            </div> */}
        </div>
    )
}

export default page
