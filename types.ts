export interface MusicSuggestion {
  mood: 'chilling' | 'focusing' | 'partying' | 'happy' | 'sad';
  energyLevel: number; // 1-10
  trackFilename: string;
  genre?: string; // Selected genre from LLM
}

export interface Prompt {
  promptId: string;
  text: string;
  weight: number;
  color?: string;
  cc?: number;
}

export type PlaybackState = 'stopped' | 'playing' | 'loading' | 'paused';
