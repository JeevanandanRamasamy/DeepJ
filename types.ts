export interface MusicSuggestion {
  mood: 'chilling' | 'focusing' | 'partying' | 'happy' | 'sad';
  energyLevel: number; // 1-10
  trackFilename: string;
}