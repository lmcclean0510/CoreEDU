import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { GROUP_COLORS } from '../utils/constants';

interface GroupLayoutInfo {
  id: number;
  name: string;
  color: string;
  x: number;
  y: number;
}

interface GroupControlProps {
  group: GroupLayoutInfo;
  isVisible: boolean;
  onRename: (groupId: number, newName: string) => void;
  onSetColor: (groupId: number, color: string) => void;
  onDelete: (groupId: number) => void;
}

const GroupControl = memo(({ group, isVisible, onRename, onSetColor, onDelete }: GroupControlProps) => {
  const handleRename = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onRename(group.id, e.target.value);
  }, [group.id, onRename]);

  const handleColorChange = useCallback((color: string) => {
    onSetColor(group.id, color);
  }, [group.id, onSetColor]);

  const handleDelete = useCallback(() => {
    onDelete(group.id);
  }, [group.id, onDelete]);

  if (!isVisible) return null;

  return (
    <div
        className="group-control-popover absolute z-20 p-1 bg-card border rounded-lg shadow-lg flex items-center gap-1 transition-opacity duration-200 opacity-100"
        style={{ left: group.x, top: group.y - 50 }}
    >
        <Input
            type="text"
            value={group.name}
            onChange={handleRename}
            className="h-7 text-xs w-28"
            onClick={e => e.stopPropagation()}
        />
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Palette className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-6 gap-1">
                    {GROUP_COLORS.map(color => (
                        <Button
                            key={color}
                            size="icon"
                            variant="outline"
                            className={cn("h-6 w-6 rounded-full", group.color === color && "ring-2 ring-primary ring-offset-2")}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorChange(color)}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
         <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{group.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove the group and all desks within it. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
});

GroupControl.displayName = 'GroupControl';

export default GroupControl;