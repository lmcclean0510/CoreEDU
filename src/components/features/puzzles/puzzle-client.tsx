
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Puzzle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/shared/use-toast';
import { CheckCircle, XCircle, RefreshCw, GripVertical, Send, ArrowUp, ArrowDown, Lightbulb, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type Block = { id: string; code: string };
type BlockStatusType = 'correct' | 'incorrect' | 'close' | 'default';
type BlockStatus = {
    status: BlockStatusType;
    direction?: 'up' | 'down';
};


const getBlockStatusColors = (status: BlockStatusType) => {
  switch (status) {
    case 'correct':
      return 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400';
    case 'incorrect':
      return 'border-red-600 bg-red-600/10 text-red-600 dark:text-red-500';
    case 'close':
      return 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400';
    default:
      return 'border-border bg-card hover:bg-muted/80';
  }
};

function SortableBlock({ id, code, statusInfo }: { id: string; code: string; statusInfo: BlockStatus }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const statusClass = getBlockStatusColors(statusInfo.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("p-2 rounded-md shadow-sm cursor-grab active:cursor-grabbing border flex items-center gap-2", statusClass)}
    >
      <GripVertical className="h-5 w-5 text-muted-foreground" />
      <pre className="font-code text-sm flex-1 whitespace-pre-wrap">{code}</pre>
      {statusInfo.status === 'correct' && <CheckCircle className="h-5 w-5 text-green-500" />}
      {statusInfo.status === 'incorrect' && <XCircle className="h-5 w-5 text-red-600" />}
      {statusInfo.status === 'close' && statusInfo.direction === 'up' && <ArrowUp className="h-5 w-5 text-amber-500" />}
      {statusInfo.status === 'close' && statusInfo.direction === 'down' && <ArrowDown className="h-5 w-5 text-amber-500" />}
    </div>
  );
}


