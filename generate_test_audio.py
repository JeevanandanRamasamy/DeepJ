"""
Generate simple test audio files for DeepJ
Creates basic tone files for each mood to test the application
"""
import os
import sys

try:
    import numpy as np
    from scipy.io import wavfile
except ImportError:
    print("Error: This script requires scipy and numpy")
    print("Install with: pip install scipy numpy")
    sys.exit(1)


def generate_tone_melody(filename, frequencies, duration=10):
    """
    Generate a simple melody for testing
    
    Args:
        filename: Output WAV file path
        frequencies: List of frequencies to cycle through
        duration: Total duration in seconds
    """
    sample_rate = 44100
    note_duration = duration / len(frequencies)
    
    audio_data = np.array([])
    
    for freq in frequencies:
        t = np.linspace(0, note_duration, int(sample_rate * note_duration))
        # Generate sine wave with fade in/out
        wave = np.sin(2 * np.pi * freq * t)
        
        # Apply envelope for smoother transitions
        envelope = np.ones_like(wave)
        fade_length = int(0.05 * len(wave))  # 5% fade
        envelope[:fade_length] = np.linspace(0, 1, fade_length)
        envelope[-fade_length:] = np.linspace(1, 0, fade_length)
        
        wave = wave * envelope * 0.3  # Reduce amplitude
        audio_data = np.concatenate([audio_data, wave])
    
    # Convert to 16-bit integers
    audio_data = (audio_data * 32767).astype(np.int16)
    wavfile.write(filename, sample_rate, audio_data)


def main():
    """Generate test audio files for all moods"""
    print("=" * 60)
    print("DeepJ Test Audio Generator")
    print("=" * 60)
    print("\nThis will create simple test audio files for each mood.")
    print("These are NOT real music - just tones for testing!")
    print()
    
    # Define melodies for each mood
    moods = {
        'energetic': {
            'frequencies': [523, 587, 659, 698, 784, 880, 988, 1047],  # C5 major scale up
            'description': 'Ascending major scale (happy/energetic)'
        },
        'calm': {
            'frequencies': [261, 293, 329, 349, 392, 349, 329, 293],  # C4 major pattern
            'description': 'Gentle major pattern (calm/peaceful)'
        },
        'melancholic': {
            'frequencies': [220, 246, 261, 293, 261, 246, 220, 196],  # A3 minor pattern
            'description': 'Minor pattern descending (sad/melancholic)'
        },
        'intense': {
            'frequencies': [110, 123, 110, 146, 110, 164, 110, 184],  # A2 power chord pattern
            'description': 'Low frequency pattern (intense/dramatic)'
        }
    }
    
    created_files = []
    
    for mood, config in moods.items():
        mood_dir = f'music/{mood}'
        
        # Check if directory exists
        if not os.path.exists(mood_dir):
            print(f"Warning: Directory {mood_dir} not found. Run setup.py first!")
            continue
        
        # Generate test file
        filename = f'{mood_dir}/test_{mood}.wav'
        print(f"Generating {mood} test audio...")
        print(f"  Description: {config['description']}")
        
        try:
            generate_tone_melody(filename, config['frequencies'], duration=15)
            created_files.append(filename)
            print(f"  ✓ Created: {filename}")
        except Exception as e:
            print(f"  ✗ Error: {e}")
        
        print()
    
    print("=" * 60)
    if created_files:
        print("Success! Created test audio files:")
        for f in created_files:
            print(f"  - {f}")
        print()
        print("You can now run: python deepj.py")
        print()
        print("Note: These are simple test tones, not real music!")
        print("For better experience, add real music files.")
        print("See MUSIC_GUIDE.md for recommendations.")
    else:
        print("No files created. Make sure to run setup.py first!")
    print("=" * 60)


if __name__ == '__main__':
    main()
