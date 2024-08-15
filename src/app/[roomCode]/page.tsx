'use client'
import Whiteboard from "../components/Whiteboard";
import { TldrawProvider } from "@/app/providers/tldraw-context";
import { FC, lazy, useEffect, useRef } from 'react';
import { Panel } from '../components/panel';
import useFullscreenStatus from '../../utils/useFullscreenStatus';

interface pageProps {
    params: {
        roomCode: string;
    };
}


const Home: FC<PageProps> = ({ params }) => {
    const { roomCode } = params;

    const maximizableElement = useRef(null);
    const [isFullscreen, setFullscreen] = useFullscreenStatus(maximizableElement);

    return (
        <TldrawProvider>
            <div ref={maximizableElement} className="fixed overflow-hidden inset-0 flex flex-row h-full w-full flex-col sm:flex-row bg-blue-300">
                <div className="grow">
                    <Whiteboard roomCode={roomCode}>
                        <Panel isFullscreen={isFullscreen} setFullscreen={setFullscreen} />
                    </Whiteboard>
                </div>
                {/* <div className="grow-0 shrink-0 w-full sm:w-80 h-1/3 sm:h-full border-l border-neutral-200 p-2">
                    <h1 className="font-semibold">Hello, World!</h1>
                    <p>This is a sidebar.</p>
                </div> */}

            </div>
        </TldrawProvider>
    );
}

export default Home;