import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { connectToGemini, GeminiSession } from "@/services/geminiService";
import { MusicSuggestion } from "@/types";
import VolumeControl from "./VolumeControl";
import VideoProgressBar from "./ProgressBar";
import MyAudioPlayer from "./audioPlayer";

const DJInterface: React.FC = () => {
  const [status, setStatus] = useState("ready");
  const [isSessionActive, setIsSessionActive] = useState(false);
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const geminiSessionRef = useRef<GeminiSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const goNextRef = useRef<(() => void) | null>(null);
  const shouldAutoPlayAfterSrcChange = useRef<boolean>(false);
  const [audioSrc, setAudioSrc] = useState<string>("https://storage.googleapis.com/run-sources-deepj-477603-us-central1/songs/pop/Golden.mp3");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

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

  // Sync audio progress with React state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset progress when source changes
    setCurrentTime(0);
    setDuration(0);

    // Update duration when metadata loads
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    // Update current time as audio plays
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // Handle when audio ends
    const handleEnded = () => {
      setCurrentTime(0);
      // Auto-advance to next track when song ends
      if (goNextRef.current) {
        goNextRef.current();
      }
    };

    // Handle when audio can play (ready to play)
    const handleCanPlay = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      // Auto-play if flag is set (e.g., when advancing to next track)
      if (shouldAutoPlayAfterSrcChange.current) {
        shouldAutoPlayAfterSrcChange.current = false;
        audio.play()
          .then(() => {
            setIsSessionActive(true);
            setStatus("playing • mood-based selection");
          })
          .catch((error) => {
            console.error("Error auto-playing audio:", error);
          });
      }
    };

    // Handle when audio data is loaded (another opportunity to auto-play)
    const handleLoadedData = () => {
      if (shouldAutoPlayAfterSrcChange.current && audio.readyState >= 2) {
        shouldAutoPlayAfterSrcChange.current = false;
        audio.play()
          .then(() => {
            setIsSessionActive(true);
            setStatus("playing • mood-based selection");
          })
          .catch((error) => {
            console.error("Error auto-playing audio:", error);
          });
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    // Try to auto-play immediately if audio is already ready
    if (shouldAutoPlayAfterSrcChange.current && audio.readyState >= 2) {
      setTimeout(() => {
        if (shouldAutoPlayAfterSrcChange.current && audio.readyState >= 2) {
          shouldAutoPlayAfterSrcChange.current = false;
          audio.play()
            .then(() => {
              setIsSessionActive(true);
              setStatus("playing • mood-based selection");
            })
            .catch((error) => {
              console.error("Error auto-playing audio:", error);
            });
        }
      }, 50);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioSrc]);

  // Handle seeking from progress bar
  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };


  // initial tracklist to seed the queue
  const initialTracks = ["chill_vibes.mp3", "focus_mode.mp3", "party_starter.mp3", "happy.mp3"];

  const queueRef = useRef<DoublyLinkedQueue<string>>(new DoublyLinkedQueue());

  // populate queue on mount
  useEffect(() => {
    const q = queueRef.current;
    initialTracks.forEach((t) => q.enqueue(t));
    // set initial UI from queue
    const cur = q.peekCurrent();
    const nxt = q.peekNext();
    if (cur) {
      setCurrentTrack({
        name: cur.replace(".mp3", "").replace(/_/g, " "),
        artist: "AI DJ",
      });
    }
    if (nxt) {
      setNextTrack({
        name: nxt.replace(".mp3", "").replace(/_/g, " "),
        artist: "AI DJ",
      });
    }

    startCamera();
    return () => {
      geminiSessionRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSuggestion = (suggestion: MusicSuggestion) => {
    setDetectedMood(suggestion.mood);
    setEnergyLevel(suggestion.energyLevel);
    const trackName = suggestion.trackFilename.replace(".mp3", "").replace(/_/g, " ");

    // enqueue suggested track to the tail of the queue
    queueRef.current.enqueue(suggestion.trackFilename);

    // update nextTrack UI based on queue's next item
    const nextFilename = queueRef.current.peekNext() ?? suggestion.trackFilename;
    setNextTrack({
      name: nextFilename.replace(".mp3", "").replace(/_/g, " "),
      artist: `${suggestion.mood} • Energy: ${suggestion.energyLevel}/10`,
    });

    if (isSessionActive) {
      // simulate transition to suggested track after small delay
      setTimeout(() => {
        const next = queueRef.current.getNext() ?? suggestion.trackFilename;
        setCurrentTrack({
          name: next.replace(".mp3", "").replace(/_/g, " "),
          artist: `${suggestion.mood} • Energy: ${suggestion.energyLevel}/10`,
        });
        setStatus(`playing • ${suggestion.mood} mood detected`);
        // update nextTrack preview
        const upcoming = queueRef.current.peekNext();
        setNextTrack(
          upcoming
            ? { name: upcoming.replace(".mp3", "").replace(/_/g, " "), artist: "AI DJ" }
            : null
        );
      }, 1000);
    } else {
      setStatus(`suggestion ready • ${suggestion.mood} detected`);
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

  const goNext = () => {
    // Remember if we were playing before changing tracks
    const wasPlaying = isSessionActive;
    
    if (isSessionActive) {
      // Pause current track before switching
      handlePause();
    }
    
    const next = queueRef.current.getNext();
    if (next) {
      setCurrentTrack({
        name: next.replace(".mp3", "").replace(/_/g, " "),
        artist: "AI DJ",
      });
      const upcoming = queueRef.current.peekNext();
      setNextTrack(upcoming ? { name: upcoming.replace(".mp3", "").replace(/_/g, " "), artist: "AI DJ" } : null);
      setStatus(wasPlaying ? "loading next track..." : "next track");
    } else {
      setStatus("end of queue");
      // If no next track, stop playback
      if (isSessionActive) {
        setIsSessionActive(false);
        setStatus("end of queue • paused");
      }
      return;
    }

    // Set auto-play flag if we were playing
    shouldAutoPlayAfterSrcChange.current = wasPlaying;
    setAudioSrc("https://storage.googleapis.com/run-sources-deepj-477603-us-central1/songs/pop/Soda Pop.mp3");
  };
  
  // Store goNext in ref so it can be called from event handlers
  goNextRef.current = goNext;

  const goPrev = () => {
    if (isSessionActive) {
      toggleSession();
    }

    const prev = queueRef.current.getPrev();
    if (prev) {
      setCurrentTrack({
        name: prev.replace(".mp3", "").replace(/_/g, " "),
        artist: "AI DJ",
      });
      const upcoming = queueRef.current.peekNext();
      setStatus("start of queue");
    }
    setAudioSrc("https://storage.googleapis.com/run-sources-deepj-477603-us-central1/songs/pop/Golden.mp3");
    toggleSession();
  };

  useEffect(() => {
    startCamera();
  }, []);

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
          <span className="text-base">🎵</span> now playing
        </p>
        <p className="text-2xl font-semibold leading-tight">
          {currentTrack ? currentTrack.name : "AI picked track"}
        </p>
        <p className="text-[11px] text-white/50 mt-2">
          {currentTrack?.artist || "AI DJ"}
        </p>
        {/* tiny visualizer just for looks */}
        <div className="flex gap-1 mt-5 h-6 items-end">
          {[5, 10, 6, 14, 9, 12, 8].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-gradient-to-t from-rose-500/70 to-rose-300/0"
              style={{ height: `${h * 1.6}px` }}
            />
          ))}
        </div>
      </div>

      {/* TOP-RIGHT */}
      <div className="absolute top-4 right-4 bg-[#0d1422]/80 backdrop-blur-sm border border-dashed border-white/10 rounded-3xl px-5 py-4 min-w-[170px] text-right shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <p className="text-[10px] text-white/45 mb-1 uppercase tracking-[0.25em]">
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

      {/* BOTTOM BAR */}
      <motion.div
        className="absolute bottom-5 left-0 right-0 mx-auto w-[92%] max-w-5xl rounded-3xl bg-white/5 backdrop-blur-xl shadow-[0_4px_40px_rgba(255,255,255,0.05)] px-6 py-3 flex items-center gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* volume */}
        <VolumeControl />

        {/* wavy progress */}
        <VideoProgressBar duration={duration || 180} currentTime={currentTime} onSeek={handleSeek} />

        {/* Controls */}
        <div className="flex items-center gap-4">
          {<motion.button>
            {/* <MyAudioPlayer src={"https://storage.googleapis.com/run-sources-deepj-477603-us-central1/songs/pop/Golden.mp3"} /> */}
            <audio hidden ref={audioRef} src={audioSrc} controls />
          </motion.button>}

          <motion.button
            onClick={goPrev}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-xs backdrop-blur-md"
          >
            ⏮
          </motion.button>
          <motion.button
            onClick={toggleSession}
            whileTap={{ scale: 0.9 }}
            className={`w-11 h-11 rounded-full ${isSessionActive
              ? "bg-gradient-to-r from-pink-400 to-purple-500 text-white"
              : "bg-white/90 text-black"
              } font-semibold shadow-lg hover:shadow-xl transition-transform`}
          >
            {isSessionActive ? "⏸" : "▶"}
          </motion.button>
          <motion.button
            onClick={goNext}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-xs backdrop-blur-md"
          >
            ⏭
          </motion.button>
        </div>

        {/* Camera / AI */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="ml-auto"
        >
          {cameraOn ? (
            <button
              onClick={stopCamera}
              className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-500/70 to-pink-600/70 text-white text-xs shadow-md hover:shadow-lg"
            >
              Cam
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-400/70 to-teal-500/70 text-white text-xs shadow-md hover:shadow-lg"
            >
              AI
            </button>
          )}
        </motion.div>
      </motion.div>

      {/* STATUS */}
      <div className="absolute bottom-2 left-5 text-[11px] text-white/50">{status}</div>
    </div>
  );
};

export default DJInterface;