export function PuzzleClient({ puzzle, onComplete, nextPuzzleId = null, isHomeworkMode = false }: { puzzle: Puzzle, nextPuzzleId?: string | null, onComplete?: () => void, isHomeworkMode?: boolean }) {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockStatuses, setBlockStatuses] = useState<Record<string, BlockStatus>>({});
  const [isCorrect, setIsCorrect] = useState(false);
  const [output, setOutput] = useState('// Your code output will appear here...');
  const [isAwaitingInput, setIsAwaitingInput] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showHints, setShowHints] = useState(false);
  
  const shuffledBlocks = useMemo(() => {
    return puzzle.initialBlocks
      .map((code, index) => ({ id: `initial-${index}`, code }))
      .sort(() => Math.random() - 0.5);
  }, [puzzle.initialBlocks]);

  const resetPuzzle = useCallback(() => {
    setBlocks(shuffledBlocks);
    setBlockStatuses({});
    setIsCorrect(false);
    setOutput('// Your code output will appear here...');
    setIsAwaitingInput(false);
    setUserInput('');
  }, [shuffledBlocks]);

  useEffect(() => {
    resetPuzzle();
  }, [puzzle.id, resetPuzzle]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        setBlockStatuses({});
        setIsCorrect(false);
        setIsAwaitingInput(false);
        setOutput('// Your code output will appear here...');
        return newArray;
      });
    }
  }

  const handleRunDynamicCode = () => {
    if (!userInput.trim() && puzzle.isDynamic) {
        toast({
            title: 'Input needed',
            description: 'Please enter a value to run the code.',
            variant: 'destructive',
        });
        return;
    }

    let finalResult = '';
    switch (puzzle.id) {
        case 'input-1':
        case 'input-3':
            finalResult = puzzle.expectedOutput.replace('{input}', userInput);
            break;
        case 'input-2':
            const num = parseInt(userInput, 10);
            if (isNaN(num)) {
                finalResult = 'Error: Please enter a valid number.';
            } else {
                finalResult = (num * 2).toString();
            }
            break;
        default:
            finalResult = 'Error: Dynamic output logic not implemented for this puzzle.';
    }

    setOutput(`> ${puzzle.inputPrompt}${userInput}\\n> ${finalResult}`);
    setIsAwaitingInput(false);
    setUserInput('');
  };

  const handleCheckCode = () => {
    let allCorrect = true;
    const newStatuses: Record<string, BlockStatus> = {};

    blocks.forEach((block, index) => {
      const isCorrectPosition = index < puzzle.solution.length && block.code === puzzle.solution[index];

      if (isCorrectPosition) {
        newStatuses[block.id] = { status: 'correct' };
      } else {
        allCorrect = false;
        if (showHints) {
          const isClosePrev = index > 0 && index < puzzle.solution.length && block.code === puzzle.solution[index - 1];
          const isCloseNext = index < puzzle.solution.length - 1 && block.code === puzzle.solution[index + 1];
          
          if (isClosePrev) {
            newStatuses[block.id] = { status: 'close', direction: 'up' };
          } else if (isCloseNext) {
            newStatuses[block.id] = { status: 'close', direction: 'down' };
          } else {
            newStatuses[block.id] = { status: 'incorrect' };
          }
        } else {
            newStatuses[block.id] = { status: 'incorrect' };
        }
      }
    });

    if (blocks.length !== puzzle.solution.length) {
      allCorrect = false;
    }

    setBlockStatuses(newStatuses);
    setIsCorrect(allCorrect);

    if (allCorrect) {
      if (puzzle.isDynamic) {
        setIsAwaitingInput(true);
        setOutput(`> ${puzzle.inputPrompt || ''}`);
      } else {
        setOutput(puzzle.expectedOutput);
      }
      toast({
        title: 'Success!',
        description: "You've solved the puzzle correctly.",
        variant: 'default',
        className: 'bg-success text-success-foreground'
      });
      if (onComplete) {
        onComplete();
      }
    } else {
      setOutput('// Some blocks are incorrect or out of order. Keep trying!');
      toast({
        title: 'Not quite...',
        description: 'Some blocks are in the wrong place. Try again!',
        variant: 'destructive',
      });
    }
  };

  const items = useMemo(() => blocks.map(b => b.id), [blocks]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6 h-full">
        {!isHomeworkMode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">{puzzle.title}</CardTitle>
              <CardDescription className="text-md">{puzzle.description}</CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Arrange the Code</CardTitle>
              <CardDescription>Drag and drop the blocks into the correct order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-4 min-h-[200px] m-4 mt-0 rounded-lg">
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                {blocks.map((block) => (
                  <SortableBlock key={block.id} id={block.id} code={block.code} statusInfo={blockStatuses[block.id] || { status: 'default' }} />
                ))}
              </SortableContext>
            </CardContent>
          </Card>
          
          <div className="flex flex-wrap gap-4 items-center justify-center p-4 bg-card rounded-lg border">
             {isCorrect && isHomeworkMode ? (
                <div className="flex items-center gap-2 text-success font-semibold">
                    <CheckCircle className="h-6 w-6" />
                    <span>Task Complete! Select another task from the list.</span>
                </div>
             ) : (
                <>
                    <Button onClick={handleCheckCode} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Check Code
                    </Button>
                    <Button onClick={resetPuzzle} variant="destructive-ghost" size="lg">
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Reset
                    </Button>
                    {isCorrect && !isAwaitingInput && nextPuzzleId && !isHomeworkMode && (
                        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                            <Link href={`/corecs/python/jigsaw/${nextPuzzleId}`}>Next Challenge</Link>
                        </Button>
                    )}
                    <div className="flex items-center space-x-2">
                        <Switch id="jigsaw-hints" checked={showHints} onCheckedChange={setShowHints} />
                        <Label htmlFor="jigsaw-hints" className="text-sm font-medium flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            Positional Hints
                        </Label>
                    </div>
                </>
             )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
            </CardHeader>
            <CardContent>
              {isAwaitingInput ? (
                <div className="flex flex-col gap-4">
                  <pre className="font-code text-sm bg-muted rounded-md p-4 whitespace-pre-wrap">{output}</pre>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type your input here..."
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRunDynamicCode(); }}
                      className="font-code"
                      autoFocus
                    />
                    <Button onClick={handleRunDynamicCode} size="icon">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Run</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <pre className="font-code text-sm bg-muted rounded-md p-4 whitespace-pre-wrap">{output}</pre>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
    </DndContext>
  );
}
