
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import { useClassManagement } from '@/hooks/teacher/use-class-management';
import { useToast } from '@/hooks/shared/use-toast';
import type { ClassInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DeleteClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  classInfo: ClassInfo;
}

const HOLD_DURATION_MS = 3000;

export function DeleteClassDialog({
  isOpen,
  onClose,
  onDeleted,
  classInfo,
}: DeleteClassDialogProps) {
  const { deleteClass } = useClassManagement();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset state when the dialog is closed or opened
    if (!isOpen) {
      setIsDeleting(false);
      setHoldProgress(0);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    }
  }, [isOpen]);

  const handleHoldStart = () => {
    if (isDeleting) return;

    holdIntervalRef.current = setInterval(() => {
        setHoldProgress(prev => Math.min(prev + 10, 100));
    }, HOLD_DURATION_MS / 100);

    holdTimeoutRef.current = setTimeout(handleDelete, HOLD_DURATION_MS);
  };

  const handleHoldEnd = () => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await deleteClass(classInfo.id);
      toast({
        title: 'Class Deleted',
        description: `The class "${classInfo.className}" and all its data have been permanently removed.`,
      });
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the class. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center mt-4">
            Permanently Delete Class?
          </DialogTitle>
          <DialogDescription className="text-center">
            You are about to delete <strong className="text-foreground">{classInfo.className}</strong>. This is irreversible.
            This will also delete all associated homework and student progress data for this class.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center mt-4 gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            className="relative overflow-hidden"
          >
            {isDeleting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
                <span>Hold to Delete</span>
            )}
            <div
                className={cn(
                    "absolute inset-0 bg-white/30 transition-all duration-100",
                )}
                style={{ width: `${holdProgress}%` }}
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
