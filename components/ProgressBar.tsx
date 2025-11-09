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
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  const updateGradient = (value: number) => {
  if (sliderRef.current) {
    sliderRef.current.style.background = `linear-gradient(to right,
      rgba(255,79,110,1) 0%,
      rgba(255,79,110,0.85) ${value / 2}%,
      rgba(255,79,110,0.7) ${value}%,
      rgba(255,255,255,0.08) ${value}%)`;
  }
};


  // Update progress from props (but not while user is dragging)
  useEffect(() => {
    if (!isDragging && duration > 0) {
      const newProgress = Math.min(100, Math.max(0, (currentTime / duration) * 100));
      setProgress(newProgress);
      updateGradient(newProgress);
    }
  }, [currentTime, duration, isDragging]);

  useEffect(() => {
    updateGradient(progress);
  }, [progress]);

  // Handle mouse up outside the slider
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (onSeek && sliderRef.current) {
          const value = parseInt(sliderRef.current.value);
          const newTime = (value / 100) * duration;
          onSeek(newTime);
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, duration, onSeek]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setProgress(value);
    updateGradient(value);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setIsDragging(false);
    if (onSeek) {
      const value = parseInt((e.target as HTMLInputElement).value);
      const newTime = (value / 100) * duration;
      onSeek(newTime);
    }
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLInputElement>) => {
    setIsDragging(false);
    if (onSeek) {
      const value = parseInt((e.target as HTMLInputElement).value);
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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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