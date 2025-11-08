# DeepJ Architecture

This document describes the technical architecture of the DeepJ AI DJ application.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        DeepJ System                          │
│                                                              │
│  ┌──────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │  Camera  │──────▶│ Mood         │──────▶│   Music      │ │
│  │  Feed    │       │ Detector     │       │   Player     │ │
│  └──────────┘      └──────────────┘      └──────────────┘ │
│       │                    │                      │         │
│       │                    │                      │         │
│       ▼                    ▼                      ▼         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Display & User Interface                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Camera Feed (OpenCV)
- **Purpose**: Capture real-time video from webcam
- **Technology**: OpenCV (cv2)
- **Frame Rate**: 30 FPS (adjustable)
- **Resolution**: 640x480 (configurable)

**Key Functions**:
- Initialize camera connection
- Capture video frames
- Handle camera errors

### 2. Mood Detector (mood_detector.py)
- **Purpose**: Analyze facial expressions to determine mood
- **Technology**: DeepFace + TensorFlow
- **Processing**: Real-time emotion recognition

**Pipeline**:
```
Frame → Face Detection → Emotion Analysis → Mood Mapping → Current Mood
```

**Emotion Detection**:
- Detects 7 emotions: happy, sad, angry, surprise, fear, disgust, neutral
- Uses pre-trained deep learning models
- Processes at configurable intervals (default: 1 second)

**Mood Mapping**:
```
happy, surprise  → energetic
neutral, fear    → calm
sad              → melancholic
angry            → intense
```

**Mood Smoothing**:
- Maintains rolling history of recent emotions (default: 30 detections)
- Uses majority voting to prevent rapid mood changes
- Provides stable mood transitions

### 3. Music Player (music_player.py)
- **Purpose**: Play music matching detected mood
- **Technology**: Pygame mixer
- **Formats**: MP3, WAV, OGG, FLAC

**Music Organization**:
```
music/
├── energetic/   (pop, electronic, dance)
├── calm/        (ambient, classical, chill)
├── melancholic/ (blues, sad, slow)
└── intense/     (rock, metal, dramatic)
```

**Playback Logic**:
1. Receive mood update
2. Select random track from mood directory
3. Load and play track
4. Monitor playback status
5. Auto-play next track when finished

**Features**:
- Automatic track selection
- Volume control
- Pause/resume functionality
- Seamless mood transitions

### 4. Display & UI (deepj.py)
- **Purpose**: Provide visual feedback and controls
- **Technology**: OpenCV GUI

**Display Elements**:
- Live camera feed
- Current mood indicator (color-coded)
- Now playing track name
- Control instructions
- Status information

**User Controls**:
- Keyboard shortcuts for all functions
- Real-time feedback
- Graceful shutdown

## Data Flow

```
1. Camera Capture
   ↓
2. Frame Analysis (every 1 second)
   ↓
3. Emotion Detection (DeepFace)
   ↓
4. Emotion → Mood Mapping
   ↓
5. Mood History Update
   ↓
6. Dominant Mood Calculation
   ↓
7. Music Selection (if mood changed)
   ↓
8. Music Playback
   ↓
9. Display Update
   ↓
   (loop back to step 1)
```

## Key Algorithms

### Mood Detection Algorithm

```python
1. Capture frame from camera
2. IF (time_since_last_detection < interval):
   - Return cached mood
3. ELSE:
   - Run emotion detection on frame
   - Add dominant emotion to history
   - Calculate mood from emotion history:
     * Count occurrences of each mood
     * Select most frequent mood
   - Update current_mood
   - Return current_mood
```

### Music Selection Algorithm

```python
1. Receive mood update
2. IF (mood == current_mood AND music_is_playing):
   - Continue playing
3. ELSE:
   - Get all tracks for new mood
   - IF (no tracks found):
     * Print error message
     * Return
   - Select random track
   - Load and play track
   - Update current_mood
```

## Performance Considerations

### Optimization Strategies

1. **Emotion Detection Throttling**
   - Process every N seconds (not every frame)
   - Reduces CPU usage by 90%+
   - Minimal impact on mood accuracy

2. **Mood History Smoothing**
   - Prevents flickering between moods
   - Uses rolling window average
   - Configurable history size

3. **Frame Rate Management**
   - Display updates at 30 FPS
   - Emotion detection at 1 FPS
   - Independent processing rates

4. **Asynchronous Operations**
   - Music playback in separate thread
   - Non-blocking UI updates
   - Responsive user controls

### Resource Usage

**Typical Performance**:
- CPU: 20-40% (single core)
- RAM: 500-800 MB
- GPU: Optional (TensorFlow can use GPU)
- Network: Initial model download only

## Error Handling

### Camera Failures
- Graceful degradation
- Clear error messages
- Retry mechanisms

### Music File Issues
- File format validation
- Missing file warnings
- Fallback to available tracks

### Emotion Detection Errors
- Continue with last known mood
- Log errors for debugging
- No application crash

## Extension Points

### Adding New Moods
1. Add mood to `MoodDetector.EMOTION_TO_MOOD`
2. Add mood to `MusicPlayer.MOOD_MUSIC_STYLES`
3. Create mood directory in `music/`
4. Update display colors in `deepj.py`

### Custom Emotion Mapping
Edit `mood_detector.py`:
```python
EMOTION_TO_MOOD = {
    'happy': 'your_custom_mood',
    # ... customize mappings
}
```

### Integration Points
- REST API for remote control
- Web socket for real-time updates
- External music services (Spotify, etc.)
- Multi-camera support
- Cloud deployment

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Computer Vision | OpenCV | Camera capture, display |
| AI/ML | DeepFace, TensorFlow | Emotion recognition |
| Audio | Pygame | Music playback |
| Language | Python 3.8+ | Core application |
| Config | INI files | User settings |

## Security Considerations

### Privacy
- No video recording
- No data transmission
- All processing local
- No cloud dependencies

### File Access
- Read-only music directory access
- No write operations outside temp
- Safe file path handling

### Dependencies
- Regular security updates
- Trusted package sources
- Minimal dependency tree

## Future Architecture Enhancements

### Planned Improvements
1. **Multi-person Detection**: Average mood across multiple faces
2. **ML Model Updates**: Custom training on user preferences
3. **Streaming Integration**: Spotify/Apple Music APIs
4. **Web Dashboard**: Remote monitoring and control
5. **Mobile Support**: React Native companion app
6. **Analytics**: Mood patterns and music preferences
7. **Cloud Sync**: Share playlists and settings

### Scalability
- Docker containerization
- Microservices architecture
- Kubernetes deployment
- Load balancing for multiple instances

## Development Guidelines

### Code Organization
```
DeepJ/
├── deepj.py           # Main application (UI + integration)
├── mood_detector.py   # Mood detection logic
├── music_player.py    # Music playback logic
├── config.ini         # Configuration
├── setup.py           # Setup utilities
├── demo.py            # Demo/testing
└── music/             # Music library
```

### Module Responsibilities
- **deepj.py**: Orchestration, UI, main loop
- **mood_detector.py**: Pure emotion/mood logic
- **music_player.py**: Pure audio logic
- No circular dependencies
- Clear separation of concerns

### Testing Strategy
- Unit tests: Individual module logic
- Integration tests: Component interactions
- Manual tests: Real-world scenarios
- Performance tests: Resource usage

## Conclusion

DeepJ uses a modular, event-driven architecture that efficiently combines computer vision, artificial intelligence, and audio processing to create an intelligent DJ experience. The system is designed for easy extension, customization, and integration with external services.
