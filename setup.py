"""
Setup script for DeepJ - Creates music directory structure
"""
import os
from pathlib import Path


def setup_music_directory(base_dir='music'):
    """
    Create music directory structure with mood subdirectories
    
    Args:
        base_dir: Base directory for music files
    """
    moods = ['energetic', 'calm', 'melancholic', 'intense']
    
    base_path = Path(base_dir)
    base_path.mkdir(exist_ok=True)
    
    print("Creating music directory structure...")
    print(f"Base directory: {base_path.absolute()}")
    print()
    
    for mood in moods:
        mood_path = base_path / mood
        mood_path.mkdir(exist_ok=True)
        
        # Create a README in each mood directory
        readme_path = mood_path / 'README.txt'
        with open(readme_path, 'w') as f:
            f.write(f"Place {mood.upper()} music files here\n")
            f.write("=" * 40 + "\n\n")
            
            if mood == 'energetic':
                f.write("Suggested genres:\n")
                f.write("- Pop\n")
                f.write("- Electronic/EDM\n")
                f.write("- Dance\n")
                f.write("- Upbeat songs\n")
            elif mood == 'calm':
                f.write("Suggested genres:\n")
                f.write("- Ambient\n")
                f.write("- Classical\n")
                f.write("- Chill\n")
                f.write("- Acoustic\n")
            elif mood == 'melancholic':
                f.write("Suggested genres:\n")
                f.write("- Blues\n")
                f.write("- Sad songs\n")
                f.write("- Slow ballads\n")
                f.write("- Emotional music\n")
            elif mood == 'intense':
                f.write("Suggested genres:\n")
                f.write("- Rock\n")
                f.write("- Metal\n")
                f.write("- Intense/Dramatic\n")
                f.write("- High-energy music\n")
            
            f.write("\nSupported formats: MP3, WAV, OGG, FLAC\n")
        
        print(f"✓ Created: {mood_path}")
    
    print("\n" + "=" * 50)
    print("Setup complete!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. Add music files to the mood subdirectories")
    print("2. Run: python deepj.py")
    print()


if __name__ == '__main__':
    setup_music_directory()
