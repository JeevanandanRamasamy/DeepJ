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
      setStatus("could not start camera");
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
      setStatus("playing • mood-based selection");
    } else {
      setIsSessionActive(false);
      setStatus("paused");
    }
  };

  const goNext = () => {
    const next = queueRef.current.getNext();
    if (next) {
      setCurrentTrack({
        name: next.replace(".mp3", "").replace(/_/g, " "),
        artist: "AI DJ",
      });
      const upcoming = queueRef.current.peekNext();
      setNextTrack(upcoming ? { name: upcoming.replace(".mp3", "").replace(/_/g, " "), artist: "AI DJ" } : null);
      setStatus("next track");
    } else {
      setStatus("end of queue");
    }
  };

  const goPrev = () => {
    const prev = queueRef.current.getPrev();
    if (prev) {
      setCurrentTrack({
        name: prev.replace(".mp3", "").replace(/_/g, " "),
        artist: "AI DJ",
      });
      const upcoming = queueRef.current.peekNext();
      setNextTrack(upcoming ? { name: upcoming.replace(".mp3", "").replace(/_/g, " "), artist: "AI DJ" } : null);
      setStatus("previous track");
    } else {
      setStatus("start of queue");
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a] text-white">
      {/* CAMERA */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover brightness-75"
      />

      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/80" />

      {/* TOP-LEFT NOW PLAYING */}
      <motion.div
        className="absolute top-5 left-5 rounded-3xl bg-white/5 backdrop-blur-lg px-5 py-4 shadow-[0_4px_30px_rgba(255,255,255,0.05)]"
        whileHover={{ scale: 1.03 }}
      >
        <p className="text-xs text-white/60 flex items-center gap-1">🎵 Now Playing</p>
        <p className="text-xl font-semibold leading-tight mt-1">{currentTrack?.name}</p>
        <p className="text-sm text-white/50">{currentTrack?.artist}</p>
      </motion.div>

      {/* TOP-RIGHT MOOD */}
      <div className="absolute top-5 right-5 space-y-3">
        {detectedMood && energyLevel !== null && (
          <motion.div
            className="rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-xl px-5 py-4 shadow-lg"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-xs text-purple-300/80 uppercase mb-1">Detected Mood</p>
            <p className="text-lg font-bold capitalize">{detectedMood}</p>

            {/* M3 wavy progress bar */}
            <div className="relative h-3 mt-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-400 opacity-30"
                animate={{
                  x: ["0%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>
            <p className="text-[11px] text-purple-200/80 mt-1 text-right">{energyLevel}/10</p>
          </motion.div>
        )}

        {/* NEXT UP */}
        <motion.div
          className="rounded-3xl bg-white/5 backdrop-blur-lg px-5 py-4 shadow-[0_4px_20px_rgba(255,255,255,0.05)] text-right"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs text-white/45 mb-1">Next up</p>
          <p className="text-sm font-medium leading-tight">{nextTrack?.name || "TBD"}</p>
          <p className="text-[11px] text-white/35">{nextTrack?.artist || "AI DJ"}</p>
        </motion.div>
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
        <VideoProgressBar duration={180} currentTime={0} onSeek={(time) => console.log(time)} />

        {/* Controls */}
        <div className="flex items-center gap-4">
          <motion.button>
            <MyAudioPlayer src={"https://storage.googleapis.com/run-sources-deepj-477603-us-central1/songs/pop/Golden.mp3"} />
          </motion.button>
          
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