export type Emotion = 'Normal' | 'Happy' | 'Sad' | 'Special';

export interface Memory {
  id: string;
  imageUrl: string;
  description: string;
  emotion: Emotion;
  timestamp: Date;
}
