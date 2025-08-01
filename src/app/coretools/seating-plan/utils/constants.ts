import type { FurnitureTemplate } from '../types';

export const GROUP_COLORS = [
  '#14b8a6', '#3b82f6', '#8b5cf6', '#d946ef', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#6366f1', '#06b6d4', '#84cc16', '#10b981',
];

export const GRID_SIZE = 40;

export const FURNITURE_TEMPLATES: FurnitureTemplate[] = [
  {
    id: 'single-desk',
    name: 'Single Desk',
    icon: '🪑',
    desks: [{ x: 0, y: 0, width: 120, height: 80 }]
  },
  {
    id: 'double-desk',
    name: 'Double Desk',
    icon: '🪑🪑',
    desks: [
      { x: 0, y: 0, width: 120, height: 80 },
      { x: 120, y: 0, width: 120, height: 80 }
    ]
  },
  {
    id: 'table-for-4',
    name: 'Table for 4',
    icon: '⬜',
    desks: [
      { x: 0, y: 0, width: 120, height: 80 },
      { x: 120, y: 0, width: 120, height: 80 },
      { x: 0, y: 80, width: 120, height: 80 },
      { x: 120, y: 80, width: 120, height: 80 }
    ]
  },
  {
    id: 'row-of-3',
    name: 'Row of 3',
    icon: '▬',
    desks: [
      { x: 0, y: 0, width: 120, height: 80 },
      { x: 120, y: 0, width: 120, height: 80 },
      { x: 240, y: 0, width: 120, height: 80 }
    ]
  },
  {
    id: 'row-of-4',
    name: 'Row of 4',
    icon: '▬▬',
    desks: [
      { x: 0, y: 0, width: 120, height: 80 },
      { x: 120, y: 0, width: 120, height: 80 },
      { x: 240, y: 0, width: 120, height: 80 },
      { x: 360, y: 0, width: 120, height: 80 }
    ]
  }
];

export const DEFAULT_TEACHER_DESK = {
  x: (1403 - 160) / 2,
  y: 20,
  width: 160,
  height: 80
};
