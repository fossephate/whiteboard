'use client'
import dynamic from 'next/dynamic'


import { FC, lazy, useEffect, useRef } from 'react'
import { Editor } from '../../components/editor';
import { Controls } from '../../components/controls'
import { Panel } from '../../components/panel'
import { useKeyboardShortcuts } from '../../hooks'
import useFullscreenStatus from '../../utils/useFullscreenStatus'
import { app } from '../../state/state';

const RealPage = dynamic(() => import('./RealPage'), {
    ssr: false,
});

interface pageProps {
    params: {
        roomCode: string;
    };
}

// const Page: FC<pageProps> = ({ params }) => {
//     const { roomCode } = params;
//     // const roomCode = 'test';
//     useKeyboardShortcuts();

//     const maximizableElement = useRef(null);
//     const [isFullscreen, setFullscreen] = useFullscreenStatus(maximizableElement);

//     useEffect(() => {
//         app.setRoomCode(roomCode);
//     }, [roomCode]);

//     return (
//         <div ref={maximizableElement} className='w-screen pt-12 bg-white flex flex-col justify-center items-center gap-10'>
//             <Editor />
//             <Controls />
//             <Panel isFullscreen={isFullscreen} setFullscreen={setFullscreen} />
//         </div>
//     )
// }


const Page: FC<pageProps> = ({ params }) => {
    const { roomCode } = params;

    return (
        <RealPage roomCode={roomCode} />
    )
}



// const SomePage = () => {
//     return (
//         <div>Only renders in the browser</div>
//     );
// }
// export default 

export default Page;
// export default Page;
// export default withNoSSR(lazy(() => import('./actual'));
