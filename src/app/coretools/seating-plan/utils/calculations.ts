import type { Desk, Group } from '../types';
import { GRID_SIZE } from './constants';

export const getAdjacentDeskIds = (
  deskId: number, 
  allDesks: Desk[], 
  getDeskGroup: (id: number) => Group | undefined
): number[] => {
  const adjacentIds = new Set<number>();
  const desk = allDesks.find(d => d.id === deskId);
  if (!desk) return [];

  const deskGroup = getDeskGroup(deskId);
  if (deskGroup) {
    deskGroup.deskIds.forEach(id => {
      if (id !== deskId) adjacentIds.add(id);
    });
  }

  const threshold = 120;
  allDesks.forEach(otherDesk => {
    if (otherDesk.id === desk.id) return;

    const centers = {
      d1: { x: desk.x + desk.width / 2, y: desk.y + desk.height / 2 },
      d2: { x: otherDesk.x + otherDesk.width / 2, y: otherDesk.y + otherDesk.height / 2 },
    };
    const distance = Math.sqrt(
      Math.pow(centers.d1.x - centers.d2.x, 2) + Math.pow(centers.d1.y - centers.d2.y, 2)
    );

    if (distance < threshold) {
      adjacentIds.add(otherDesk.id);
    }
  });

  return Array.from(adjacentIds);
};

export const alignToGrid = <T extends { x: number; y: number; width: number; height: number }>(
  item: T,
  containerWidth: number,
  containerHeight: number
): T => {
  const newX = Math.round(item.x / GRID_SIZE) * GRID_SIZE;
  const newY = Math.round(item.y / GRID_SIZE) * GRID_SIZE;
  const boundedX = Math.max(0, Math.min(newX, containerWidth - item.width));
  const boundedY = Math.max(0, Math.min(newY, containerHeight - item.height));
  return { ...item, x: boundedX, y: boundedY };
};

export const sortDesksByPosition = (desks: Desk[]): Desk[] => {
  return [...desks].sort((a, b) => {
    if (a.y < b.y) return -1;
    if (a.y > b.y) return 1;
    if (a.x < b.x) return -1;
    if (a.x > b.x) return 1;
    return 0;
  });
};

export const getGroupBounds = (groupDesks: Desk[]) => {
  if (groupDesks.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  groupDesks.forEach(d => {
    minX = Math.min(minX, d.x);
    minY = Math.min(minY, d.y);
    maxX = Math.max(maxX, d.x + d.width);
    maxY = Math.max(maxY, d.y + d.height);
  });

  return { minX, minY, maxX, maxY };
};

export const constrainGroupMovement = (
  delta: { x: number; y: number },
  groupBounds: { minX: number; minY: number; maxX: number; maxY: number },
  containerRect: { width: number; height: number }
) => {
  const futureMinX = groupBounds.minX + delta.x;
  const futureMaxX = groupBounds.maxX + delta.x;
  const futureMinY = groupBounds.minY + delta.y;
  const futureMaxY = groupBounds.maxY + delta.y;
  
  let constrainedDeltaX = delta.x;
  let constrainedDeltaY = delta.y;

  if (futureMinX < 0) constrainedDeltaX = -groupBounds.minX;
  else if (futureMaxX > containerRect.width) constrainedDeltaX = containerRect.width - groupBounds.maxX;

  if (futureMinY < 0) constrainedDeltaY = -groupBounds.minY;
  else if (futureMaxY > containerRect.height) constrainedDeltaY = containerRect.height - groupBounds.maxY;

  return { x: constrainedDeltaX, y: constrainedDeltaY };
};
