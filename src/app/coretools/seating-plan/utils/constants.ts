import type { FurnitureTemplate } from '../types';

export const GRID_SIZE = 32;
export const CANVAS_WIDTH = GRID_SIZE * 150; // 150 grid squares wide = 4800px (VERY wide for auto-fit)
export const CANVAS_HEIGHT = GRID_SIZE * 28; // 28 grid squares tall = 896px (manageable height)

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

export const DEFAULT_TEACHER_DESK = {
  x: (CANVAS_WIDTH - 192) / 2,
  y: 32,
  width: 192,
  height: 64
};
