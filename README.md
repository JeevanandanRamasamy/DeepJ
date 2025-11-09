# 🎧 DeepJ - AI-Powered DJ

An intelligent DJ application that reads the room's energy through your camera and microphone, then curates the perfect musical vibe in real-time using Google's Gemini AI.

## 🎯 Motivation & Purpose

**DeepJ** bridges the gap between human intuition and AI-powered music curation. Traditional music apps require manual selection, while DeepJ:

- **Reads the Room**: Uses computer vision and audio analysis to detect mood and energy levels
- **Adapts in Real-Time**: Continuously adjusts music selection based on the environment
- **Two Music Modes**: Choose between pre-recorded tracks or AI-generated live music
- **Perfect for Any Setting**: Parties, study sessions, work environments, or chill hangouts

The project demonstrates the power of multimodal AI by combining video, audio, and generative music APIs to create an autonomous DJ experience.

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- A modern web browser with camera/microphone permissions
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DeepJ.git
cd DeepJ

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

1. Create a `.env` file:
```env
GEMINI_API_KEY=your_api_key_here
```

2. Update `services/geminiService.ts` and `components/DJInterface.tsx` to use:
```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

---

## 🏗️ Architecture Overview

### High-Level Flow

```
User Camera/Mic → Gemini Live API → Mood Detection → Music Selection
                                          ↓
                    Track Queue ← Genre Selection ← Song Database
                                          ↓
                    LiveMusicHelper → Lyria API → AI-Generated Music
```

### Core Components

#### 1. **Frontend Layer** (`App.tsx`, `components/`)

- **App.tsx**: Main app orchestrator with three screens (intro, DJ interface, end)
- **DJInterface.tsx**: Primary UI component managing playback, camera feed, and user controls
- **EndSession.tsx**: Session completion screen with restart option

#### 2. **AI Integration Layer** (`services/geminiService.ts`)

**Two-Stage Mood Detection Pipeline**:

- **Stage 1 - Live API**: Real-time video/audio analysis for mood detection
  - Uses `gemini-2.5-flash-native-audio-preview` model
  - Streams camera feed and microphone input
  - Calls `reportMood` function when confident (>70%)
  - Detects: `chilling`, `focusing`, `partying`, `happy`, `sad`

- **Stage 2 - Standard API**: Genre selection based on detected mood
  - Uses `gemini-2.5-flash` model for text generation
  - Maps mood + energy level to appropriate genres
  - Throttled to once per 30 seconds to prevent spam

**Reconnection Logic**: Automatic session recovery with exponential backoff

#### 3. **Live Music Generation** (`lib/LiveMusicHelper.ts`)

Manages Google's **Lyria Realtime API** for AI-generated music:

- **Prompt-Based Generation**: Weighted prompts control musical style
- **Adaptive Playback**: Adjusts in real-time based on mood changes
- **Audio Stream Management**: Buffers and plays generated audio chunks
- **Event System**: Emits playback state changes and errors

#### 4. **Music Queue System** (`components/DJInterface.tsx`)

**Doubly Linked List Implementation**:
- Bidirectional navigation (prev/next)
- Cursor-based current track tracking
- Dynamic enqueuing of AI-suggested tracks

#### 5. **Type System** (`types.ts`)

```typescript
MusicSuggestion: mood, energyLevel, trackFilename
Prompt: promptId, text, weight, color, cc (control code)
PlaybackState: stopped | playing | loading | paused
```

---

## 🎵 Music Modes

### 1. Track Playback Mode (Default)

- Uses pre-recorded MP3 files from music database
- AI selects tracks from 10 genres: rock, pop, rap, indie pop, classical, country, jazz, indie rock, metal, electronic
- Managed through queue system with skip forward/backward

### 2. Live AI Music Mode

- Real-time music generation via Lyria API
- Mood-based prompt sets:
  - **Chilling**: Chillwave, Bossa Nova, Lush Strings, Neo Soul
  - **Focusing**: Sparkling Arpeggios, Chillwave, Trip Hop
  - **Partying**: Drum and Bass, Dubstep, K-Pop, Punchy Kick
  - **Happy**: Funk, K-Pop, Chiptune, Neo Soul
  - **Sad**: Shoegaze, Post Punk, Trip Hop, Lush Strings

- Dynamic weight adjustment based on energy level
- Seamless transitions between moods

---

## 📁 Project Structure

```
DeepJ/
├── components/
│   ├── DJInterface.tsx      # Main DJ interface
│   ├── EndSession.tsx        # End screen
│   ├── VolumeControl.tsx     # Volume slider
│   └── ProgressBar.tsx       # Playback progress
├── services/
│   └── geminiService.ts      # Gemini AI integration
├── lib/
│   ├── LiveMusicHelper.ts    # Lyria API wrapper
│   ├── throttle.ts           # Rate limiting utility
│   └── audio.ts              # Audio processing utilities
├── types.ts                  # TypeScript definitions
├── music/
│   └── music_data.json       # Song database
├── App.tsx                   # Main app component
└── index.html                # Entry point
```

---

## 🔧 Technical Details

### APIs Used

1. **Gemini Live API** (`v1alpha`)
   - Model: `gemini-2.5-flash-native-audio-preview-09-2025`
   - Purpose: Real-time mood detection from video/audio

2. **Gemini Standard API** (`v1`)
   - Model: `gemini-2.5-flash`
   - Purpose: Genre selection via function calling

3. **Lyria Realtime API** (`v1alpha`)
   - Model: `lyria-realtime-exp`
   - Purpose: AI music generation

### Performance Optimizations

- **Throttling**: Song selection limited to once per 30 seconds
- **Audio Buffering**: 2-second buffer for smooth playback
- **Video Sampling**: 1 frame per second for mood analysis
- **Reconnection Strategy**: Max 5 attempts with 2-second delays

---

## 🎨 UI Features

- **Real-time camera feed** as background
- **Mood visualization** with energy level indicator
- **Active prompt display** showing AI music parameters
- **Smooth transitions** between tracks and modes
- **Responsive controls** for play/pause, skip, volume
- **Status indicators** for AI connection and playback state

---

## 🐛 Known Limitations

- Music database requires manual curation
- Live music mode requires stable internet connection
- Camera permissions required for mood detection
- Browser compatibility: Chrome/Edge recommended

---

## 🔮 Future Improvements

- [ ] Secure API key management
- [ ] User-configurable prompt sets
- [ ] Music taste learning over time
- [ ] Multi-room support
- [ ] Spotify/Apple Music integration
- [ ] Guest mood voting system
- [ ] Analytics dashboard

---

## 📄 License

MIT License - feel free to use and modify for your own projects!

---

## 🙏 Acknowledgments

- **Google Gemini AI** for multimodal analysis
- **Lyria API** for music generation
- **Tailwind CSS** for styling
- **Framer Motion** for animations