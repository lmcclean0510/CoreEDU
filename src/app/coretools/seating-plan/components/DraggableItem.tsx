import React, { memo, useCallback, useMemo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, GripVertical, Armchair, UserPlus, Lock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Desk, Group, Student } from '../types';

interface DraggableItemProps {
  desk: Desk & { studentInfo?: Student };
  deskIndex: number;
  group?: Group;
  unassignedStudents: Student[];
  onRemove: () => void;
  onToggleExclude: () => void;
  onManualAssign: (deskId: number, studentName: string | null) => void;
  isLayoutMode: boolean;
  isRulesMode: boolean;
  isExcluded: boolean;
  areIndicatorsVisible: boolean;
}

const DraggableItem = memo(({ 
  desk, 
  deskIndex, 
  group, 
  unassignedStudents,
  onRemove, 
  onToggleExclude, 
  onManualAssign,
  isLayoutMode, 
  isRulesMode, 
  isExcluded,
  areIndicatorsVisible
}: DraggableItemProps) => {
  const {
    attributes: dragHandleAttributes, 
    listeners: dragHandleListeners, 
    setNodeRef: setDraggableNodeRef, 
    transform
  } = useDraggable({
    id: desk.id,
    data: { isGroup: !!group },
    disabled: !isLayoutMode,
  });

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: desk.id,
    disabled: !isLayoutMode,
  });

  const style = useMemo(() => transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    position: 'absolute' as const,
    left: desk.x,
    top: desk.y,
    zIndex: 10,
  } : {
    position: 'absolute' as const,
    left: desk.x,
    top: desk.y,
  }, [transform, desk.x, desk.y]);
  
  const isGrouped = !!group;
  const borderColor = group ? group.color : 'hsl(var(--primary))';

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  }, [onRemove]);

  const handleToggleExclude = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExclude();
  }, [onToggleExclude]);

  const handleAssignClick = useCallback((studentName: string | null) => {
      onManualAssign(desk.id, studentName);
  }, [desk.id, onManualAssign]);

  const nameParts = useMemo(() => {
    if (desk.student) {
      return desk.student.split(' ');
    }
    return [];
  }, [desk.student]);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  return (
    <div
      ref={(node) => { setDraggableNodeRef(node); setDroppableRef(node); }}
      style={style}
    >
        <div
            className={cn(
              "relative group border-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 shadow-sm select-none desk-bw",
              isOver && "outline-dashed outline-2 outline-offset-2 outline-primary",
              isExcluded && "bg-destructive/10 !border-destructive opacity-70",
              !isExcluded && 'bg-card shadow-md',
              'text-foreground'
            )}
            style={{ 
              width: desk.width, 
              height: desk.height,
              borderColor: isExcluded ? 'hsl(var(--destructive))' : borderColor,
            }}
            title={isGrouped ? `${group.name}` : 'Drag to move'}
        >
            <div className="flex-1 flex items-center justify-center p-1 w-full">
              <div className="text-center">
                <div className="font-semibold text-xs leading-relaxed flex flex-col items-center gap-0">
                    {desk.isLocked && <Lock className="w-3 h-3 text-muted-foreground absolute top-1 left-1" />}
                    {isExcluded ? (
                      <span>Not in use</span>
                    ) : desk.student ? (
                       <div className="flex flex-col text-center">
                         <span>{firstName}</span>
                         {lastName && <span>{lastName}</span>}
                       </div>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                </div>
              </div>
            </div>
            {areIndicatorsVisible && desk.studentInfo?.gender && (
              <Badge variant="secondary" className="absolute bottom-1 left-1 px-1.5 py-0.5 text-xs font-bold leading-none">
                {desk.studentInfo.gender === 'male' ? 'M' : 'F'}
              </Badge>
            )}
            {areIndicatorsVisible && desk.studentInfo?.isSEND && !isExcluded && (
              <Badge variant="destructive" className="absolute bottom-1 right-1 px-1.5 py-0.5 text-xs font-bold leading-none">
                K
              </Badge>
            )}
            {isLayoutMode && (
              <div {...dragHandleAttributes} {...dragHandleListeners} className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center bg-muted/30 rounded-l-md cursor-grab active:cursor-grabbing">
                <GripVertical className="text-muted-foreground" />
              </div>
            )}
            {isLayoutMode && onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-destructive hover:bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                  onClick={handleRemove}
                >
                  <X className="w-3 h-3" />
                </Button>
            )}
            {isRulesMode && !isExcluded && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -bottom-2 -left-2 h-6 w-6 p-0 rounded-full shadow-lg z-10 bg-card text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    title={desk.isLocked ? "Unlock and unassign student" : "Manually assign student"}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-2">
                    <div className="space-y-2">
                        <p className="font-semibold text-sm text-center">Assign Student</p>
                        {desk.isLocked && (
                             <Button variant="destructive" size="sm" className="w-full" onClick={() => handleAssignClick(null)}>
                                Unassign Student
                             </Button>
                        )}
                        <ScrollArea className="h-48">
                            <div className="space-y-1">
                                {unassignedStudents.map(student => (
                                    <Button
                                        key={student.id}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => handleAssignClick(student.name)}
                                    >
                                        {student.name}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </PopoverContent>
              </Popover>
            )}
             {isRulesMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "absolute -bottom-2 h-6 w-6 p-0 rounded-full shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity",
                    isExcluded ? "bg-destructive text-destructive-foreground hover:bg-destructive/80" : "bg-card text-muted-foreground hover:bg-muted",
                     isExcluded ? "left-1/2 -translate-x-1/2" : "-right-2"
                  )}
                  onClick={handleToggleExclude}
                  title={isExcluded ? 'Mark as usable' : 'Mark as not in use'}
                >
                  <Armchair className="w-4 h-4" />
                </Button>
            )}
            {isLayoutMode && (
              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-accent rounded-full text-white text-[10px] flex items-center justify-center shadow font-bold z-10">
                {deskIndex + 1}
              </div>
            )}
        </div>
    </div>
  );
});

DraggableItem.displayName = 'DraggableItem';

export default DraggableItem;
