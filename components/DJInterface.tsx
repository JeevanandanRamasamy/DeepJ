import React, { useEffect, useRef, useState } from "react";

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

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      setStatus("camera on • ai can read the room");
    } catch (err) {
      console.error(err);
      setStatus("could not start camera");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    setStatus("camera off");
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
    if (nextTrack) {
      setCurrentTrack(nextTrack);
      setNextTrack({ name: "Crowd Hype", artist: "AI DJ" });
      setStatus("next track");
    }
  };

  const goPrev = () => {
    setStatus("previous track (demo)");
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
      </div>

      {/* BOTTOM BAR */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl bg-[#04070d]/85 backdrop-blur-md border border-white/5 rounded-2xl px-5 py-2.5 flex items-center gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
        {/* volume */}
        <div className="flex items-center gap-2 w-[135px]">
          <span className="text-lg">🔊</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-rose-500 rounded-full" />
          </div>
        </div>

        {/* progress */}
        <div className="flex-1 h-1 bg-white/8 rounded-full relative">
          <div className="absolute left-0 top-0 h-full w-1/3 bg-rose-500 rounded-full" />
        </div>

        {/* buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className="w-9 h-9 rounded-full bg-white/0 hover:bg-white/5 border border-white/15 text-[11px] text-white/80 transition"
          >
            ‹
          </button>
          <button
            onClick={toggleSession}
            className={`w-11 h-11 rounded-full ${
              isSessionActive
                ? "bg-rose-500 text-white"
                : "bg-white/90 text-black"
            } border border-white/40 text-[11px] font-semibold shadow-[0_6px_20px_rgba(244,63,94,0.5)] transition hover:scale-105`}
          >
            {isSessionActive ? "Pause" : "Play"}
          </button>
          <button
            onClick={goNext}
            className="w-9 h-9 rounded-full bg-white/0 hover:bg-white/5 border border-white/15 text-[11px] text-white/80 transition"
          >
            ›
          </button>
        </div>

        {/* cam / ai */}
        <div className="ml-auto">
          {cameraOn ? (
            <button
              onClick={stopCamera}
              className="w-8 h-8 rounded-lg bg-white/0 border border-white/15 text-[10px] text-white/90 hover:bg-white/5 transition"
            >
              Cam
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="w-8 h-8 rounded-lg bg-white/0 border border-white/15 text-[10px] text-white/90 hover:bg-white/5 transition"
            >
              AI
            </button>
          )}
        </div>
      </div>

      {/* status */}
      <div className="absolute bottom-1 left-4 text-[10px] text-white/40">
        {status}
      </div>
    </div>
  );
};

export default DJInterface;
