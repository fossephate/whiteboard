'use client'

import { FC, useEffect, useState, useRef } from 'react'
import { Editor } from '../../components/editor'
import { Controls } from '../../components/controls'
import { Panel } from '../../components/panel'
import { useKeyboardShortcuts } from '../../hooks'
import useFullscreenStatus from '../../utils/useFullscreenStatus'
import { AppState, app } from '../../state/state'

interface pageProps {
    params: {
        roomCode: string;
    };
}

const page: FC<pageProps> = ({ params }) => {
    const { roomCode } = params;
    useKeyboardShortcuts();

    const maximizableElement = useRef(null);
    const [isFullscreen, setIsFullscreen] = useFullscreenStatus(maximizableElement);
    const handleExitFullscreen = () => document.exitFullscreen();

    useEffect(() => {
        app.setRoomCode(roomCode);
    }, [roomCode]);

    return (
        <div ref={maximizableElement} className='w-screen pt-12 bg-white flex flex-col justify-center items-center gap-10'>
            <Editor />
            <Controls />
            <Panel isFullscreen={isFullscreen} onExitFullscreen={handleExitFullscreen} setIsFullscreen={setIsFullscreen} />
        </div>
    )
}

export default page;
