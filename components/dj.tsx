import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { connectToGemini, GeminiSession } from "@/services/geminiService";
import { MusicSuggestion } from "@/types";
import VolumeControl from "./VolumeControl";
import VideoProgressBar from "./ProgressBar";
import MyAudioPlayer from "./audioPlayer";
interface DJInterfaceProps {
  onEndSession: () => void;
}

const DJInterface: React.FC<DJInterfaceProps> = ({ onEndSession }) => {

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
      setStatus("start of queue");
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
<div className="absolute top-4 right-4 bg-[#0d1422]/95 border border-white/5 rounded-3xl px-6 py-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] w-64 text-right">
  <p className="text-[10px] text-white/40 mb-2 uppercase tracking-[0.35em]">
    Next up
  </p>
  <p className="text-sm font-semibold leading-tight">
    {nextTrack ? nextTrack.name : "TBD"}
  </p>
  <p className="text-[11px] text-white/50 mt-1">
    {nextTrack?.artist || "AI DJ"}
  </p>

  <p className="text-[10px] text-purple-200/80 uppercase mt-4">Detected mood</p>
  <p className="text-lg font-bold capitalize">{detectedMood}</p>
  {energyLevel !== null && (
    <p className="text-[11px] text-purple-200/80 mt-1 text-right">
      {energyLevel}/10
    </p>
  )}
</div>

      {/* BOTTOM BAR */}
<motion.div
  className="absolute bottom-4 inset-x-0 flex justify-center"
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
>
  <div className="w-[72%] max-w-4xl bg-[#06080e]/95 border border-white/5 rounded-[26px] px-5 py-3 flex items-center justify-between gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
    {/* LEFT: volume (only your component, no extra icon) */}
    <div className="flex items-center gap-3 min-w-[160px]">
      <div className="w-32">
        <VolumeControl />
      </div>
    </div>

    {/* MIDDLE: progress */}
    <div className="flex-1 h-2 rounded-full bg-[#22252d] overflow-hidden">
      <div className="h-full w-2/3 bg-[#ff4f6e] rounded-full" />
    </div>

    {/* RIGHT: controls */}
    <div className="flex items-center gap-3">
      {/* prev */}
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
          {isSessionActive ? (
            // pause icon built with 2 bars so it stays black
            <span className="flex gap-1">
              <span className="w-1.5 h-5 bg-black rounded-sm" />
              <span className="w-1 h-5 bg-black rounded-sm" />
            </span>
          ) : (
            <span className="text-black text-lg leading-none">▶</span>
          )}
        </button>
      </div>

      {/* next */}
      <button
        onClick={goNext}
        className="w-10 h-10 rounded-full border border-white/10 bg-black/10 text-white/80 flex items-center justify-center hover:border-white/40 transition"
      >
        ›
      </button>

      {/* cam toggle */}
      {cameraOn ? (
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
      )}
        {/* End Session – 👇 THIS is the one that was hidden */}
      <button
        onClick={() => {
          stopCamera();
          setIsSessionActive(false);
          onEndSession();
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
