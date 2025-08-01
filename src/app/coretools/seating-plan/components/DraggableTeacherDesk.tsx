import React, { memo, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeacherDesk } from '../types';

interface DraggableTeacherDeskProps extends TeacherDesk {
  isLayoutMode: boolean;
}

const DraggableTeacherDesk = memo(({ x, y, width, height, isLayoutMode }: DraggableTeacherDeskProps) => {
    const {
        attributes: dragHandleAttributes, 
        listeners: dragHandleListeners, 
        setNodeRef, 
        transform
    } = useDraggable({ 
      id: 'teacher-desk',
      disabled: !isLayoutMode,
    });
    
    const style = useMemo(() => transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        position: 'absolute' as const,
        left: x,
        top: y,
    } : {
        position: 'absolute' as const,
        left: x,
        top: y,
    }, [transform, x, y]);
    
    return (
        <div ref={setNodeRef} style={style}>
            <div
              className={cn(
                "border-2 rounded-lg flex items-center justify-start text-sm font-medium transition-shadow duration-200 shadow-sm select-none teacher-desk-bw",
                "bg-primary text-primary-foreground",
                isLayoutMode && "hover:bg-primary/90",
              )}
              style={{ width, height, borderColor: 'hsl(var(--primary))' }}
            >
                {isLayoutMode && (
                  <div {...dragHandleAttributes} {...dragHandleListeners} className="p-1 h-full flex items-center bg-muted/30 rounded-l-md cursor-grab active:cursor-grabbing">
                      <GripVertical className="text-white/70" />
                  </div>
                )}
                <div className="flex-1 text-center">
                    Teacher's Desk
                </div>
            </div>
        </div>
    );
});

DraggableTeacherDesk.displayName = 'DraggableTeacherDesk';

export default DraggableTeacherDesk;