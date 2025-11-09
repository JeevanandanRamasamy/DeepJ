import React, { useRef } from 'react';

const MyAudioPlayer = ({ src }) => {
  const audioRef = useRef(null);

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

const changeSource = (newSrc: string) => {
    if (audioRef.current) {
        // pause current playback, swap the source and reload the element
        audioRef.current.pause();
        audioRef.current.src = newSrc;
        audioRef.current.load();
    }
};

  return (
    <div>
      <audio ref={audioRef} src={src} controls />
      <button onClick={handlePlay}>Play</button>
      <button onClick={handlePause}>Pause</button>
    </div>
  );
};

export default MyAudioPlayer;