// import React from 'react';
// import DJInterface from './components/DJInterface';

// const App: React.FC = () => {
//   return (
//     <div className="min-h-screen bg-gray-900 text-white font-sans">
//       <DJInterface />
//     </div>
//   );
// };

// export default App;

// const App: React.FC = () => {
//   return (
//     <div className="h-screen w-screen overflow-hidden bg-black">
//       <DJInterface />
//     </div>
//   );
// };

// export default App;

import React, { useState } from "react";
import DJInterface from "./components/DJInterface";
import EndScreen from "./components/EndSession";
import djBg from "./assets/dj-image.jpg"

const App: React.FC = () => {
  const [screen, setScreen] = useState<"intro" | "dj" | "end">("intro");

  return (
    <>
      {screen === "intro" && (
        <IntroScreen onEnter={() => setScreen("dj")} bgImage={djBg} />
      )}

      {screen === "dj" && (
        <DJInterface onEndSession={() => setScreen("end")} />
      )}

      {screen === "end" && (
        <EndScreen onRestart={() => setScreen("intro")} />
      )}
    </>
  );
};

export default App;

const IntroScreen: React.FC<{ onEnter: () => void; bgImage: string }> = ({
  onEnter,
  bgImage,
}) => {
  return (
    <div
      className="w-screen h-screen text-white relative overflow-hidden bg-black"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* dark + color wash over the photo so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#05040e]/75 via-[#0a0820]/65 to-[#11152e]/80" />

      {/* glowing light effects */}
      <div className="pointer-events-none absolute -top-32 -left-20 w-96 h-96 bg-fuchsia-600/30 blur-[140px] rounded-full"></div>
      <div className="pointer-events-none absolute bottom-0 right-0 w-[26rem] h-[26rem] bg-cyan-500/25 blur-[130px] rounded-full"></div>
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-[22rem] h-[22rem] bg-indigo-500/15 blur-[120px] rounded-full"></div>

      {/* fake ground gradient */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

      {/* main content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-rose-500 to-purple-400 text-transparent bg-clip-text">
          DeepJ
        </h1>
        <p className="text-sm md:text-base text-white/80 max-w-lg mb-8 leading-relaxed">
          Welcome to <span className="text-rose-400 font-semibold">DeepJ </span>
          an AI-powered DJ that reads the room’s energy through your camera and
          curates the perfect vibe. Perfect for parties, study jams, or chill sessions.
        </p>
        <button
          onClick={onEnter}
          className="bg-rose-500 hover:bg-rose-400 text-white px-8 py-3 rounded-full text-base font-semibold shadow-[0_6px_25px_rgba(244,63,94,0.5)] transition-transform hover:scale-105"
        >
          Enter DJ Mode
        </button>
      </div>
    </div>
  );
};

