export type Emotion = 'Normal' | 'Happy' | 'Sad' | 'Special';

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export interface Memory {
  id: string;
  imageUrl: string;
  imageUrls: string[];
  isCollection: boolean;
  description: string;
  emotion: Emotion;
  timestamp: Date;
  memoryDate: string; // ISO date string: YYYY-MM-DD
  connections?: string[]; // Tagged connections
}

export interface UserProfile {
  name: string;
  birthdate: string; // YYYY-MM-DD
  age: number;
  connections: string[];
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

export function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

export function isBirthdayToday(birthdate: string): boolean {
  const birth = new Date(birthdate + 'T00:00:00');
  const today = new Date();
  return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
}

export function isTreeHealthy(memories: Memory[]): boolean {
  if (memories.length === 0) return true; // no memories yet, show vibrant
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return memories.some((m) => new Date(m.timestamp) >= thirtyDaysAgo);
}
