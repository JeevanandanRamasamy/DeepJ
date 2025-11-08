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
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white">
      {/* CAMERA */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* slight darken */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60" />

      {/* TOP-LEFT */}
      <div className="absolute top-4 left-4 bg-black/35 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 min-w-[210px]">
        <p className="text-[10px] uppercase tracking-wide text-white/50 flex items-center gap-2">
          <span className="text-base">🎵</span> song name
        </p>
        <p className="text-lg font-semibold leading-tight">
          {currentTrack ? currentTrack.name : "AI picked track"}
        </p>
        <p className="text-[11px] text-white/50 mt-1">
          {currentTrack?.artist || "AI DJ"}
        </p>
      </div>

      {/* TOP-RIGHT */}
      <div className="absolute top-4 right-4 bg-black/25 backdrop-blur-sm border border-dashed border-white/25 rounded-2xl px-4 py-3 min-w-[170px] text-right">
        <p className="text-[10px] text-white/45 mb-1">Next up:</p>
        <p className="text-sm font-medium leading-tight">
          {nextTrack ? nextTrack.name : "TBD"}
        </p>
        <p className="text-[10px] text-white/35">{nextTrack?.artist || "AI DJ"}</p>
      </div>

      {/* BOTTOM BAR */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl bg-black/35 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-2.5 flex items-center gap-4">
        {/* volume */}
        <div className="flex items-center gap-2 w-[130px]">
          <span className="text-lg">🔊</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full">
            <div className="w-1/2 h-1 bg-white rounded-full" />
          </div>
        </div>

        {/* progress */}
        <div className="flex-1 h-[1px] bg-white/10 rounded-full relative">
          <div className="absolute left-0 top-0 h-[1px] w-1/3 bg-white/70 rounded-full" />
        </div>

        {/* buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/25 text-[10px]"
          >
            Back
          </button>
          <button
            onClick={toggleSession}
            className={`w-10 h-10 rounded-full ${
              isSessionActive ? "bg-white text-black" : "bg-white/80 text-black"
            } border border-white/50 text-[10px] font-semibold hover:scale-105 transition`}
          >
            {isSessionActive ? "Pause" : "Play"}
          </button>
          <button
            onClick={goNext}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/25 text-[10px]"
          >
            Next
          </button>
        </div>

        {/* cam / ai */}
        <div className="ml-auto">
          {cameraOn ? (
            <button
              onClick={stopCamera}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/25 text-[10px]"
            >
              Cam
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/25 text-[10px]"
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
