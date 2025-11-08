# DeepJ - Quick Start Guide

Get started with DeepJ in 5 minutes!

## Prerequisites

- Python 3.8 or higher
- Webcam or camera
- Audio output (speakers/headphones)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/JeevanandanRamasamy/DeepJ.git
cd DeepJ
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

**Note**: First run will download AI models (may take a few minutes)

### 3. Set Up Music Directory
```bash
python setup.py
```

This creates the following structure:
```
music/
├── energetic/    (for upbeat, happy music)
├── calm/         (for relaxing, peaceful music)
├── melancholic/  (for sad, slow music)
└── intense/      (for rock, dramatic music)
```

### 4. Add Music Files

Add at least 2-3 music files to each mood directory. See [MUSIC_GUIDE.md](MUSIC_GUIDE.md) for:
- Free music resources
- Recommended genres per mood
- Copyright-safe options

**Quick tip**: Start with free music from [Incompetech](https://incompetech.com/music/).

## Running DeepJ

### Basic Usage
```bash
python deepj.py
```

### Test Mood Detection First (No Music Required)
```bash
python demo.py
```

This runs mood detection without playing music, perfect for testing your setup!

### Advanced Options
```bash
# Use external webcam
python deepj.py --camera 1

# Use custom music directory
python deepj.py --music-dir /path/to/music
```

## Controls

While running:
- **Q**: Quit application
- **SPACE**: Pause/Resume music
- **+/=**: Increase volume
- **-/_**: Decrease volume

## What to Expect

1. **Camera Window Opens**: You'll see yourself on screen
2. **Mood Detection Starts**: AI analyzes your facial expressions
3. **Current Mood Displayed**: Shows energetic, calm, melancholic, or intense
4. **Music Plays Automatically**: Matches your detected mood
5. **Automatic Switching**: Music changes when mood changes

## Tips for Best Results

### Camera Setup
- Ensure good lighting (face clearly visible)
- Position face in center of frame
- Avoid backlighting

### Music Library
- Add 5+ tracks per mood for variety
- Use consistent audio formats (MP3 recommended)
- Organize by actual mood of the music

### Performance
- Close other camera-using apps
- Reduce video resolution if slow (edit `deepj.py`)
- Increase detection interval for older hardware

## Troubleshooting

### "Cannot open camera"
```bash
# Try different camera IDs
python deepj.py --camera 0
python deepj.py --camera 1
python deepj.py --camera 2
```

### "No tracks found for mood"
- Check music files are in correct directories
- Verify file formats: MP3, WAV, OGG, or FLAC
- Run `python setup.py` again

### "Module not found" errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Slow performance
Edit `mood_detector.py`:
```python
self.detection_interval = 2.0  # Increase from 1.0 to 2.0
```

### Music not playing
- Check audio output device is working
- Try WAV format instead of MP3
- Verify file permissions (must be readable)

## Example Session

```bash
$ python deepj.py
==================================================
DeepJ - AI DJ Starting...
==================================================
Camera initialized successfully
Music directory: /home/user/DeepJ/music

Controls:
  Q - Quit
  SPACE - Pause/Resume music
  + - Increase volume
  - - Decrease volume

Starting mood detection...

Mood changed: None -> calm
Now playing: ambient_peaceful.mp3 (Mood: calm)

Mood changed: calm -> energetic
Now playing: pop_happy_song.mp3 (Mood: energetic)
```

## Next Steps

1. **Customize**: Edit `config.ini` for your preferences
2. **Expand Music**: Add more tracks for better variety
3. **Experiment**: Try it at different events (parties, study sessions)
4. **Share**: Show friends and get feedback!

## Common Use Cases

### Study Session
- Add lo-fi, classical, and ambient music to `calm/`
- AI maintains focus-friendly atmosphere

### House Party
- Add dance, pop, and electronic to `energetic/`
- Music adapts to party energy

### Workout
- Add high-energy tracks to `intense/`
- Matches exercise intensity

### Relaxation
- Add meditation, spa music to `calm/`
- Maintains peaceful environment

## Need Help?

- Check [README.md](README.md) for detailed documentation
- Review [MUSIC_GUIDE.md](MUSIC_GUIDE.md) for music setup
- Open an issue on GitHub
- Read [CONTRIBUTING.md](CONTRIBUTING.md) to improve DeepJ

## Have Fun! 🎉🎵

DeepJ adapts to your vibe - enjoy your personalized DJ experience!
