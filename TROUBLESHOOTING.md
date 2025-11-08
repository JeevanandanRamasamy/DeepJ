# DeepJ Troubleshooting Guide

Common issues and their solutions for DeepJ.

## Installation Issues

### "No module named 'cv2'"
**Problem**: OpenCV not installed correctly

**Solution**:
```bash
pip install opencv-python --upgrade
# Or if that fails:
pip install opencv-python-headless
```

### "No module named 'deepface'"
**Problem**: DeepFace not installed

**Solution**:
```bash
pip install deepface --upgrade
```

### "No module named 'pygame'"
**Problem**: Pygame not installed

**Solution**:
```bash
pip install pygame --upgrade
```

### TensorFlow Installation Issues
**Problem**: TensorFlow fails to install or has compatibility issues

**Solution**:
```bash
# Try installing a specific version
pip install tensorflow==2.13.0

# On M1/M2 Macs:
pip install tensorflow-macos tensorflow-metal

# On systems with GPU:
pip install tensorflow-gpu
```

## Camera Issues

### "Error: Cannot open camera 0"
**Problem**: Camera not accessible or in use by another application

**Solutions**:
1. Close other applications using the camera (Zoom, Teams, etc.)
2. Try a different camera ID:
   ```bash
   python deepj.py --camera 1
   python deepj.py --camera 2
   ```
3. Check camera permissions (System Settings on Mac, Device Manager on Windows)
4. Test camera with another application first

### Camera Lag or Slow Performance
**Problem**: Frame rate too slow, jerky video

**Solutions**:
1. Reduce camera resolution in `deepj.py`:
   ```python
   self.frame_width = 320   # Default: 640
   self.frame_height = 240  # Default: 480
   ```

2. Increase detection interval in `mood_detector.py`:
   ```python
   self.detection_interval = 2.0  # Default: 1.0
   ```

3. Close other resource-intensive applications

### Black Screen or No Video
**Problem**: Window opens but shows black screen

**Solutions**:
1. Verify camera is not covered or disabled
2. Update camera drivers
3. Try running as administrator (Windows)
4. Check USB connection if using external camera

## Emotion Detection Issues

### "No face detected" or Mood Not Changing
**Problem**: DeepFace cannot detect faces

**Solutions**:
1. **Improve Lighting**: Ensure face is well-lit
2. **Face Position**: Center your face in the camera view
3. **Distance**: Be 1-3 feet from camera
4. **Avoid Obstructions**: Remove masks, glasses if needed
5. **Camera Quality**: Use better quality webcam if available

### Mood Detection Too Sensitive
**Problem**: Mood changes too frequently

**Solution**: Increase history size in `mood_detector.py`:
```python
self.emotion_history = deque(maxlen=50)  # Default: 30
```

### Mood Detection Too Slow
**Problem**: Takes too long to detect mood changes

**Solutions**:
1. Decrease history size:
   ```python
   self.emotion_history = deque(maxlen=15)  # Default: 30
   ```

2. Decrease detection interval:
   ```python
   self.detection_interval = 0.5  # Default: 1.0
   ```

### Wrong Emotions Detected
**Problem**: Emotions don't match actual expression

**Causes & Solutions**:
- **Poor Lighting**: Add more light, avoid backlighting
- **Camera Angle**: Position camera at eye level
- **Expression Clarity**: Make clearer facial expressions
- **Model Limitations**: DeepFace has accuracy limits (~70-80%)

## Music Playback Issues

### "No tracks found for mood: X"
**Problem**: No music files in mood directory

**Solutions**:
1. Add music files to the directory:
   ```bash
   ls music/energetic/  # Should show music files
   ```

2. Check supported formats: MP3, WAV, OGG, FLAC

3. Run setup script if directories missing:
   ```bash
   python setup.py
   ```

### Music Not Playing
**Problem**: Application runs but no sound

**Solutions**:
1. **Check Audio Output**: Verify speakers/headphones work
2. **Volume**: Press '+' key to increase volume
3. **File Format**: Try WAV files instead of MP3
4. **Pygame Audio**: 
   ```bash
   # Reinstall pygame
   pip uninstall pygame
   pip install pygame
   ```

### MP3 Files Not Playing
**Problem**: WAV works but MP3 doesn't

**Solution**: Install MP3 codec support
- **Windows**: Usually works by default
- **Linux**: 
  ```bash
  sudo apt-get install libmpg123-dev
  pip install pygame --upgrade
  ```
- **Mac**: Should work by default

### Audio Stuttering or Distortion
**Problem**: Music plays but sounds bad

**Solutions**:
1. Use higher quality audio files
2. Close other audio applications
3. Check audio driver settings
4. Try different audio format (WAV instead of MP3)

## Performance Issues

### High CPU Usage
**Problem**: DeepJ uses too much CPU

