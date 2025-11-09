import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { connectToGemini, GeminiSession } from "@/services/geminiService";
import { MusicSuggestion, Prompt, PlaybackState } from "@/types";
import VolumeControl from "./VolumeControl";
import VideoProgressBar from "./ProgressBar";
import { LiveMusicHelper } from "@/lib/LiveMusicHelper";
import MyAudioPlayer from "./audioPlayer";
import { GoogleGenAI, LiveMusicFilteredPrompt } from "@google/genai";
import { get } from "http";
import musicData from '@/music/music_data.json';

const DJInterface: React.FC<{ onEndSession: () => void }> = ({ onEndSession }) => {
  const [status, setStatus] = useState("ready");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [useLiveMusic, setUseLiveMusic] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [currentTrack, setCurrentTrack] = useState<{ name: string; artist?: string } | null>({
    name: "Uplifted Crowd",
    artist: "AI DJ",
  });
  const [nextTrack, setNextTrack] = useState<{ name: string; artist?: string } | null>({
    name: "LoFi Study Mix",
    artist: "AI DJ",
  });
  const [cameraOn, setCameraOn] = useState(false);
  const [detectedMood, setDetectedMood] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [activePrompts, setActivePrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Set<string>>(new Set());

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const geminiSessionRef = useRef<GeminiSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const goNextRef = useRef<(() => void) | null>(null);
  const shouldAutoPlayAfterSrcChange = useRef<boolean>(false);
  const liveMusicHelperRef = useRef<LiveMusicHelper | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Mood-based prompts mapping
  const MOOD_PROMPTS: Record<string, Prompt[]> = {
    chilling: [
      { promptId: "chill-1", text: "Chillwave", weight: 1, color: "#5200ff" },
      { promptId: "chill-2", text: "Bossa Nova", weight: 0.8, color: "#9900ff" },
      { promptId: "chill-3", text: "Lush Strings", weight: 0.6, color: "#3dffab" },
      { promptId: "chill-4", text: "Neo Soul", weight: 0.5, color: "#d8ff3e" },
    ],
    focusing: [
      { promptId: "focus-1", text: "Sparkling Arpeggios", weight: 1, color: "#d8ff3e" },
      { promptId: "focus-2", text: "Chillwave", weight: 0.7, color: "#5200ff" },
      { promptId: "focus-3", text: "Trip Hop", weight: 0.6, color: "#5200ff" },
      { promptId: "focus-4", text: "Lush Strings", weight: 0.5, color: "#3dffab" },
    ],
    partying: [
      { promptId: "party-1", text: "Drum and Bass", weight: 1, color: "#ff25f6" },
      { promptId: "party-2", text: "Dubstep", weight: 0.9, color: "#ffdd28" },
      { promptId: "party-3", text: "K Pop", weight: 0.8, color: "#ff25f6" },
      { promptId: "party-4", text: "Punchy Kick", weight: 0.7, color: "#3dffab" },
    ],
    happy: [
      { promptId: "happy-1", text: "Funk", weight: 1, color: "#2af6de" },
      { promptId: "happy-2", text: "K Pop", weight: 0.8, color: "#ff25f6" },
      { promptId: "happy-3", text: "Chiptune", weight: 0.7, color: "#9900ff" },
      { promptId: "happy-4", text: "Neo Soul", weight: 0.6, color: "#d8ff3e" },
    ],
    sad: [
      { promptId: "sad-1", text: "Shoegaze", weight: 1, color: "#ffdd28" },
      { promptId: "sad-2", text: "Post Punk", weight: 0.8, color: "#2af6de" },
      { promptId: "sad-3", text: "Trip Hop", weight: 0.6, color: "#5200ff" },
      { promptId: "sad-4", text: "Lush Strings", weight: 0.5, color: "#3dffab" },
    ],
  };

  // Doubly linked list based queue implementation
  class Node<T> {
    value: T;
    prev: Node<T> | null = null;
    next: Node<T> | null = null;
    constructor(value: T) {
      this.value = value;
    }
  }

  class DoublyLinkedQueue<T> {
    head: Node<T> | null = null;
    tail: Node<T> | null = null;
    cursor: Node<T> | null = null; // current play position
    length = 0;

    enqueue(value: T) {
      const node = new Node(value);
      if (!this.tail) {
        this.head = this.tail = node;
      } else {
        this.tail.next = node;
        node.prev = this.tail;
        this.tail = node;
      }
      if (!this.cursor) this.cursor = this.head;
      this.length++;
      return node;
    }

    dequeue(): T | null {
      if (!this.head) return null;
      const node = this.head;
      this.head = node.next;
      if (this.head) this.head.prev = null;
      else this.tail = null;
      if (this.cursor === node) this.cursor = this.head;
      node.next = node.prev = null;
      this.length--;
      return node.value;
    }

    peekCurrent(): T | null {
      return this.cursor ? this.cursor.value : null;
    }

    peekNext(): T | null {
      return this.cursor && this.cursor.next ? this.cursor.next.value : null;
    }

    peekPrev(): T | null {
      return this.cursor && this.cursor.prev ? this.cursor.prev.value : null;
    }

    getNext(): T | null {
      if (!this.cursor) return null;
      if (this.cursor.next) {
        this.cursor = this.cursor.next;
        return this.cursor.value;
      }
      return null;
    }

    getPrev(): T | null {
      if (!this.cursor) return null;
      if (this.cursor.prev) {
        this.cursor = this.cursor.prev;
        return this.cursor.value;
      }
      return null;
    }

    toArray(): T[] {
      const out: T[] = [];
      let n = this.head;
      while (n) {
        out.push(n.value);
        n = n.next;
      }
      return out;
    }

    clear() {
      this.head = this.tail = this.cursor = null;
      this.length = 0;
    }

    isEmpty() {
      return this.length === 0;
    }
  }

  // functions to handle the music playing on the button and the html listener
  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    // Automatically go to next track when current one ends
    if (goNextRef.current) {
      goNextRef.current();
    }
  };

  // Handle audio source changes and auto-play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onCanPlay = () => {
      if (shouldAutoPlayAfterSrcChange.current) {
        audio.play().then(() => {
          setIsSessionActive(true);
          setStatus("playing • next track");
          shouldAutoPlayAfterSrcChange.current = false;
        }).catch(err => {
          console.error("Auto-play failed:", err);
          shouldAutoPlayAfterSrcChange.current = false;
        });
      }
    };

    audio.addEventListener('canplay', onCanPlay);
    return () => {
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [audioSrc]);

  // initial tracklist to seed the queue
  const baseURL = "https://storage.googleapis.com/run-sources-deepj-477603-us-central1/songs/";
  //const initialTracks = ["pop/Golden.mp3", "pop/Opalite.mp3"];
  const queueRef = useRef<DoublyLinkedQueue<string>>(new DoublyLinkedQueue());

  // Initialize everything on mount - queue, camera, and LiveMusicHelper
  useEffect(() => {
    // 1. Populate queue
    const q = queueRef.current;
    if (q.isEmpty()) {
      const genre = "pop";
      const song1 = getRandomSongFromGenre(genre, "");
      q.enqueue(song1);
      const song2 = getRandomSongFromGenre(genre, song1.split("/")[1].replace(".mp3", ""));
      q.enqueue(song2);
      setAudioSrc(baseURL + song1);
    }
    //initialTracks.forEach((t) => q.enqueue(t));
    // TODO: with base of golden, could choose 2 songs randomly to queue after that
    // 2. Set initial UI from queue
    const cur = q.peekCurrent();
    const nxt = q.peekNext();
    if (cur) {
      setCurrentTrack(getSongDataForCard(cur));
    }
    if (nxt) {
      setNextTrack(getSongDataForCard(nxt));
    }

    // 3. Initialize LiveMusicHelper
    const apiKey = "AIzaSyCHBCsfQfN009fzUATYWuEw0rW_cBli2LI"; // WE KNOW THIS IS CURSED BUT IT'S A DEMO
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
    } else {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey,
          apiVersion: 'v1alpha'
        });
        const liveMusicHelper = new LiveMusicHelper(ai, 'lyria-realtime-exp');
        liveMusicHelperRef.current = liveMusicHelper;

        // Set up event listeners for LiveMusicHelper
        liveMusicHelper.addEventListener('playback-state-changed', ((e: Event) => {
          const customEvent = e as CustomEvent<PlaybackState>;
          setPlaybackState(customEvent.detail);

          // Update status based on playback state
          const stateMessages: Record<PlaybackState, string> = {
            playing: 'live AI music playing',
            loading: 'generating music...',
            paused: 'paused',
            stopped: 'stopped'
          };
          if (useLiveMusic) {
            setStatus(stateMessages[customEvent.detail]);
          }
        }) as EventListener);

        liveMusicHelper.addEventListener('filtered-prompt', ((e: Event) => {
          const customEvent = e as CustomEvent<LiveMusicFilteredPrompt>;
          const filteredPrompt = customEvent.detail;
          setFilteredPrompts(prev => new Set([...prev, filteredPrompt.text!]));
          setStatus(`⚠️ Prompt filtered: ${filteredPrompt.filteredReason}`);
        }) as EventListener);

        liveMusicHelper.addEventListener('error', ((e: Event) => {
          const customEvent = e as CustomEvent<string>;
          setStatus(`Error: ${customEvent.detail}`);
          console.error('LiveMusicHelper error:', customEvent.detail);
        }) as EventListener);

        // Initialize with default prompts
        const defaultPrompts = MOOD_PROMPTS.chilling;
        const promptsMap = new Map<string, Prompt>();
        defaultPrompts.forEach(p => promptsMap.set(p.promptId, p));
        liveMusicHelper.setWeightedPrompts(promptsMap);
        setActivePrompts(defaultPrompts);

      } catch (error) {
        console.error('Failed to initialize LiveMusicHelper:', error);
        setStatus('Failed to initialize AI music system');
      }
    }

    // 4. Start camera
    startCamera();

    // Cleanup function
    return () => {
      geminiSessionRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      liveMusicHelperRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSuggestion = (suggestion: MusicSuggestion) => {
    console.log("[DJInterface] 📥 Received suggestion:", suggestion);
    console.log("[DJInterface] 🔍 State check - useLiveMusic:", useLiveMusic, "liveMusicHelperRef.current:", !!liveMusicHelperRef.current);

    setDetectedMood(suggestion.mood);
    setEnergyLevel(suggestion.energyLevel);
    const trackName = suggestion.trackFilename.replace(".mp3", "").replace(/_/g, " ");

    // Update LiveMusicHelper prompts based on detected mood/genre
    // Do this regardless of whether live music is currently active, so prompts are ready when user switches
    if (liveMusicHelperRef.current) {
      console.log("[DJInterface] ✅ Updating LiveMusicHelper prompts");

      // Use mood-based prompts
      console.log(`[DJInterface] 🎭 Using mood-based prompts for: ${suggestion.mood}`);
      const selectedPrompts = MOOD_PROMPTS[suggestion.mood] || MOOD_PROMPTS.chilling;

      console.log(`[DJInterface] 🎼 Selected prompts:`, selectedPrompts.map(p => p.text));

      // Adjust weights based on energy level
      const adjustedPrompts = selectedPrompts.map((p, idx) => ({
        ...p,
        weight: Math.max(0, Math.min(1, (suggestion.energyLevel / 10) * (1 - idx * 0.15)))
      }));

      console.log(`[DJInterface] ⚖️ Adjusted weights:`, adjustedPrompts.map(p => `${p.text}: ${p.weight.toFixed(2)}`));

      const promptsMap = new Map<string, Prompt>();
      adjustedPrompts.forEach(p => promptsMap.set(p.promptId, p));

      console.log(`[DJInterface] 🔄 Calling setWeightedPrompts with ${adjustedPrompts.length} prompts`);
      liveMusicHelperRef.current.setWeightedPrompts(promptsMap);
      setActivePrompts(adjustedPrompts.filter(p => p.weight > 0));

      // Only update UI if live music is active
      if (useLiveMusic) {
        console.log("[DJInterface] 🎵 Live music mode active, updating UI");
        setCurrentTrack({
          name: `Live AI - ${suggestion.mood}`,
          artist: `Energy: ${suggestion.energyLevel}/10`
        });
        setStatus(`AI music adapting to ${suggestion.mood} mood`);
      } else {
        console.log("[DJInterface] ℹ️ Prompts updated but live music not active yet");
      }

      console.log(`[DJInterface] ✅ Prompts updated successfully`);
    } else {
      console.log("[DJInterface] ⚠️ LiveMusicHelper not initialized yet");
    }

    // Continue with regular queue logic if not in live music mode
    if (!useLiveMusic) {
      console.log("[DJInterface] ℹ️ Not in live music mode, using regular queue logic");

      // Original track queue logic for non-live music mode
      queueRef.current.enqueue(suggestion.trackFilename);

      // update nextTrack UI based on queue's next item
      const nextFilename = queueRef.current.peekNext() ?? suggestion.trackFilename;
      setNextTrack(getSongDataForCard(nextFilename));

      // if (isSessionActive) {
      //   // simulate transition to suggested track after small delay
      //   setTimeout(() => {
      //     const next = queueRef.current.getNext() ?? suggestion.trackFilename;
      //     setCurrentTrack(getSongDataForCard(next));
      //     setStatus(`playing • ${suggestion.mood} mood detected`);
      //     // update nextTrack preview
      //     const upcoming = queueRef.current.peekNext();
      //     setNextTrack(
      //       upcoming
      //         ? { name: upcoming.replace(".mp3", "").replace(/_/g, " "), artist: "AI DJ" }
      //         : null
      //     );
      //   }, 1000);
      // } else {
      //   setStatus(`suggestion ready • ${suggestion.mood} detected`);
      // }
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setStatus("camera on • connecting to AI...");
      // pass current queue snapshot to the service
      const session = await connectToGemini(stream, queueRef.current.toArray(), handleSuggestion);
      geminiSessionRef.current = session;
      setStatus("AI active • analyzing room mood");
    } catch (error) {
      console.error(error);
      if ((error as any).name === "NotAllowedError") {
        setStatus("Camera/microphone access denied. Please enable permissions.");
      } else {
        setStatus("Could not start camera: " + (error as any).message);
      }
    }
  };

  const stopCamera = () => {
    geminiSessionRef.current?.close();
    geminiSessionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setStatus("camera off • AI disconnected");
    setDetectedMood(null);
    setEnergyLevel(null);
  };

  const toggleSession = () => {
    if (useLiveMusic && liveMusicHelperRef.current) {
      liveMusicHelperRef.current.playPause();
      // Sync isSessionActive with live music playback state
      setIsSessionActive(playbackState !== 'playing');
      return;
    }

    // Regular audio playback
    if (!isSessionActive) {
      setIsSessionActive(true);
      handlePlay();
      setStatus("playing • mood-based selection");
    } else {
      setIsSessionActive(false);
      handlePause();
      setStatus("paused");
    }
  };

  const toggleLiveMusicMode = () => {
    // Stop current playback when switching modes
    if (isSessionActive || playbackState === 'playing') {
      if (useLiveMusic && liveMusicHelperRef.current) {
        liveMusicHelperRef.current.stop();
      } else {
        handlePause();
      }
      setIsSessionActive(false);
    }

    setUseLiveMusic(!useLiveMusic);
    setStatus(!useLiveMusic ? "Live AI music mode enabled" : "Track playback mode enabled");
  };

  const getSongDataForCard = (filename: string) => {
    if (filename === null) return {
      songName: "TBD",
      artistName: "AI DJ",
    };

    const genre = filename.split("/")[0];
    const songName = filename.split("/")[1].replace(".mp3", "").replace(/_/g, " ");
    const genreSongList = musicData[genre];
    const foundSong = genreSongList.find(song => song.name === songName);
    const artistName = foundSong ? foundSong.artist : "Author not found";

    //const artistName = musicData[genre]?.[songName]?.author || "Author not found";
    console.log("Fetched song data:", { songName, artistName });
    console.log("Used Song Genre:", genre);
    return {
      name: songName,
      artist: artistName,
    };
  }

  const getRandomSongFromGenre = (genre: string, exclude: string) => {
    const genreSongList = musicData[genre];
    if (!genreSongList || genreSongList.length === 0) {
      console.warn(`No songs found for genre: ${genre}`);
      return null;
    }
    while (true) {
      const randomIndex = Math.floor(Math.random() * genreSongList.length);
      const song = genreSongList[randomIndex];
      if (song.name !== exclude) {
        return `${genre}/${song.name}.mp3`;
      }
    }
  };

  const goNext = () => {
    // Remember if we were playing before changing tracks
    const wasPlaying = isSessionActive;

    if (isSessionActive) {
      // Pause current track before switching
      handlePause();
    }

    const next = queueRef.current.getNext();
    if (next) {
      setCurrentTrack(getSongDataForCard(next));
      setStatus(wasPlaying ? "loading next track..." : "next track");
      const upcoming = queueRef.current.peekNext();

      if (upcoming) {
        setNextTrack(getSongDataForCard(upcoming));
      } else {
        // If no upcoming track, try to enqueue a new one from same genre
        const genre = next.split("/")[0];
        const currentSongName = next.split("/")[1].replace(".mp3", "");
        const newSong = getRandomSongFromGenre(genre, currentSongName);
        if (newSong) {
          queueRef.current.enqueue(newSong);
          console.log(`[DJInterface] Enqueued new track from genre '${genre}': ${newSong}`);
          setNextTrack(getSongDataForCard(newSong));
        } else {
          console.warn(`[DJInterface] Could not find new track to enqueue from genre: ${genre}`);
          setNextTrack(getSongDataForCard(null));
        }
      }
      //setNextTrack(upcoming ? getSongDataForCard(upcoming) : getSongDataForCard(null));

      // Set auto-play flag if we were playing
      shouldAutoPlayAfterSrcChange.current = wasPlaying;

      // ACTUALLY SWITCH TO THE NEXT TRACK
      setAudioSrc(baseURL + next);

    } else {
      // TODO: ADD TO QUEUE FROM SAME GENRE AS LAST ONE
      setStatus("end of queue");
      // If no next track, stop playback
      if (isSessionActive) {
        setIsSessionActive(false);
        setStatus("end of queue • paused");
      }
      return;
    }

  };

  // Store goNext in ref so it can be called from event handlers
  goNextRef.current = goNext;

  const goPrev = () => {
    // Remember if we were playing before changing tracks
    const wasPlaying = isSessionActive;

    if (isSessionActive) {
      // Pause current track before switching
      handlePause();
    }

    const prev = queueRef.current.getPrev();
    if (prev) {
      setCurrentTrack(getSongDataForCard(prev));
      const upcoming = queueRef.current.peekNext();
      setNextTrack(upcoming ? getSongDataForCard(upcoming) : getSongDataForCard(null));
      setStatus(wasPlaying ? "loading previous track..." : "previous track");

      // actually switch to this track
      shouldAutoPlayAfterSrcChange.current = wasPlaying;
      setAudioSrc(baseURL + prev);

    } else {
      // Just restart the current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        if (wasPlaying) {
          audioRef.current.play();
        }
      }
      setStatus("start of queue");
      // If at start of queue, stop playback
      // if (isSessionActive) {
      //   setIsSessionActive(false);
      //   setStatus("start of queue • paused");
      // }
      return;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#060b16] text-white overflow-hidden">
      {/* CAMERA */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* slight darken */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060b16]/50 via-[#060b16]/20 to-[#060b16]" />

      {/* TOP-LEFT */}
      <div className="absolute top-4 left-4 bg-[#0d1422]/95 border border-white/5 rounded-3xl px-6 py-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] w-64">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/40 mb-2 flex items-center gap-2">
          <span className="text-base">{useLiveMusic ? "🎼" : "🎵"}</span>
          {useLiveMusic ? "ai live music" : "now playing"}
        </p>
        <p className="text-2xl font-semibold leading-tight">
          {currentTrack ? currentTrack.name : "AI picked track"}
        </p>
        <p className="text-[11px] text-white/50 mt-2">
          {currentTrack?.artist || "AI DJ"}
        </p>
        {useLiveMusic && (
          <div className="mt-3 text-[9px] text-cyan-400/70">
            Model: Lyria Realtime
          </div>
        )}
        {/* tiny visualizer just for looks */}
        <div className="flex gap-1 mt-5 h-6 items-end">
          {[5, 10, 6, 14, 9, 12, 8].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-gradient-to-t from-rose-500/70 to-rose-300/0"
              style={{
                height: `${h * 1.6}px`,
                animation: (useLiveMusic && playbackState === 'playing') ? 'pulse 0.5s ease-in-out infinite' : 'none'
              }}
            />
          ))}
        </div>
      </div>

      {/* TOP-RIGHT */}
      <div className="absolute top-4 right-4 bg-[#0d1422]/95 border border-white/5 rounded-3xl px-6 py-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] w-64 text-right">
        <p className="text-[10px] text-white/40 mb-2 uppercase tracking-[0.35em]">
          Next up
        </p>
        <p className="text-sm font-semibold leading-tight">
          {nextTrack ? nextTrack.name : "TBD"}
        </p>
        <p className="text-[10px] text-white/35 mt-1">{nextTrack?.artist || "AI DJ"}</p>
        <p className="text-xs text-purple-300/80 uppercase mb-1">Detected Mood</p>
        <p className="text-lg font-bold capitalize">{detectedMood}</p>
        <p className="text-[11px] text-purple-200/80 mt-1 text-right">{energyLevel}/10</p>
      </div>
      {/* TOP-RIGHT */}


      {/* LIVE MUSIC PROMPTS - Show when live music is active */}
      {useLiveMusic && activePrompts.length > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#0d1422]/90 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.3)] max-w-2xl">
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/40 mb-2 text-center">
            🎼 Active AI Prompts
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            {activePrompts.map((prompt) => (
              <div
                key={prompt.promptId}
                className="px-3 py-1 rounded-full text-[10px] font-medium backdrop-blur-sm border border-white/20"
                style={{
                  backgroundColor: `${prompt.color}20`,
                  borderColor: prompt.color,
                  color: prompt.color,
                  opacity: filteredPrompts.has(prompt.text) ? 0.3 : 1,
                }}
              >
                {prompt.text} • {Math.round(prompt.weight * 100)}%
                {filteredPrompts.has(prompt.text) && " ⚠️"}
              </div>
            ))}
          </div>
          <p className="text-[8px] text-white/30 mt-2 text-center">
            {playbackState === 'loading' && '⏳ Generating...'}
            {playbackState === 'playing' && '▶️ Streaming'}
            {playbackState === 'paused' && '⏸️ Paused'}
            {playbackState === 'stopped' && '⏹️ Stopped'}
          </p>
        </div>
      )}

      {/* BOTTOM BAR */}
      {/* BOTTOM BAR */}
      <motion.div
        className="absolute bottom-4 inset-x-0 flex justify-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-[72%] max-w-4xl bg-[#06080e]/95 border border-white/5 rounded-[26px] px-5 py-3 flex items-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          {/* LEFT: volume */}
          {/* <div className="flex items-center gap-3 min-w-[160px]">
      <div className="w-32">
        <VolumeControl />
      </div>
    </div> */}

          {/* MIDDLE: progress (your real progress component) */}
          <div className="flex-1">
            <VideoProgressBar
              duration={duration || 180}
              currentTime={currentTime}
              onSeek={handleSeek}
            />
          </div>

          {/* RIGHT: controls */}
          <div className="flex items-center gap-3">
            {/* hidden audio element */}
            <audio
              hidden
              ref={audioRef}
              src={audioSrc}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
            />

            {/* prev – always show */}
            <button
              onClick={goPrev}
              className="w-10 h-10 rounded-full border border-white/10 bg-black/10 text-white/80 flex items-center justify-center hover:border-white/40 transition"
            >
              ‹
            </button>

            {/* play / pause with glow */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-14 h-14 rounded-full bg-[#ff4f6e]/55 blur-lg opacity-80 pointer-events-none" />
              <button
                onClick={toggleSession}
                className="relative w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,79,110,0.5)] hover:scale-105 transition"
              >
                {((useLiveMusic && playbackState === "playing") || (!useLiveMusic && isSessionActive)) ? (
                  <span className="flex gap-1">
                    <span className="w-1.5 h-4 bg-black rounded-sm" />
                    <span className="w-1.5 h-4 bg-black rounded-sm" />
                  </span>
                ) : (
                  <span className="w-0 h-0 border-l-[15px] border-l-black border-y-[8px] border-y-transparent ml-[2px]" />
                )}
              </button>
            </div>

            {/* next – always show */}
            <button
              onClick={goNext}
              className="w-10 h-10 rounded-full border border-white/10 bg-black/10 text-white/80 flex items-center justify-center hover:border-white/40 transition"
            >
              ›
            </button>

            {/* Tracks / Live toggle – AFTER prev/play/next */}
            <motion.button
              onClick={toggleLiveMusicMode}
              whileTap={{ scale: 0.9 }}
              className={`px-3 py-1.5 rounded-full text-[10px] font-semibold backdrop-blur-md transition-all ${useLiveMusic
                ? "bg-gradient-to-r from-cyan-400/80 to-blue-500/80 text-white border border-cyan-300/50"
                : "bg-white/10 hover:bg-white/20 text-white/70 border border-white/20"
                }`}
            >
              {useLiveMusic ? "🎼 Live AI" : "💿 Tracks"}
            </motion.button>

            {/* cam toggle */}
            {/* {cameraOn ? (
    <button
      onClick={stopCamera}
      className="h-10 px-4 rounded-2xl border border-red-200/30 bg-red-500/15 text-red-100 text-sm hover:bg-red-500/25 transition"
    >
      Cam on
    </button>
  ) : (
    <button
      onClick={startCamera}
      className="h-10 px-4 rounded-2xl border border-green-200/30 bg-green-500/15 text-green-100 text-sm hover:bg-green-500/25 transition"
    >
      Cam
    </button>
  )} */}

            {/* End Session */}
            <button
              onClick={() => {
                stopCamera();
                setIsSessionActive(false);
                onEndSession?.(); // if you're passing it from App
              }}
              className="h-10 px-5 rounded-2xl border border-white/10 bg-[#ff4f6e]/20 text-[#ff4f6e] text-sm hover:bg-[#ff4f6e]/30 transition"
            >
              End Session
            </button>
          </div>

        </div>
      </motion.div>

      {/* STATUS */}
      <div className="absolute bottom-2 left-5 text-[11px] text-white/50">{status}</div>
    </div>
  );
};

export default DJInterface;

/*
Hardware banned section 
    {
            "name": "Wi$h Li$t",
            "artist": "Taylor Swift",
            "album": "The Life of a Showgirl",
            "popularity": 93,
            "id": "2TEQvxxQabwLQMqWMg1qGu",
            "uri": "spotify:track:2TEQvxxQabwLQMqWMg1qGu"
        },
*/