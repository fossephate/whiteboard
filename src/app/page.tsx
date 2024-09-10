'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const LandingPage = () => {
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedRoomCode = localStorage.getItem('roomCode');
    if (savedRoomCode) {
      setRoomCode(savedRoomCode);
    }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (roomCode) {
      localStorage.setItem("roomCode", roomCode);
      router.push(`/${roomCode}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomCode(e.target.value.toLowerCase());
  };

  // this is some bs because next doesn't respect the base path for manifest files and it can't be overriden:
  useEffect(() => {
    // Check if the document is loaded and if it's on the client
    if (typeof document !== 'undefined') {
      // Create the manifest link tag
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/board/manifest.webmanifest';
      manifestLink.crossOrigin = 'use-credentials';
      // Prepend the manifest link to the head
      document.head.prepend(manifestLink);
    }
  }, []);


  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl mb-8">Choose a Room Code</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <input
          type="text"
          value={roomCode}
          onChange={handleChange}
          placeholder="Room Code"
          className="p-2 mb-4 border border-gray-300 rounded"
          required
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Join Room
        </button>
      </form>
    </div>
  );
};

export default LandingPage;
