export interface MusicSuggestion {
  mood: 'chilling' | 'focusing' | 'partying' | 'dancing' | 'uplifting' | 'background';
  energyLevel: number; // 1-10
  trackFilename: string;
}

// FIX: Add missing SpotifyTrack interface.
export interface SpotifyTrack {
  name: string;
  uri: string;
  artists: Array<{ name: string }>;
  album: {
    images: Array<{ url: string }>;
  };
}
