export type Emotion = 'Normal' | 'Happy' | 'Sad' | 'Special';

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export interface Memory {
  id: string;
  imageUrl: string;
  description: string;
  emotion: Emotion;
  timestamp: Date;
  memoryDate: string; // ISO date string: YYYY-MM-DD
}

export function getSeason(dateStr: string): Season {
  const month = new Date(dateStr + 'T00:00:00').getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Autumn';
  return 'Winter';
}

export function getYear(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getFullYear();
}
