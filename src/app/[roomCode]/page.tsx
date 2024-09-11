'use client'
import Whiteboard from "../components/Whiteboard";
import { TldrawProvider } from "@/app/providers/tldraw-context";
import { FC, lazy, useEffect, useRef, useState } from 'react';
import { Panel } from '../components/panel';
import useFullscreenStatus from '../../utils/useFullscreenStatus';
import { useRouter } from 'next/navigation';

interface pageProps {
    params: {
        roomCode: string;
    };
}

const isIos = () => {
    return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
};

const isInStandaloneMode = () => {
    return window.matchMedia('(display-mode: standalone)').matches;
};


const Home: FC<PageProps> = ({ params }) => {
    const { roomCode } = params;

    const maximizableElement = useRef(null);
    const [isFullscreen, setFullscreen] = useFullscreenStatus(maximizableElement);

    const router = useRouter();

    const [isInstalled, setIsInstalled] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isIosDevice, setIsIosDevice] = useState(false);

    useEffect(() => {

    }, []);

    useEffect(() => {
        const lowercaseRoomCode = roomCode.toLowerCase();
        if (roomCode !== lowercaseRoomCode) {
            router.replace(`/${lowercaseRoomCode}`);
        }
        localStorage.setItem("roomCode", roomCode);
    }, [roomCode, router]);


    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {

        if (typeof window !== 'undefined') {
            setIsInstalled(isInStandaloneMode());
            setIsIosDevice(isIos());
        }

        if (localStorage.getItem("bannerDismissed") == null) {
            if (!isInStandaloneMode && !isIosDevice) {
                setShowInstallBanner(true);
            }
        }

        const handleBeforeInstallPrompt = (event: any) => {
            // Prevent the default behavior to allow us to show the prompt later
            event.preventDefault();
            setInstallPrompt(event); // Save the event to state so it can be triggered later
            setShowInstallBanner(true); // Show the install banner
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        }
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) {
            return;
        }
        const result = await installPrompt.prompt();
        console.log(`Install prompt was: ${result.outcome}`);
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        localStorage.setItem("bannerDismissed", "true");
    };

    return (
        <TldrawProvider>
            {/* <div ref={maximizableElement} className="fixed overflow-hidden inset-0 flex flex-row h-full w-full flex-col sm:flex-row"> */}
            {/* <div className="h-12 bg-blue-500 text-white flex items-center justify-between px-4 py-2">
                        <span>Install as an app for convienient access!</span>
                        <div>
                            <button
                                className="bg-white text-blue-500 font-semibold py-1 px-3 rounded"
                                onClick={handleInstall}
                            >
                                Install
                            </button>
                            <button className="bg-blue-500 text-white font-semibold py-1 px-3 rounded border border-white"
                                onClick={handleDismiss}>
                                Dismiss
                            </button>
                        </div>
                    </div> */}

            {/* <Whiteboard roomCode={roomCode}>
                    <Panel isFullscreen={isFullscreen} setFullscreen={setFullscreen} />
                </Whiteboard>
                {isInstalled && (
                    <div className="h-12 bg-gray-800"></div>
                )} */}

            {/* </div> */}
            <div ref={maximizableElement} className="fixed overflow-hidden inset-0 flex h-full w-full flex-col">
                {!isInstalled && showInstallBanner && <div className="flex items-center max-md:flex-col gap-6 bg-gradient-to-tr from-blue-700 to-purple-400 text-white px-6 py-3.5 font-[sans-serif]">
                    <p className="text-base flex-1 max-md:text-center">Install as an app for convienient access!</p>
                    <div>
                        <button type="button" className="bg-white text-blue-500 py-1 px-5 rounded text-sm" onClick={handleInstall}>
                            Install
                        </button>
                        <button type="button" onClick={handleDismiss}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 cursor-pointer fill-white inline-block ml-4" viewBox="0 0 320.591 320.591">
                                <path d="M30.391 318.583a30.37 30.37 0 0 1-21.56-7.288c-11.774-11.844-11.774-30.973 0-42.817L266.643 10.665c12.246-11.459 31.462-10.822 42.921 1.424 10.362 11.074 10.966 28.095 1.414 39.875L51.647 311.295a30.366 30.366 0 0 1-21.256 7.288z" data-original="#000000" />
                                <path d="M287.9 318.583a30.37 30.37 0 0 1-21.257-8.806L8.83 51.963C-2.078 39.225-.595 20.055 12.143 9.146c11.369-9.736 28.136-9.736 39.504 0l259.331 257.813c12.243 11.462 12.876 30.679 1.414 42.922-.456.487-.927.958-1.414 1.414a30.368 30.368 0 0 1-23.078 7.288z" data-original="#000000" />
                            </svg>
                        </button>
                    </div>
                </div>}
                <Whiteboard roomCode={roomCode}>
                    <Panel isFullscreen={isFullscreen} setFullscreen={setFullscreen} />
                </Whiteboard>
                {isInstalled && (
                    <div className="h-12 bg-[#282828]"></div>
                )}

            </div>
        </TldrawProvider>
    );
}

export default Home;