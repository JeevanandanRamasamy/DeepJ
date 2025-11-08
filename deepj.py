"""
DeepJ - AI DJ Application
Main application that integrates camera feed, mood detection, and music playback
"""
import cv2
import sys
import time
from mood_detector import MoodDetector
from music_player import MusicPlayer


class DeepJApp:
    """Main AI DJ application"""
    
    def __init__(self, camera_id=0, music_directory='music'):
        """
        Initialize DeepJ application
        
        Args:
            camera_id: Camera device ID (default: 0)
            music_directory: Directory containing music files
        """
        self.camera_id = camera_id
        self.cap = None
        self.mood_detector = MoodDetector(history_size=30)
        self.music_player = MusicPlayer(music_directory)
        self.running = False
        
        # Display settings
        self.window_name = 'DeepJ - AI DJ'
        self.frame_width = 640
        self.frame_height = 480
        
    def initialize_camera(self):
        """Initialize camera capture"""
        self.cap = cv2.VideoCapture(self.camera_id)
        
        if not self.cap.isOpened():
            print(f"Error: Cannot open camera {self.camera_id}")
            return False
        
        # Set camera resolution
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.frame_width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frame_height)
        
        return True
    
    def draw_info_overlay(self, frame, mood, status):
        """
        Draw information overlay on video frame
        
        Args:
            frame: Video frame
            mood: Current detected mood
            status: Music player status
            
        Returns:
            frame: Frame with overlay
        """
        # Create semi-transparent overlay
        overlay = frame.copy()
        
        # Draw background rectangles
        cv2.rectangle(overlay, (10, 10), (300, 120), (0, 0, 0), -1)
        
        # Blend with original frame
        alpha = 0.6
        frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
        
        # Add text information
        font = cv2.FONT_HERSHEY_SIMPLEX
        
        # Title
        cv2.putText(frame, 'DeepJ - AI DJ', (20, 35), font, 0.7, (255, 255, 255), 2)
        
        # Current mood
        mood_color = self._get_mood_color(mood)
        cv2.putText(frame, f'Mood: {mood.upper()}', (20, 65), font, 0.6, mood_color, 2)
        
        # Music status
        if status['is_playing']:
            cv2.putText(frame, f'Playing: {status["current_track"][:25]}', 
                       (20, 90), font, 0.5, (0, 255, 0), 1)
        else:
            cv2.putText(frame, 'Status: No music playing', 
                       (20, 90), font, 0.5, (0, 0, 255), 1)
        
        # Controls info
        cv2.putText(frame, 'Q: Quit | SPACE: Pause/Resume', 
                   (20, 110), font, 0.4, (200, 200, 200), 1)
        
        return frame
    
    def _get_mood_color(self, mood):
        """Get color for mood visualization"""
        mood_colors = {
            'energetic': (0, 255, 255),    # Yellow
            'calm': (255, 200, 100),        # Light blue
            'melancholic': (255, 100, 100), # Light purple
            'intense': (0, 100, 255)        # Orange
        }
        return mood_colors.get(mood, (255, 255, 255))
    
    def run(self):
        """Run the main application loop"""
        print("=" * 50)
        print("DeepJ - AI DJ Starting...")
        print("=" * 50)
        
        # Initialize camera
        if not self.initialize_camera():
            return
        
        print("Camera initialized successfully")
        print(f"Music directory: {self.music_player.music_directory}")
        print("\nControls:")
        print("  Q - Quit")
        print("  SPACE - Pause/Resume music")
        print("  + - Increase volume")
        print("  - - Decrease volume")
        print("\nStarting mood detection...\n")
        
        # Create display window
        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
        
        self.running = True
        last_mood = None
        
        try:
            while self.running:
                # Capture frame
                ret, frame = self.cap.read()
                
                if not ret:
                    print("Error: Cannot read frame from camera")
                    break
                
                # Detect mood from frame
                current_mood = self.mood_detector.update_mood(frame)
                
                # Update music based on mood
                if current_mood != last_mood:
                    print(f"Mood changed: {last_mood} -> {current_mood}")
                    self.music_player.play_for_mood(current_mood)
                    last_mood = current_mood
                
                # Check if current track finished and play next one
                status = self.music_player.get_status()
                if not status['is_playing'] and last_mood:
                    self.music_player.play_for_mood(last_mood)
                
                # Draw overlay with information
                display_frame = self.draw_info_overlay(frame, current_mood, status)
                
                # Display frame
                cv2.imshow(self.window_name, display_frame)
                
                # Handle keyboard input
                key = cv2.waitKey(1) & 0xFF
                
                if key == ord('q') or key == ord('Q'):
                    print("\nShutting down...")
                    break
                elif key == ord(' '):
                    if self.music_player.is_playing:
                        self.music_player.pause()
                        print("Music paused")
                    else:
                        self.music_player.resume()
                        print("Music resumed")
                elif key == ord('+') or key == ord('='):
                    new_volume = self.music_player.volume + 0.1
                    self.music_player.set_volume(new_volume)
                    print(f"Volume: {int(self.music_player.volume * 100)}%")
                elif key == ord('-') or key == ord('_'):
                    new_volume = self.music_player.volume - 0.1
                    self.music_player.set_volume(new_volume)
                    print(f"Volume: {int(self.music_player.volume * 100)}%")
        
        except KeyboardInterrupt:
            print("\nInterrupted by user")
        
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources"""
        self.running = False
        
        if self.music_player:
            self.music_player.stop()
        
        if self.cap:
            self.cap.release()
        
        cv2.destroyAllWindows()
        print("Cleanup complete")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='DeepJ - AI DJ Application')
    parser.add_argument('--camera', type=int, default=0, 
                       help='Camera device ID (default: 0)')
    parser.add_argument('--music-dir', type=str, default='music',
                       help='Directory containing music files (default: music)')
    
    args = parser.parse_args()
    
    # Create and run application
    app = DeepJApp(camera_id=args.camera, music_directory=args.music_dir)
    app.run()


if __name__ == '__main__':
    main()
