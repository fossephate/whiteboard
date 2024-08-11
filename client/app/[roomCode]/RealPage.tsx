'use client'
import dynamic from 'next/dynamic'


import { FC, lazy, useEffect, useRef } from 'react'
import { Editor } from '../../components/editor';
import { Controls } from '../../components/controls'
import { Panel } from '../../components/panel'
import { useKeyboardShortcuts } from '../../hooks'
import useFullscreenStatus from '../../utils/useFullscreenStatus'
import { AppState, app } from '../../state/state';
import withNoSSR from '../../utils/noSSR';

interface pageProps {
    roomCode: string
}

const RealPage: FC<pageProps> = ({ roomCode }) => {
    useKeyboardShortcuts();

    const maximizableElement = useRef(null);
    const [isFullscreen, setFullscreen] = useFullscreenStatus(maximizableElement);

    useEffect(() => {
        app.setRoomCode(roomCode);
    }, [roomCode]);

    return (
        <div ref={maximizableElement} className='w-screen pt-12 bg-white flex flex-col justify-center items-center gap-10'>
            <Editor />
            <Controls />
            <Panel isFullscreen={isFullscreen} setFullscreen={setFullscreen} />
        </div>
    )
}

export default RealPage;
