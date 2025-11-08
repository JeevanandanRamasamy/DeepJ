export interface MusicSuggestion {
  mood: 'chilling' | 'focusing' | 'partying' | 'dancing' | 'uplifting' | 'background';
  energyLevel: number; // 1-10
  trackFilename: string;
}