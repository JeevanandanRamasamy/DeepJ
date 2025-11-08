# Sample Music Files Guide

This document provides guidance on obtaining music files for testing DeepJ.

## Quick Start for Testing

If you want to quickly test the application without adding your own music, you can use free sample music files.

### Option 1: Use Free Music Resources

Download royalty-free music from these sources:

**For Energetic Mood:**
- [Incompetech - Upbeat Category](https://incompetech.com/music/royalty-free/music.html)
- Search for: "Carefree", "Happy", "Energetic" tracks

**For Calm Mood:**
- [Incompetech - Relaxed Category](https://incompetech.com/music/royalty-free/music.html)
- Search for: "Ambient", "Peaceful", "Relaxing" tracks

**For Melancholic Mood:**
- [Incompetech - Sad Category](https://incompetech.com/music/royalty-free/music.html)
- Search for: "Sad", "Emotional", "Slow" tracks

**For Intense Mood:**
- [Incompetech - Dark Category](https://incompetech.com/music/royalty-free/music.html)
- Search for: "Dark", "Dramatic", "Tense" tracks

### Option 2: Create Simple Test Tones (For Testing Only)

You can generate simple audio files using Python for testing purposes:

```python
# test_audio_generator.py
import numpy as np
from scipy.io import wavfile

def generate_tone(filename, frequency, duration=10):
    """Generate a simple tone for testing"""
    sample_rate = 44100
    t = np.linspace(0, duration, int(sample_rate * duration))
    # Generate sine wave
    wave = np.sin(2 * np.pi * frequency * t)
    # Convert to 16-bit integers
    wave = (wave * 32767).astype(np.int16)
    wavfile.write(filename, sample_rate, wave)

# Generate test files
generate_tone('music/energetic/test_energetic.wav', 440)  # A4 note
generate_tone('music/calm/test_calm.wav', 261)            # C4 note
generate_tone('music/melancholic/test_melancholic.wav', 220)  # A3 note
generate_tone('music/intense/test_intense.wav', 329)      # E4 note
```

Note: This requires scipy: `pip install scipy`

### Option 3: Use Your Own Music

Simply copy your music files to the appropriate mood directories:

1. Energetic mood: `music/energetic/` - Add pop, electronic, dance music
2. Calm mood: `music/calm/` - Add ambient, classical, chill music
3. Melancholic mood: `music/melancholic/` - Add blues, sad, slow music
4. Intense mood: `music/intense/` - Add rock, metal, intense music

Supported formats: MP3, WAV, OGG, FLAC

## Music Organization Tips

### Recommended Files Per Mood
- Minimum: 3-5 tracks per mood for variety
- Recommended: 10+ tracks per mood for best experience
- Each track should be 2-5 minutes long

### Naming Convention
Use descriptive names for easier management:
```
music/
├── energetic/
│   ├── pop_happy_song.mp3
│   ├── edm_upbeat_track.mp3
│   └── dance_party_mix.mp3
├── calm/
│   ├── ambient_peaceful.mp3
│   ├── classical_relaxing.mp3
│   └── acoustic_chill.mp3
└── ...
```

## Copyright Notice

**Important**: Ensure you have the right to use any music files you add to the application. 
- Use royalty-free music
- Use music you own
- Use music with appropriate licenses
- Do not use copyrighted music without permission

## Troubleshooting

### Music Not Playing
1. Verify files are in correct format (MP3, WAV, OGG, or FLAC)
2. Check file permissions (readable)
3. Ensure pygame can play the format (MP3 requires additional codecs on some systems)

### No Mood Changes
1. Make sure you have music in multiple mood directories
2. Verify your face is visible to the camera
3. Check lighting conditions

## Resources

- [Free Music Archive](https://freemusicarchive.org/) - Various genres, free music
- [Incompetech](https://incompetech.com/music/) - Royalty-free music by Kevin MacLeod
- [Bensound](https://www.bensound.com/) - Royalty-free music
- [ccMixter](https://ccmixter.org/) - Creative Commons music
