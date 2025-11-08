"""
Music Player Module
Manages music playback based on detected mood
"""
import os
import random
import pygame
from pathlib import Path


class MusicPlayer:
    """Plays music based on detected mood"""
    
    # Mood to genre/style mapping
    MOOD_MUSIC_STYLES = {
        'energetic': ['pop', 'electronic', 'dance', 'upbeat'],
        'calm': ['ambient', 'classical', 'chill', 'acoustic'],
        'melancholic': ['blues', 'sad', 'slow', 'emotional'],
        'intense': ['rock', 'metal', 'intense', 'dramatic']
    }
    
    def __init__(self, music_directory='music'):
        """
        Initialize music player
        
        Args:
            music_directory: Directory containing music files organized by mood
        """
        pygame.mixer.init()
        self.music_directory = Path(music_directory)
        self.current_mood = None
        self.current_track = None
        self.is_playing = False
        self.volume = 0.7
        pygame.mixer.music.set_volume(self.volume)
        
        # Create music directory structure if it doesn't exist
        self._initialize_music_directory()
        
    def _initialize_music_directory(self):
        """Create music directory structure for different moods"""
        for mood in self.MOOD_MUSIC_STYLES.keys():
            mood_dir = self.music_directory / mood
            mood_dir.mkdir(parents=True, exist_ok=True)
    
    def get_tracks_for_mood(self, mood):
        """
        Get all music tracks for a specific mood
        
        Args:
            mood: The mood to get tracks for
            
        Returns:
            list: List of track paths
        """
        mood_dir = self.music_directory / mood
        
        if not mood_dir.exists():
            return []
        
        # Support common audio formats
        audio_extensions = ['.mp3', '.wav', '.ogg', '.flac']
        tracks = []
        
        for ext in audio_extensions:
            tracks.extend(mood_dir.glob(f'*{ext}'))
        
        return [str(track) for track in tracks]
    
    def play_for_mood(self, mood):
        """
        Play music appropriate for the given mood
        
        Args:
            mood: The mood to play music for
        """
        # If mood hasn't changed and music is playing, continue
        if mood == self.current_mood and self.is_playing:
            # Check if current track is still playing
            if pygame.mixer.music.get_busy():
                return
        
        # Get tracks for this mood
        tracks = self.get_tracks_for_mood(mood)
        
        if not tracks:
            print(f"No tracks found for mood: {mood}")
            print(f"Please add music files to: {self.music_directory / mood}")
            return
        
        # Select a random track
        track = random.choice(tracks)
        
        # Play the track
        try:
            pygame.mixer.music.load(track)
            pygame.mixer.music.play()
            self.current_track = track
            self.current_mood = mood
            self.is_playing = True
            print(f"Now playing: {Path(track).name} (Mood: {mood})")
        except Exception as e:
            print(f"Error playing track: {e}")
    
    def stop(self):
        """Stop music playback"""
        pygame.mixer.music.stop()
        self.is_playing = False
        self.current_track = None
    
    def pause(self):
        """Pause music playback"""
        pygame.mixer.music.pause()
        self.is_playing = False
    
    def resume(self):
        """Resume music playback"""
        pygame.mixer.music.unpause()
        self.is_playing = True
    
    def set_volume(self, volume):
        """
        Set playback volume
        
        Args:
            volume: Volume level (0.0 to 1.0)
        """
        self.volume = max(0.0, min(1.0, volume))
        pygame.mixer.music.set_volume(self.volume)
    
    def get_status(self):
        """Get current playback status"""
        return {
            'is_playing': self.is_playing and pygame.mixer.music.get_busy(),
            'current_mood': self.current_mood,
            'current_track': Path(self.current_track).name if self.current_track else None,
            'volume': self.volume
        }
