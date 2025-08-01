import React, { memo, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Desk } from '../types';

interface SortableDeskItemProps {
  desk: Desk;
}

const SortableDeskItem = memo(({ desk }: SortableDeskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: desk.id });

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
  }), [transform, transition]);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg cursor-grab active:cursor-grabbing">
      <GripVertical className="text-muted-foreground" />
      <span className="text-xs font-medium">{desk.student || 'Empty Desk'}</span>
    </div>
  );
});

SortableDeskItem.displayName = 'SortableDeskItem';

export default SortableDeskItem;