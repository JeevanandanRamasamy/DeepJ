"""
Demo script for DeepJ - Tests mood detection without music files
"""
import cv2
import sys
from mood_detector import MoodDetector


class DeepJDemo:
    """Demo version of DeepJ for testing mood detection"""
    
    def __init__(self, camera_id=0):
        """Initialize demo application"""
        self.camera_id = camera_id
        self.cap = None
        self.mood_detector = MoodDetector(history_size=30)
        self.running = False
        self.window_name = 'DeepJ Demo - Mood Detection'
        
    def initialize_camera(self):
        """Initialize camera capture"""
        self.cap = cv2.VideoCapture(self.camera_id)
        
        if not self.cap.isOpened():
            print(f"Error: Cannot open camera {self.camera_id}")
            return False
        
        return True
    
    def draw_info_overlay(self, frame, mood, emotion_history):
        """Draw information overlay on video frame"""
        overlay = frame.copy()
        
        # Draw background
        cv2.rectangle(overlay, (10, 10), (350, 150), (0, 0, 0), -1)
        alpha = 0.6
        frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
        
        # Add text
        font = cv2.FONT_HERSHEY_SIMPLEX
        
        cv2.putText(frame, 'DeepJ Demo - Mood Detection', (20, 35), 
                   font, 0.7, (255, 255, 255), 2)
        
        # Current mood
        mood_color = {
            'energetic': (0, 255, 255),
            'calm': (255, 200, 100),
            'melancholic': (255, 100, 100),
            'intense': (0, 100, 255)
        }.get(mood, (255, 255, 255))
        
        cv2.putText(frame, f'Current Mood: {mood.upper()}', 
                   (20, 70), font, 0.7, mood_color, 2)
        
        # Recent emotions
        if emotion_history:
            recent = list(emotion_history)[-5:]
            emotions_text = ', '.join(recent[-5:])
            cv2.putText(frame, f'Recent: {emotions_text}', 
                       (20, 100), font, 0.5, (200, 200, 200), 1)
        
        # Controls
        cv2.putText(frame, 'Press Q to quit', 
                   (20, 130), font, 0.5, (150, 150, 150), 1)
        
        return frame
    
    def run(self):
        """Run the demo application"""
        print("=" * 50)
        print("DeepJ Demo - Mood Detection Test")
        print("=" * 50)
        print("\nThis demo tests mood detection without playing music.")
        print("Make sure your face is visible to the camera.")
        print("\nPress Q to quit\n")
        
        if not self.initialize_camera():
            return
        
        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
        self.running = True
        
        try:
            while self.running:
                ret, frame = self.cap.read()
                
                if not ret:
                    print("Error: Cannot read frame")
                    break
                
                # Detect mood
                current_mood = self.mood_detector.update_mood(frame)
                
                # Draw overlay
                display_frame = self.draw_info_overlay(
                    frame, 
                    current_mood, 
                    self.mood_detector.emotion_history
                )
                
                # Display
                cv2.imshow(self.window_name, display_frame)
                
                # Handle input
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q') or key == ord('Q'):
                    break
        
        except KeyboardInterrupt:
            print("\nInterrupted by user")
        
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources"""
        self.running = False
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        print("Demo ended")


def main():
    """Main entry point for demo"""
    import argparse
    
    parser = argparse.ArgumentParser(description='DeepJ Demo - Test Mood Detection')
    parser.add_argument('--camera', type=int, default=0,
                       help='Camera device ID (default: 0)')
    
    args = parser.parse_args()
    
    demo = DeepJDemo(camera_id=args.camera)
    demo.run()


if __name__ == '__main__':
    main()
