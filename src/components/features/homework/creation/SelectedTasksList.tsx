import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, GripVertical, BookOpen, Puzzle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomeworkTask } from '@/lib/types';

interface SelectedTasksListProps {
  tasks: HomeworkTask[];
  onRemoveTask: (taskId: string) => void;
  onReorderTasks: (fromIndex: number, toIndex: number) => void;
  onClearAll: () => void;
}

export function SelectedTasksList({
  tasks,
  onRemoveTask,
  onReorderTasks,
  onClearAll,
}: SelectedTasksListProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selected Tasks</CardTitle>
          <CardDescription>
            Choose tasks from the library to add them here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No tasks selected yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Selected Tasks</CardTitle>
            <CardDescription>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} selected
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                onRemove={() => onRemoveTask(task.id)}
                onMoveUp={index > 0 ? () => onReorderTasks(index, index - 1) : undefined}
                onMoveDown={index < tasks.length - 1 ? () => onReorderTasks(index, index + 1) : undefined}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface TaskItemProps {
  task: HomeworkTask;
  index: number;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function TaskItem({ task, index, onRemove, onMoveUp, onMoveDown }: TaskItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
      {/* Order indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground w-6">
          {index + 1}.
        </span>
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            className="h-4 w-4 p-0 hover:bg-background"
          >
            <GripVertical className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Task icon */}
      <div className="flex-shrink-0">
        {task.type === 'flashcard' ? (
          <BookOpen className="w-4 h-4 text-primary" />
        ) : (
          <Puzzle className="w-4 h-4 text-secondary" />
        )}
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={task.type === 'flashcard' ? 'default' : 'secondary'} className="text-xs">
            {task.type === 'flashcard' ? 'Flashcard' : 'Puzzle'}
          </Badge>
        </div>
        <p className="text-sm font-medium truncate">
          {task.title}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onMoveUp && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            className="h-7 w-7 p-0"
          >
            ↑
          </Button>
        )}
        {onMoveDown && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            className="h-7 w-7 p-0"
          >
            ↓
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}