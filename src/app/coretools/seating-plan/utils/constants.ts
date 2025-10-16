import type { FurnitureTemplate } from '../types';

// Optimized canvas size - scaled up for better visibility
export const GRID_SIZE = 48;        // Increased for better readability
export const CANVAS_WIDTH = 1584;   // 33 grid squares × 48px
export const CANVAS_HEIGHT = 960;   // 20 grid squares × 48px

// Desk dimensions
export const DEFAULT_DESK_WIDTH = 192;  // 4 grid squares
export const DEFAULT_DESK_HEIGHT = 120; // 2.5 grid squares

export const GROUP_COLORS = [
  '#14b8a6', '#3b82f6', '#8b5cf6', '#d946ef', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#6366f1', '#06b6d4', '#84cc16', '#10b981',
];

export const FURNITURE_TEMPLATES: FurnitureTemplate[] = [
  {
    id: 'single-desk',
    name: 'Single Desk',
    icon: '🪑',
    desks: [{ x: 0, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT }]
  },
  {
    id: 'double-desk',
    name: 'Double Desk',
    icon: '🪑🪑',
    desks: [
      { x: 0, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT },
      { x: DEFAULT_DESK_WIDTH, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT }
    ]
  },
  {
    id: 'table-for-4',
    name: 'Table for 4',
    icon: '⬜',
    desks: [
      { x: 0, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT },
      { x: DEFAULT_DESK_WIDTH, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT },
      { x: 0, y: DEFAULT_DESK_HEIGHT, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT },
      { x: DEFAULT_DESK_WIDTH, y: DEFAULT_DESK_HEIGHT, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT }
    ]
  },
  {
    id: 'row-of-3',
    name: 'Row of 3',
    icon: '▬',
    desks: [
      { x: 0, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT },
      { x: DEFAULT_DESK_WIDTH, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT },
      { x: DEFAULT_DESK_WIDTH * 2, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT }
    ]
  },
  {
    id: 'row-of-4',
    name: 'Row of 4',
    icon: '▬▬',
    desks: [
      { x: 0, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT },
      { x: DEFAULT_DESK_WIDTH, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT },
      { x: DEFAULT_DESK_WIDTH * 2, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT },
      { x: DEFAULT_DESK_WIDTH * 3, y: 0, width: DEFAULT_DESK_WIDTH, height: DEFAULT_DESK_HEIGHT }
    ]
  }
];

// Teacher desk positioned at top center
export const DEFAULT_TEACHER_DESK = {
  x: (CANVAS_WIDTH - 288) / 2,
  y: 90,
  width: 288,
  height: 96
};

// Layout presets
export const PRESET_LAYOUTS = {
  COMPUTER_ROOM: {
    rows: 3,
    desksPerRow: 8,
    deskWidth: DEFAULT_DESK_WIDTH,
    deskHeight: DEFAULT_DESK_HEIGHT,
    gapBetweenGroups: 48, // 1 grid square gap
    rowGap: 72, // 1.5 grid squares
    startY: 228, // Leave space for teacher desk
  }
};
