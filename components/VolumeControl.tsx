import { motion } from "framer-motion";
import React, { useRef, useState } from "react";

const VolumeControl: React.FC = () => {
  const sliderRef = useRef<HTMLInputElement>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  const updateSliderGradient = (value: number) => {
    if (sliderRef.current) {
      sliderRef.current.style.background = `linear-gradient(to right, rgb(129,140,248) 0%, rgb(192,132,252) ${
        value / 2
      }%, rgb(244,114,182) ${value}%, rgba(255,255,255,0.1) ${value}%)`;
    }
  };

  const toggleMute = () => {
    if (!sliderRef.current) return;
    if (!isMuted && volume > 0) {
      setIsMuted(true);
      sliderRef.current.dataset.previousValue = volume.toString();
      setVolume(0);
      updateSliderGradient(0);
    } else {
      setIsMuted(false);
      const previousValue = sliderRef.current.dataset.previousValue
        ? parseInt(sliderRef.current.dataset.previousValue)
        : 50;
      setVolume(previousValue);
      updateSliderGradient(previousValue);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setVolume(value);
    setIsMuted(value === 0);
    updateSliderGradient(value);
  };

  return (
    <div className="flex items-center gap-3 w-[160px]">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMute}
        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md flex items-center justify-center transition-colors"
      >
        <span className="text-xl">{isMuted ? "🔇" : "🔊"}</span>
      </motion.button>

      <div className="flex-1 relative group">
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
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
          style={{
            background:
              "linear-gradient(to right, rgb(129,140,248) 0%, rgb(192,132,252) 25%, rgb(244,114,182) 50%, rgba(255,255,255,0.1) 50%)",
          }}
        />
      </div>
    </div>
  );
};

export default VolumeControl;