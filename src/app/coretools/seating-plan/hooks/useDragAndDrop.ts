import { useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { getGroupBounds, constrainGroupMovement, alignToGrid } from '../utils/calculations';
import { GROUP_COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import type { Desk, Group, TeacherDesk } from '../types';

export const useDragAndDrop = (scale: number = 1) => {
  const handleDragEnd = useCallback((
    event: DragEndEvent,
    desks: Desk[],
    groups: Group[],
    containerRef: React.RefObject<HTMLElement>,
    getDeskGroup: (id: number) => Group | undefined,
    setDesks: (updater: (prev: Desk[]) => Desk[]) => void,
    setGroups: (updater: (prev: Group[]) => Group[]) => void,
    setTeacherDesk: (updater: (prev: TeacherDesk | null) => TeacherDesk | null) => void
  ) => {
    const { active, delta, over } = event;
    const activeId = active.id;
    const overId = over ? over.id : null;
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const canvasWidth = containerEl.offsetWidth || CANVAS_WIDTH;
    const canvasHeight = containerEl.offsetHeight || CANVAS_HEIGHT;

    const scaledDelta = {
        x: delta.x / scale,
        y: delta.y / scale,
    };

    if (activeId === 'teacher-desk') {
        setTeacherDesk(prev => {
            if (!prev) return null;
            const newX = prev.x + scaledDelta.x;
            const newY = prev.y + scaledDelta.y;
            const boundedX = Math.max(0, Math.min(newX, canvasWidth - prev.width));
            const boundedY = Math.max(0, Math.min(newY, canvasHeight - prev.height));
            return { ...prev, x: boundedX, y: boundedY };
        });
        return;
    }

    const activeDesk = desks.find(d => d.id === activeId);
    if (!activeDesk) return;

    const activeGroup = getDeskGroup(activeId as number);

    if (overId && activeId !== overId && !activeGroup) {
      const overDesk = desks.find(d => d.id === overId);
      if (overDesk) {
        const newX = activeDesk.x + scaledDelta.x;
        const newY = activeDesk.y + scaledDelta.y;

        setDesks(prev => prev.map(d => d.id === activeId ? { ...d, x: newX, y: newY } : d));

        const overGroup = getDeskGroup(overId as number);
        if (overGroup) {
          setGroups(prev => prev.map(g => g.id === overGroup.id ? { ...g, deskIds: [...g.deskIds, activeId as number] } : g));
        } else {
          const newGroupId = Date.now();
          const newGroup = { 
              id: newGroupId, 
              deskIds: [overId as number, activeId as number], 
              name: 'Desk Group', 
              color: GROUP_COLORS[groups.length % GROUP_COLORS.length] 
          };
          setGroups(prev => [...prev, newGroup]);
        }
        return;
      }
    }
    
    if (activeGroup) {
      const groupDesks = desks.filter(d => activeGroup.deskIds.includes(d.id));
      const groupBounds = getGroupBounds(groupDesks);
      
      if (groupBounds) {
        const constrainedDelta = constrainGroupMovement(
          scaledDelta, 
          groupBounds, 
          { width: canvasWidth, height: canvasHeight }
        );
        
        setDesks(prevDesks => prevDesks.map(desk => {
          if (activeGroup.deskIds.includes(desk.id)) {
            return { ...desk, x: desk.x + constrainedDelta.x, y: desk.y + constrainedDelta.y };
          }
          return desk;
        }));
      }
    } else {
      setDesks(prevDesks => prevDesks.map(desk => {
        if (desk.id === activeId) {
          const newX = desk.x + scaledDelta.x;
          const newY = desk.y + scaledDelta.y;
          const boundedX = Math.max(0, Math.min(newX, canvasWidth - desk.width));
          const boundedY = Math.max(0, Math.min(newY, canvasHeight - desk.height));
          return { ...desk, x: boundedX, y: boundedY };
        }
        return desk;
      }));
    }
  }, [scale]);

  const handleDeskOrderDragEnd = useCallback((
    event: DragEndEvent,
    setDesks: (updater: (prev: Desk[]) => Desk[]) => void
  ) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDesks((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleAutoAlign = useCallback((
    containerRef: React.RefObject<HTMLElement>,
    setDesks: (updater: (prev: Desk[]) => Desk[]) => void,
    setTeacherDesk: (updater: (prev: TeacherDesk | null) => TeacherDesk | null) => void
  ) => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const canvasWidth = containerEl.offsetWidth || CANVAS_WIDTH;
    const canvasHeight = containerEl.offsetHeight || CANVAS_HEIGHT;

    setDesks(prev => prev.map(desk => alignToGrid(desk, canvasWidth, canvasHeight)));
    setTeacherDesk(prev => prev ? alignToGrid(prev, canvasWidth, canvasHeight) : null);
  }, []);

  return { handleDragEnd, handleDeskOrderDragEnd, handleAutoAlign };
};
