
import React from 'react';
import { SpotifyIcon } from './Icons';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 tracking-tight">AI DJ</h1>
        <p className="text-lg md:text-xl text-green-400">Your personal AI-powered party maestro.</p>
        <p className="text-gray-400 mt-4 max-w-lg mx-auto">
          Analyzes the room's vibe through your camera and mic to curate the perfect Spotify playlist in real-time.
        </p>
      </div>
      <button
        onClick={onLogin}
        className="flex items-center justify-center gap-3 px-8 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
      >
        <SpotifyIcon className="w-6 h-6" />
        Login with Spotify
      </button>
       <p className="text-gray-500 text-xs mt-4">A Spotify Premium account is required.</p>
    </div>
  );
};

export default Login;
