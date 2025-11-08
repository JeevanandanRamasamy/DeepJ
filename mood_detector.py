"""
Mood Detection Module
Analyzes camera feed to detect emotions and overall mood
"""
import cv2
import numpy as np
from deepface import DeepFace
from collections import deque
import time


class MoodDetector:
    """Detects mood from camera feed using facial emotion recognition"""
    
    # Emotion to mood mapping
    EMOTION_TO_MOOD = {
        'happy': 'energetic',
        'neutral': 'calm',
        'sad': 'melancholic',
        'angry': 'intense',
        'surprise': 'energetic',
        'fear': 'calm',
        'disgust': 'calm'
    }
    
    def __init__(self, history_size=30):
        """
        Initialize mood detector
        
        Args:
            history_size: Number of recent detections to keep for smoothing
        """
        self.emotion_history = deque(maxlen=history_size)
        self.last_detection_time = 0
        self.detection_interval = 1.0  # Detect every 1 second
        self.current_mood = 'calm'  # Default mood
        
    def detect_emotions(self, frame):
        """
        Detect emotions in the given frame
        
        Args:
            frame: Video frame from camera
            
        Returns:
            dict: Detected emotions and dominant emotion
        """
        try:
            # Analyze the frame
            result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
            
            # Handle both single face and multiple faces
            if isinstance(result, list):
                result = result[0]
            
            emotions = result.get('emotion', {})
            dominant_emotion = result.get('dominant_emotion', 'neutral')
            
            return {
                'emotions': emotions,
                'dominant_emotion': dominant_emotion
            }
        except Exception as e:
            print(f"Error detecting emotions: {e}")
            return None
    
    def update_mood(self, frame):
        """
        Update current mood based on frame analysis
        
        Args:
            frame: Video frame from camera
            
        Returns:
            str: Current mood
        """
        current_time = time.time()
        
        # Only detect at specified intervals to improve performance
        if current_time - self.last_detection_time < self.detection_interval:
            return self.current_mood
        
        self.last_detection_time = current_time
        
        # Detect emotions in frame
        detection_result = self.detect_emotions(frame)
        
        if detection_result:
            dominant_emotion = detection_result['dominant_emotion']
            self.emotion_history.append(dominant_emotion)
            
            # Calculate mood from recent emotion history
            if len(self.emotion_history) > 0:
                # Count emotion occurrences
                emotion_counts = {}
                for emotion in self.emotion_history:
                    mood = self.EMOTION_TO_MOOD.get(emotion, 'calm')
                    emotion_counts[mood] = emotion_counts.get(mood, 0) + 1
                
                # Get dominant mood
                self.current_mood = max(emotion_counts, key=emotion_counts.get)
        
        return self.current_mood
    
    def get_current_mood(self):
        """Get the current detected mood"""
        return self.current_mood
    
    def reset(self):
        """Reset the emotion history"""
        self.emotion_history.clear()
        self.current_mood = 'calm'
