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
      <audio hidden ref={audioRef} src={src} controls />
      <button hidden onClick={handlePlay}>Play</button>
      <button hidden onClick={handlePause}>Pause</button>
    </div>
  );
};

export default MyAudioPlayer;