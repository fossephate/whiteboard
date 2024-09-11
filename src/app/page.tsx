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
