import { Memory, Season, getSeason } from '@/types/memory';

export interface SeasonTheme {
  season: Season;
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
  fogColor: string;
  groundColor: string;
  skyGradient: [string, string];
}

const SEASON_THEMES: Record<Season, SeasonTheme> = {
  Spring: {
    season: 'Spring',
    ambientColor: '#88cc88',
    ambientIntensity: 0.6,
    directionalColor: '#ffeedd',
    directionalIntensity: 1.2,
    fogColor: '#1a2e1a',
    groundColor: '#1a3318',
    skyGradient: ['hsl(150 18% 8%)', 'hsl(140 25% 12%)'],
  },
  Summer: {
    season: 'Summer',
    ambientColor: '#ffffaa',
    ambientIntensity: 0.7,
    directionalColor: '#fff5cc',
    directionalIntensity: 1.5,
    fogColor: '#1e2e18',
    groundColor: '#1a3010',
    skyGradient: ['hsl(200 20% 10%)', 'hsl(160 20% 12%)'],
  },
  Autumn: {
    season: 'Autumn',
    ambientColor: '#cc9955',
    ambientIntensity: 0.5,
    directionalColor: '#ffcc88',
    directionalIntensity: 1.0,
    fogColor: '#2a1e10',
    groundColor: '#2a1e0e',
    skyGradient: ['hsl(25 20% 10%)', 'hsl(30 18% 8%)'],
  },
  Winter: {
    season: 'Winter',
    ambientColor: '#8899cc',
    ambientIntensity: 0.4,
    directionalColor: '#bbccee',
    directionalIntensity: 0.8,
    fogColor: '#181e28',
    groundColor: '#151a22',
    skyGradient: ['hsl(220 20% 10%)', 'hsl(210 18% 8%)'],
  },
};

export function getDominantSeason(memories: Memory[]): Season {
  if (memories.length === 0) return 'Spring';
  const counts: Record<Season, number> = { Spring: 0, Summer: 0, Autumn: 0, Winter: 0 };
  for (const m of memories) {
    counts[getSeason(m.memoryDate)]++;
  }
  let max: Season = 'Spring';
  for (const s of Object.keys(counts) as Season[]) {
    if (counts[s] > counts[max]) max = s;
  }
  return max;
}

export function getSeasonTheme(memories: Memory[]): SeasonTheme {
  return SEASON_THEMES[getDominantSeason(memories)];
}
