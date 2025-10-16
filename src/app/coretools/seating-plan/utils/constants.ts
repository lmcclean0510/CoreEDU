import type { FurnitureTemplate } from '../types';

// Optimized canvas size - 33x20 grid squares at 40px each for maximum readability
export const GRID_SIZE = 40;        // Increased from 36px for even better readability
export const CANVAS_WIDTH = 1320;   // 33 grid squares × 40px
export const CANVAS_HEIGHT = 800;   // 20 grid squares × 40px

// Desk dimensions
export const DEFAULT_DESK_WIDTH = 160;  // 4 grid squares
export const DEFAULT_DESK_HEIGHT = 100; // 2.5 grid squares

export const GROUP_COLORS = [
  '#14b8a6', '#3b82f6', '#8b5cf6', '#d946ef', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#6366f1', '#06b6d4', '#84cc16', '#10b981',
];

export const FURNITURE_TEMPLATES: FurnitureTemplate[] = [
  {
    id: 'single-desk',
    name: 'Single Desk',
    icon: '🪑',
    desks: [{ x: 0, y: 0, width: 128, height: 80 }]
  },
  {
    id: 'double-desk',
    name: 'Double Desk',
    icon: '🪑🪑',
    desks: [
      { x: 0, y: 0, width: 128, height: 80 },
      { x: 128, y: 0, width: 128, height: 80 }
    ]
  },
  {
    id: 'table-for-4',
    name: 'Table for 4',
    icon: '⬜',
    desks: [
      { x: 0, y: 0, width: 128, height: 80 },
      { x: 128, y: 0, width: 128, height: 80 },
      { x: 0, y: 80, width: 128, height: 80 },
      { x: 128, y: 80, width: 128, height: 80 }
    ]
  },
  {
    id: 'row-of-3',
    name: 'Row of 3',
    icon: '▬',
    desks: [
      { x: 0, y: 0, width: 128, height: 80 },
      { x: 128, y: 0, width: 128, height: 80 },
      { x: 256, y: 0, width: 128, height: 80 }
    ]
  },
  {
    id: 'row-of-4',
    name: 'Row of 4',
    icon: '▬▬',
    desks: [
      { x: 0, y: 0, width: 128, height: 80 },
      { x: 128, y: 0, width: 128, height: 80 },
      { x: 256, y: 0, width: 128, height: 80 },
      { x: 384, y: 0, width: 128, height: 80 }
    ]
  }
];

// Teacher desk positioned at top center
export const DEFAULT_TEACHER_DESK = {
  x: (CANVAS_WIDTH - 240) / 2,
  y: 76,
  width: 240,
  height: 80
};

// Layout presets
export const PRESET_LAYOUTS = {
  COMPUTER_ROOM: {
    rows: 3,
    desksPerRow: 8,
    deskWidth: DEFAULT_DESK_WIDTH,
    deskHeight: DEFAULT_DESK_HEIGHT,
    gapBetweenGroups: 40, // 1 grid square gap
    rowGap: 60, // 1.5 grid squares
    startY: 190, // Leave space for teacher desk
  }
};
