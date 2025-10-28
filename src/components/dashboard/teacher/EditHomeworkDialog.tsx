"use client";

import { useEffect, useMemo, useState } from 'react';
import { Calendar, LoaderCircle, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DueDateBadge } from '@/components/shared/DueDateBadge';
import type { TeacherHomeworkSummary } from '@/hooks/teacher/use-teacher-homeworks';

interface EditHomeworkDialogProps {
  open: boolean;
  onClose: () => void;
  summary: TeacherHomeworkSummary | null;
  onSave: (params: {
    title: string;
    instructions?: string | null;
    dueDate?: string | null;
  }) => Promise<void>;
  onRemoveDueDate?: () => Promise<void>;
}

const toDateInputString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateToInputValue = (value?: any): string => {
  if (!value) return '';
  try {
    if (value && typeof value.toDate === 'function') {
      return toDateInputString(value.toDate());
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return toDateInputString(date);
  } catch {
    return '';
  }
};

export function EditHomeworkDialog({
  open,
  onClose,
  summary,
  onSave,
  onRemoveDueDate,
}: EditHomeworkDialogProps) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && summary) {
      setTitle(summary.homework.title ?? '');
      setInstructions(summary.homework.instructions ?? '');
      setDueDate(dateToInputValue(summary.homework.dueDate));
      setError(null);
    } else if (!open) {
      setTitle('');
      setInstructions('');
      setDueDate('');
      setError(null);
    }
  }, [open, summary]);

  const classMeta = useMemo(() => {
    if (!summary?.classInfo) return null;
    return {
      name: summary.classInfo.className,
      subject: summary.classInfo.subject,
      students: summary.classInfo.studentUids?.length ?? 0,
    };
  }, [summary]);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return toDateInputString(now);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!summary) return;

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const trimmedInstructions = instructions.trim();
      const instructionPayload =
        trimmedInstructions.length > 0
          ? trimmedInstructions
          : summary.homework.instructions
            ? null
            : undefined;

      await onSave({
        title: title.trim(),
        instructions: instructionPayload,
        dueDate: dueDate ? dueDate : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Unable to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDueDate = async () => {
    if (!summary || !onRemoveDueDate) return;
    setIsSaving(true);
    setError(null);
    try {
      await onRemoveDueDate();
      setDueDate('');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to clear the due date.');
    } finally {
      setIsSaving(false);
    }
  };

  const isDueDateInPast =
    dueDate && new Date(dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            Edit Homework
          </DialogTitle>
          <DialogDescription>
            Update the homework title and due date. Students will see these changes immediately.
          </DialogDescription>
        </DialogHeader>

        {summary && (
          <div className="space-y-5">
            <div className="rounded-lg border bg-muted/50 px-4 py-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {summary.homework.title}
                </span>
                {summary.homework.dueDate && (
                  <DueDateBadge
                    dueDate={summary.homework.dueDate}
                    variant="compact"
                    className="w-fit"
                  />
                )}
                {classMeta && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge
                      variant="outline"
                      className="border-muted-foreground/20 text-muted-foreground"
                    >
                      {classMeta.name}
                    </Badge>
                    {classMeta.subject && <span>{classMeta.subject}</span>}
                    <span>{classMeta.students} students</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="edit-homework-title">Homework title</Label>
                <Input
                  id="edit-homework-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  minLength={3}
                  maxLength={120}
                  placeholder="e.g., Algorithms recap"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-homework-instructions">
                  Instructions <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="edit-homework-instructions"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Add a note for your class..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-homework-due-date">
                  Due date <span className="text-muted-foreground">(optional)</span>
                </Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="edit-homework-due-date"
                    type="date"
                    className={cn('pl-10', isDueDateInPast && 'border-destructive')}
                    value={dueDate}
                    min={today}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </div>
                {isDueDateInPast && (
                  <p className="text-xs text-destructive">
                    The selected date is in the past. Students may already see this homework as overdue.
                  </p>
                )}
                {summary.homework.dueDate && onRemoveDueDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={handleRemoveDueDate}
                    disabled={isSaving}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Remove due date
                  </Button>
                )}
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
