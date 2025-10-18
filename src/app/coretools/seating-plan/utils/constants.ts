import type { FurnitureTemplate } from '../types';

// Optimized canvas size - scaled up for better visibility
export const GRID_SIZE = 48;        // Increased for better readability
export const CANVAS_WIDTH = 2016;   // 42 grid squares × 48px (wider for better fit)
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
    id: 'teacher-desk',
    name: "Teacher's Desk",
    icon: '🧑‍🏫',
    isTeacherDesk: true,
    desks: []
  },
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

// Layout presets - Common UK classroom layouts
export const PRESET_LAYOUTS = {
  PRESET_1: {
    name: 'Preset 1 - Rows (32 desks)',
    rows: 4,
    desksPerRow: 8,
    deskWidth: DEFAULT_DESK_WIDTH,
    deskHeight: DEFAULT_DESK_HEIGHT,
    gapBetweenGroups: 48, // 1 grid square gap between left/right
    rowGap: 72, // 1.5 grid squares between rows
    startY: 228, // Leave space for teacher desk
    layout: 'rows' // 4 rows of 8 (split into 4+4)
  },
  PRESET_2: {
    name: 'Preset 2 - Groups (24 desks)',
    rows: 4,
    desksPerRow: 6,
    deskWidth: DEFAULT_DESK_WIDTH,
    deskHeight: DEFAULT_DESK_HEIGHT,
    gapBetweenGroups: 96, // 2 grid squares - larger gap for group work
    rowGap: 96, // 2 grid squares between rows
    startY: 228,
    layout: 'groups' // 4 groups of 6 desks (3+3)
  },
  PRESET_3: {
    name: 'Preset 3 - U-Shape (20 desks)',
    deskWidth: DEFAULT_DESK_WIDTH,
    deskHeight: DEFAULT_DESK_HEIGHT,
    layout: 'u-shape' // Desks arranged in U-shape
  },
  PRESET_4: {
    name: 'Preset 4 - Tables (24 desks)',
    rows: 3,
    columns: 4,
    deskWidth: DEFAULT_DESK_WIDTH,
    deskHeight: DEFAULT_DESK_HEIGHT,
    gapBetweenTables: 96, // 2 grid squares between tables
    rowGap: 96,
    startY: 228,
    layout: 'tables' // 6 tables of 4 desks each
  },
  PRESET_5: {
    name: 'Preset 5 - Horseshoe (18 desks)',
    deskWidth: DEFAULT_DESK_WIDTH,
    deskHeight: DEFAULT_DESK_HEIGHT,
    layout: 'horseshoe' // Horseshoe/semicircle arrangement
  }
};
