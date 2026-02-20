// Generates branch paths and leaf positions for the SVG tree
// The tree grows with each new memory added

export interface Branch {
  path: string;
  id: string;
  level: number;
}

export interface LeafPosition {
  x: number;
  y: number;
  branchIndex: number;
}

// All branch paths for the tree — revealed progressively as memories grow
export const ALL_BRANCHES: Branch[] = [
  // Trunk
  { id: 'trunk', path: 'M 300 520 C 300 520 295 420 300 340', level: 0 },
  // Main left branch
  { id: 'b-left-1', path: 'M 300 340 C 280 310 230 290 190 270', level: 1 },
  // Main right branch
  { id: 'b-right-1', path: 'M 300 340 C 320 310 360 295 400 278', level: 1 },
  // Center up
  { id: 'b-center', path: 'M 300 340 C 302 310 298 280 300 250', level: 1 },
  // Left sub-branch
  { id: 'b-left-2', path: 'M 190 270 C 170 255 140 245 115 240', level: 2 },
  // Left upper
  { id: 'b-left-3', path: 'M 190 270 C 185 248 180 228 175 210', level: 2 },
  // Right sub-branch
  { id: 'b-right-2', path: 'M 400 278 C 420 262 448 255 470 250', level: 2 },
  // Right upper
  { id: 'b-right-3', path: 'M 400 278 C 405 255 408 232 408 215', level: 2 },
  // Center upper split left
  { id: 'b-top-left', path: 'M 300 250 C 280 235 258 225 240 215', level: 3 },
  // Center upper split right
  { id: 'b-top-right', path: 'M 300 250 C 320 235 342 225 360 215', level: 3 },
  // Tertiary branches
  { id: 'b-tl-1', path: 'M 240 215 C 222 205 205 198 190 195', level: 4 },
  { id: 'b-tl-2', path: 'M 240 215 C 238 200 235 185 232 172', level: 4 },
  { id: 'b-tr-1', path: 'M 360 215 C 375 205 388 198 400 194', level: 4 },
  { id: 'b-tr-2', path: 'M 360 215 C 362 200 366 185 368 172', level: 4 },
  { id: 'b-ll-1', path: 'M 115 240 C 100 230 85 225 72 222', level: 5 },
  { id: 'b-rr-1', path: 'M 470 250 C 485 240 498 234 510 230', level: 5 },
];

// How many branches to show based on memory count
export function getBranchCount(memoryCount: number): number {
  if (memoryCount === 0) return 1; // just trunk
  if (memoryCount === 1) return 3;
  if (memoryCount === 2) return 4;
  if (memoryCount === 3) return 6;
  if (memoryCount === 4) return 8;
  if (memoryCount === 5) return 10;
  if (memoryCount <= 7) return 12;
  if (memoryCount <= 10) return 14;
  return ALL_BRANCHES.length;
}

// Predefined leaf positions along branches
export const LEAF_POSITIONS: LeafPosition[] = [
  { x: 188, y: 268, branchIndex: 1 },
  { x: 400, y: 276, branchIndex: 2 },
  { x: 300, y: 248, branchIndex: 3 },
  { x: 113, y: 238, branchIndex: 4 },
  { x: 172, y: 207, branchIndex: 5 },
  { x: 468, y: 248, branchIndex: 6 },
  { x: 406, y: 213, branchIndex: 7 },
  { x: 238, y: 213, branchIndex: 8 },
  { x: 358, y: 213, branchIndex: 9 },
  { x: 188, y: 193, branchIndex: 10 },
  { x: 230, y: 170, branchIndex: 11 },
  { x: 398, y: 192, branchIndex: 12 },
  { x: 366, y: 170, branchIndex: 13 },
  { x: 70, y: 220, branchIndex: 14 },
  { x: 508, y: 228, branchIndex: 15 },
  // Extra positions scattered around canopy
  { x: 155, y: 225, branchIndex: 4 },
  { x: 260, y: 200, branchIndex: 8 },
  { x: 340, y: 200, branchIndex: 9 },
  { x: 210, y: 250, branchIndex: 1 },
  { x: 385, y: 255, branchIndex: 2 },
];

export function getLeafPosition(index: number): LeafPosition {
  return LEAF_POSITIONS[index % LEAF_POSITIONS.length];
}
