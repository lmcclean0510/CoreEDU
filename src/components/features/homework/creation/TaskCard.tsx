import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Check, BookOpen, Puzzle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Flashcard, Puzzle as PuzzleType, HomeworkTask } from '@/lib/types';

interface TaskCardProps {
  task: Flashcard | PuzzleType;
  type: 'flashcard' | 'puzzle';
  isSelected: boolean;
  onToggle: (task: HomeworkTask) => void;
}

export function TaskCard({ task, type, isSelected, onToggle }: TaskCardProps) {
  const handleToggle = () => {
    const homeworkTask: HomeworkTask = {
      id: task.id,
      type,
      title: type === 'flashcard' ? (task as Flashcard).term : (task as PuzzleType).title,
    };
    onToggle(homeworkTask);
  };

  const renderFlashcardContent = (flashcard: Flashcard) => (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {flashcard.term}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {flashcard.definition}
            </CardDescription>
          </div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleToggle}
            className="mt-1 flex-shrink-0"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {flashcard.topic}
          </Badge>
          {flashcard.subTopic && (
            <Badge variant="outline" className="text-xs">
              {flashcard.subTopic}
            </Badge>
          )}
        </div>
      </CardContent>
    </>
  );

  const renderPuzzleContent = (puzzle: PuzzleType) => (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-xs">
                Level {puzzle.challengeLevel}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {puzzle.skillSection}
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold line-clamp-2">
              {puzzle.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {puzzle.description}
            </CardDescription>
          </div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleToggle}
            className="mt-1 flex-shrink-0"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {puzzle.initialBlocks?.length || 0} blocks to arrange
          </span>
        </div>
      </CardContent>
    </>
  );

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "border-2 border-primary bg-primary/5"
      )}
      onClick={handleToggle}
    >
      {type === 'flashcard' 
        ? renderFlashcardContent(task as Flashcard)
        : renderPuzzleContent(task as PuzzleType)
      }
    </Card>
  );
}