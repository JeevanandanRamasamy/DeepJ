# DeepJ - AI DJ Application

An intelligent DJ application that analyzes camera feed to detect mood and plays appropriate music automatically. Perfect for parties, study sessions, or any gathering where you want the music to match the vibe!

## Features

- 🎥 **Real-time Mood Detection**: Analyzes facial expressions and emotions from camera feed
- 🎵 **Automatic Music Selection**: Plays music matching the detected mood
- 🎨 **Visual Feedback**: Live video feed with mood and track information overlay
- 🔊 **Volume Control**: Easy keyboard controls for volume adjustment
- 🎭 **Multiple Moods**: Supports energetic, calm, melancholic, and intense moods

## How It Works

1. **Camera Feed**: Captures video from your webcam or connected camera
2. **Emotion Detection**: Uses DeepFace AI to detect facial emotions in real-time
3. **Mood Mapping**: Converts detected emotions into overall mood categories
4. **Music Selection**: Automatically selects and plays music matching the current mood
5. **Continuous Adaptation**: Monitors mood changes and switches music accordingly

## Mood Categories

- **Energetic**: For happy, excited vibes (pop, electronic, dance music)
- **Calm**: For relaxed, neutral atmospheres (ambient, classical, chill music)
- **Melancholic**: For sad or reflective moments (blues, slow, emotional music)
- **Intense**: For focused or angry energy (rock, intense, dramatic music)

## Installation

### Prerequisites

- Python 3.8 or higher
- Webcam or camera device
- Audio output device

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/JeevanandanRamasamy/DeepJ.git
   cd DeepJ
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up music library**
   
   Create a `music` directory in the project root with subdirectories for each mood:
   ```
   music/
   ├── energetic/     # Add upbeat, pop, electronic music here
   ├── calm/          # Add ambient, classical, chill music here
   ├── melancholic/   # Add blues, sad, slow music here
   └── intense/       # Add rock, intense, dramatic music here
   ```
   
   Add your music files (MP3, WAV, OGG, or FLAC) to the appropriate mood folders.

## Usage

### Basic Usage

Run the application with default settings:
```bash
python deepj.py
```

### Advanced Options

```bash
# Use a specific camera (e.g., external webcam)
python deepj.py --camera 1

# Use a custom music directory
python deepj.py --music-dir /path/to/your/music
```

### Keyboard Controls

While the application is running:

- **Q**: Quit the application
- **SPACE**: Pause/Resume music playback
- **+** or **=**: Increase volume
- **-** or **_**: Decrease volume

## Requirements

See `requirements.txt` for the complete list. Main dependencies:

- **opencv-python**: Camera capture and video processing
- **deepface**: AI-powered facial emotion recognition
- **tensorflow**: Deep learning backend for emotion detection
- **pygame**: Audio playback and music management

## Project Structure

```
DeepJ/
├── deepj.py           # Main application entry point
├── mood_detector.py   # Mood detection logic using DeepFace
├── music_player.py    # Music playback management
├── requirements.txt   # Python dependencies
├── music/            # Music library (create this)
│   ├── energetic/
│   ├── calm/
│   ├── melancholic/
│   └── intense/
└── README.md         # This file
```

## Configuration

### Mood Detection Settings

You can adjust mood detection sensitivity in `mood_detector.py`:
- `history_size`: Number of recent detections to consider (default: 30)
- `detection_interval`: Seconds between detections (default: 1.0)

### Music Player Settings

Customize music playback in `music_player.py`:
- `volume`: Default volume level (0.0 to 1.0, default: 0.7)

## Troubleshooting

### Camera Not Found
- Ensure your camera is connected and not being used by another application
- Try different camera IDs: `--camera 0`, `--camera 1`, etc.
- Check camera permissions on your system

### No Music Playing
- Verify music files are in the correct mood directories
- Supported formats: MP3, WAV, OGG, FLAC
- Check that pygame can access your audio device

### Slow Performance
- Reduce camera resolution in `deepj.py`
- Increase `detection_interval` in mood detector
- Ensure TensorFlow is using GPU acceleration if available

### Emotion Detection Errors
- Ensure good lighting for the camera
- Position face clearly in camera view
- Check that DeepFace models are downloaded (happens automatically on first run)

## Use Cases

- **House Parties**: Automatically adapt music to the energy of your guests
- **Study Sessions**: Maintain calm, focused atmosphere with appropriate music
- **Workout Rooms**: Match music intensity to exercise energy levels
- **Cafes/Lounges**: Create ambient atmosphere based on customer mood
- **Meditation Spaces**: Keep environment calm and relaxing

## Technical Details

### Emotion Detection
Uses DeepFace library which leverages state-of-the-art deep learning models for facial emotion recognition. Detects 7 emotions: happy, sad, angry, surprise, fear, disgust, and neutral.

### Mood Aggregation
Maintains a rolling history of detected emotions and maps them to mood categories using a weighted voting system for smooth transitions.

### Music Selection
Randomly selects tracks from the appropriate mood directory, ensuring variety while maintaining mood consistency.

## Future Enhancements

Potential features for future versions:
- Multi-person mood detection and averaging
- Spotify/streaming service integration
- Custom mood-to-music mappings
- Machine learning for personalized music preferences
- Web interface for remote monitoring
- Mobile app support
- Playlist generation and export

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See LICENSE file for details.

## Acknowledgments

- DeepFace library for emotion recognition
- OpenCV for computer vision capabilities
- Pygame for audio playback
- TensorFlow for deep learning support

## Contact

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Enjoy your AI-powered DJ experience! 🎧🎉**
