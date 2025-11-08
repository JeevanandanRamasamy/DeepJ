import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MusicSuggestion } from '../types';
import { connectToGemini, GeminiSession } from '../services/geminiService';
import { CameraIcon, MicIcon, PowerIcon, RobotIcon, FolderMusicIcon, MusicNoteIcon } from './Icons';

// FIX: Add type definitions for File System Access API to avoid TypeScript errors.
declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemHandle {
    kind: 'file' | 'directory';
    name: string;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    kind: 'file';
    getFile(): Promise<File>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    kind: 'directory';
    values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
  }
}

// Type guard to check if the browser supports the File System Access API
const supportsFileSystemAccessAPI = 'showDirectoryPicker' in window;

const DJInterface: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('Welcome! Please select your music folder to begin.');
  const [currentTrack, setCurrentTrack] = useState<File | null>(null);
  const [mediaPermissions, setMediaPermissions] = useState({ video: false, audio: false });
  const [musicLibrary, setMusicLibrary] = useState<File[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const geminiSessionRef = useRef<GeminiSession | null>(null);

  const handleSuggestion = useCallback(async (suggestion: MusicSuggestion) => {
    setStatus(`Vibe detected: ${suggestion.mood}. Selecting a track...`);
    const trackToPlay = musicLibrary.find(file => file.name === suggestion.trackFilename);

    if (trackToPlay) {
        setCurrentTrack(trackToPlay);
        setStatus(`Now playing: ${trackToPlay.name}`);
    } else {
        console.warn(`AI suggested a track not in the library: ${suggestion.trackFilename}`);
        setStatus(`Couldn't find suggested track. Waiting for next analysis.`);
    }
  }, [musicLibrary]);
  
  useEffect(() => {
      if (currentTrack && audioRef.current) {
          const trackUrl = URL.createObjectURL(currentTrack);
          audioRef.current.src = trackUrl;
          audioRef.current.play().catch(e => console.error("Audio playback failed:", e));

          // Cleanup object URL on component unmount or when track changes
          return () => {
              URL.revokeObjectURL(trackUrl);
          };
      }
  }, [currentTrack]);

  const handleSelectFolder = async () => {
      if (!supportsFileSystemAccessAPI) {
          alert("Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge.");
          return;
      }
      try {
          const dirHandle = await window.showDirectoryPicker();
          const mp3Files: File[] = [];
          for await (const entry of dirHandle.values()) {
              if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.mp3')) {
                  const file = await entry.getFile();
                  mp3Files.push(file);
              }
          }
          if (mp3Files.length === 0) {
              setStatus("No MP3 files found in the selected folder. Please try another one.");
              setMusicLibrary([]);
          } else {
              setMusicLibrary(mp3Files);
              setStatus(`Loaded ${mp3Files.length} tracks. Ready to start the AI DJ session!`);
          }
      } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            // User cancelled the picker
            console.log("Folder picker was cancelled by the user.");
          } else {
            console.error("Error selecting folder:", err);
            setStatus("Failed to read the folder. Please try again.");
          }
      }
  };


  const startSession = async () => {
    if (musicLibrary.length === 0) {
        alert("Please select a music folder before starting the session.");
        return;
    }
    if (!process.env.API_KEY) {
        alert("Gemini API Key is not configured. Please set the API_KEY environment variable.");
        return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaPermissions({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setStatus('Connecting to AI...');
      const tracklist = musicLibrary.map(file => file.name);
      const session = await connectToGemini(stream, tracklist, handleSuggestion);
      geminiSessionRef.current = session;
      setIsSessionActive(true);
      setStatus("AI DJ is live! Analyzing the room's vibe...");
      
    } catch (err) {
      console.error("Error starting session:", err);
      let errorMessage = "Failed to start session. Please check your camera/mic permissions and try again.";
      if (err instanceof DOMException) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
              errorMessage = "Camera and microphone access was denied. Please allow access in your browser settings to use the AI DJ.";
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
              errorMessage = "No camera or microphone found. Please connect a device and try again.";
          }
      }
      setStatus(errorMessage);
      setMediaPermissions({ video: false, audio: false });
    }
  };

  const stopSession = () => {
    if (geminiSessionRef.current) {
      geminiSessionRef.current.close();
      geminiSessionRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
    }
    setIsSessionActive(false);
    setStatus('Session ended. Select a folder or start again!');
    setCurrentTrack(null);
    setMediaPermissions({ video: false, audio: false });
  };

  const handleToggleSession = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
            <RobotIcon className="w-8 h-8 text-red-400" />
            <h1 className="text-2xl font-bold">AI DJ (Local Edition)</h1>
        </div>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls & Status */}
        <div className="lg:col-span-1 bg-gray-800 rounded-xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <h2 className="text-xl font-semibold mb-4">Controls</h2>
            <div className="space-y-3">
                <button
                    onClick={handleSelectFolder}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 font-bold rounded-lg transition-all duration-300 text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
                    disabled={isSessionActive}
                >
                    <FolderMusicIcon className="w-6 h-6" />
                    <span>Select Music Folder</span>
                </button>

                <button
                onClick={handleToggleSession}
                className={`w-full flex items-center justify-center gap-3 py-4 px-6 font-bold rounded-lg transition-all duration-300 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSessionActive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={musicLibrary.length === 0}
                >
                <PowerIcon className="w-6 h-6" />
                <span>{isSessionActive ? 'Stop AI DJ Session' : 'Start AI DJ Session'}</span>
                </button>
            </div>
            
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">Status Feed</h3>
              <p className="text-gray-300 bg-gray-700/50 p-3 rounded-md h-24 overflow-y-auto">{status}</p>

              <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                 <div className={`flex items-center gap-2 p-2 rounded-md ${musicLibrary.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    <FolderMusicIcon className="w-5 h-5"/> {musicLibrary.length > 0 ? `${musicLibrary.length} Tracks` : "No Library"}
                </div>
                 <div className={`flex items-center gap-2 p-2 rounded-md ${currentTrack ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    <MusicNoteIcon className="w-5 h-5"/> {currentTrack ? "Playing" : "Idle"}
                </div>
                <div className={`flex items-center gap-2 p-2 rounded-md ${mediaPermissions.video ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    <CameraIcon className="w-5 h-5"/> {mediaPermissions.video ? "Camera On" : "Camera Off"}
                </div>
                <div className={`flex items-center gap-2 p-2 rounded-md ${mediaPermissions.audio ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    <MicIcon className="w-5 h-5"/> {mediaPermissions.audio ? "Mic On" : "Mic Off"}
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-4">Note: Your camera and mic data are streamed to Google for analysis and are not stored. Your music never leaves your computer.</div>
        </div>

        {/* Center Column: Video Feed */}
        <div className="lg:col-span-1 bg-black rounded-xl flex items-center justify-center overflow-hidden shadow-lg aspect-w-16 aspect-h-9 relative">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>
          {!videoRef.current?.srcObject && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-center p-4">
                <CameraIcon className="w-16 h-16 text-gray-600 mb-4"/>
                <p className="text-gray-400 font-semibold text-lg">AI DJ is Ready</p>
                <p className="text-gray-500 mt-2">
                    {musicLibrary.length === 0 ? "First, select your music folder." : 'Click "Start AI DJ Session" to begin.'}
                </p>
            </div>
          )}
        </div>

        {/* Right Column: Music Info */}
        <div className="lg:col-span-1 bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
          {currentTrack ? (
            <div className='w-full'>
              <MusicNoteIcon className="w-24 h-24 text-red-500 mb-4 mx-auto" />
              <h2 className="text-xl font-bold mb-2">Now Playing</h2>
              <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md break-words">
                {currentTrack.name}
              </p>
              <audio ref={audioRef} controls className="w-full mt-4"></audio>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500">
                <MusicNoteIcon className="w-16 h-16 mb-4"/>
                <p>Your music player will appear here.</p>
                <p className="text-sm mt-2">
                    {isSessionActive ? "Waiting for the first vibe analysis..." : (musicLibrary.length === 0 ? "Select a folder to get started." : "Start the session to begin.")}
                </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};


export default DJInterface;