**Solutions**:
1. Increase detection interval:
   ```python
   self.detection_interval = 2.0  # Process less frequently
   ```

2. Reduce frame rate in `deepj.py`:
   ```python
   key = cv2.waitKey(30) & 0xFF  # Change from waitKey(1)
   ```

3. Lower camera resolution
4. Close other applications

### High Memory Usage
**Problem**: Application uses too much RAM

**Solutions**:
1. Restart application periodically
2. Reduce emotion history size:
   ```python
   self.emotion_history = deque(maxlen=10)  # Default: 30
   ```
3. Close browser and other memory-heavy apps

### Application Crashes
**Problem**: DeepJ crashes or freezes

**Solutions**:
1. Check error message in terminal
2. Update all dependencies:
   ```bash
   pip install -r requirements.txt --upgrade
   ```
3. Check available disk space
4. Ensure camera drivers are updated
5. Run with error logging:
   ```bash
   python deepj.py 2>&1 | tee deepj_errors.log
   ```

## Model Download Issues

### First Run Hangs
**Problem**: Application seems frozen on first run

**Explanation**: DeepFace downloads AI models on first use (~500MB)

**Solutions**:
1. Wait patiently (5-10 minutes depending on connection)
2. Check internet connection
3. Monitor with verbose output:
   ```bash
   python -c "from deepface import DeepFace; DeepFace.analyze('test.jpg')"
   ```

### Download Fails
**Problem**: Model download fails or times out

**Solutions**:
1. Check internet connection and firewall
2. Use VPN if download is blocked
3. Manual model download:
   - Models stored in `~/.deepface/weights/`
   - Download from DeepFace GitHub releases
   - Place in weights directory

## Platform-Specific Issues

### Windows

**Antivirus Blocking**
- Add DeepJ directory to antivirus exceptions
- Temporarily disable antivirus during installation

**Camera Access Denied**
- Settings → Privacy → Camera → Allow desktop apps

**Permission Issues**
- Run as Administrator

### macOS

**Camera Permission**
- System Preferences → Security & Privacy → Camera
- Enable for Terminal/iTerm

**"Cannot be opened" Error**
- Right-click Python.app → Open
- Or: `sudo spctl --master-disable`

### Linux

**Camera Not Found**
```bash
# Check available cameras
ls /dev/video*

# Give permissions
sudo chmod 666 /dev/video0
```

**Missing Dependencies**
```bash
# Ubuntu/Debian
sudo apt-get install python3-opencv python3-pygame

# Fedora
sudo dnf install python3-opencv python3-pygame
```

## Configuration Issues

### Changes Not Taking Effect
**Problem**: Modified config.ini but no change

**Solution**: Config file support coming soon - currently edit Python files directly

### Can't Find Config File
**Problem**: Application doesn't read config.ini

**Current Status**: config.ini is for reference only. To change settings:
- Edit `mood_detector.py` for detection settings
- Edit `music_player.py` for audio settings
- Edit `deepj.py` for display settings

## Getting Help

If problems persist:

1. **Check logs**: Look for error messages in terminal
2. **Test components**:
   ```bash
   python demo.py  # Test mood detection only
   python setup.py # Verify directory structure
   ```
3. **System info**:
   ```bash
   python --version
   pip list | grep -E "opencv|deepface|pygame|tensorflow"
   ```
4. **Create GitHub issue** with:
   - Error messages
   - System info
   - Steps to reproduce
   - What you've already tried

## Common Error Messages

### "ValueError: not enough values to unpack"
- Usually frame reading issue
- Check camera connection

### "OSError: [Errno 2] No such file or directory: 'music/X'"
- Run `python setup.py`
- Verify music directory exists

### "pygame.error: mixer not initialized"
- Audio system issue
- Check audio device is available
- Try: `pygame.mixer.quit(); pygame.mixer.init()`

### "TensorFlow GPU not found"
- Normal if you don't have GPU
- TensorFlow will use CPU
- No action needed unless you want GPU acceleration

## Performance Benchmarks

**Typical Performance**:
- Detection: 1-2 seconds per frame
- CPU: 20-40% on modern systems
- RAM: 500-800 MB
- Startup: 10-30 seconds (first time longer)

**Minimum Requirements**:
- CPU: Dual-core 2.0 GHz
- RAM: 4 GB
- Camera: 720p webcam
- OS: Windows 10+, macOS 10.14+, Linux

**Recommended**:
- CPU: Quad-core 2.5 GHz+
- RAM: 8 GB+
- Camera: 1080p webcam
- OS: Latest version

## Still Having Issues?

1. Read [QUICKSTART.md](QUICKSTART.md) for setup guide
2. Check [README.md](README.md) for detailed documentation
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
4. Open an issue on GitHub with detailed information
