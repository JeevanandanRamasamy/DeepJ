import React, { useRef, useState, useEffect } from "react";

interface VideoProgressBarProps {
  duration?: number; // total duration in seconds
  currentTime?: number; // current playback position
  onSeek?: (newTime: number) => void; // optional callback
}

const VideoProgressBar: React.FC<VideoProgressBarProps> = ({
  duration = 180,
  currentTime = 45,
  onSeek,
}) => {
  const [progress, setProgress] = useState((currentTime / duration) * 100);
  const sliderRef = useRef<HTMLInputElement>(null);

  const updateGradient = (value: number) => {
    if (sliderRef.current) {
      sliderRef.current.style.background = `linear-gradient(to right,
        rgb(129,140,248) 0%,
        rgb(192,132,252) ${value / 2}%,
        rgb(244,114,182) ${value}%,
        rgba(255,255,255,0.1) ${value}%)`;
    }
  };

  useEffect(() => {
    updateGradient(progress);
  }, [progress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setProgress(value);
    updateGradient(value);
    if (onSeek) {
      const newTime = (value / 100) * duration;
      onSeek(newTime);
    }
  };

  return (
    <div className="w-[70%] relative group">
      <input
        ref={sliderRef}
        type="range"
        min="0"
        max="100"
        value={progress}
        onChange={handleChange}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.3)]
          [&::-webkit-slider-thumb]:cursor-pointer
          hover:[&::-webkit-slider-thumb]:scale-110
          [&::-webkit-slider-thumb]:transition-transform
          [&::-moz-range-thumb]:w-3.5
          [&::-moz-range-thumb]:h-3.5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-white
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.3)]
          [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
};

export default VideoProgressBar;