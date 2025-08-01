
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { FillInTheBlanksChallenge } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/shared/use-toast';
import { CheckCircle, RefreshCw, LoaderCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/auth/use-auth';

type InputStatus = 'default' | 'correct' | 'incorrect';

export function FillInTheBlanksClient({ challenge, nextChallengeId }: { challenge: FillInTheBlanksChallenge, nextChallengeId: string | null }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [output, setOutput] = useState('// Your code output will appear here...');
  const [isAwaitingInput, setIsAwaitingInput] = useState(false);
  const [dynamicUserInput, setDynamicUserInput] = useState('');
  const [inputStatuses, setInputStatuses] = useState<InputStatus[]>([]);
  
  const blankCount = useMemo(() => challenge.codeParts.filter(p => p === null).length, [challenge.codeParts]);

  const resetChallenge = () => {
    setUserInputs(Array(blankCount).fill(''));
    setInputStatuses(Array(blankCount).fill('default'));
    setIsCorrect(false);
    setOutput('// Your code output will appear here...');
    setIsAwaitingInput(false);
    setDynamicUserInput('');
  };

  useEffect(() => {
    resetChallenge();
  }, [challenge.id, blankCount]);

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...userInputs];
    newInputs[index] = value;
    setUserInputs(newInputs);
    // Reset statuses if user types again after checking
    if (inputStatuses.some(s => s !== 'default')) {
      setInputStatuses(Array(blankCount).fill('default'));
      setIsCorrect(false);
    }
  };

  const handleCheckCode = () => {
    const newStatuses = userInputs.map((input, index) => {
      return input.trim() === challenge.solution[index]?.trim() ? 'correct' : 'incorrect';
    });
    setInputStatuses(newStatuses);

    const isSolutionCorrect = newStatuses.every(status => status === 'correct');
    setIsCorrect(isSolutionCorrect);

    if (isSolutionCorrect) {
      if (challenge.isDynamic) {
        setIsAwaitingInput(true);
        setOutput(`> ${challenge.inputPrompt || ''}`);
      } else {
        setOutput(challenge.expectedOutput);
      }
      toast({
        title: 'Success!',
        description: "You've solved the challenge correctly.",
        variant: 'default',
        className: 'bg-success text-success-foreground'
      });
    } else {
      setOutput('// Your solution is not quite right. Keep trying!');
      toast({
        title: 'Not quite...',
        description: 'Check your answers and try again! Correct blocks are green, incorrect are red.',
        variant: 'destructive',
      });
    }
  };
  
  const handleRunDynamicCode = () => {
    if (!dynamicUserInput.trim() && challenge.isDynamic) {
        toast({
            title: 'Input needed',
            description: 'Please enter a value to run the code.',
            variant: 'destructive',
        });
        return;
    }

    let finalResult = '';
    switch (challenge.id) {
        case 'fb-input-1':
            finalResult = challenge.expectedOutput.replace('{input}', dynamicUserInput);
            break;
        case 'fb-input-2':
            const num = parseInt(dynamicUserInput, 10);
            if (isNaN(num)) {
                finalResult = 'Error: Please enter a valid number.';
            } else {
                finalResult = challenge.expectedOutput.replace('{input_plus_one}', (num + 1).toString());
            }
            break;
        case 'fb-input-3':
             finalResult = challenge.expectedOutput.replace('{input}', dynamicUserInput);
            break;
        default:
             finalResult = challenge.expectedOutput;
    }

    setOutput(`> ${challenge.inputPrompt}${dynamicUserInput}\\n> ${finalResult}`);
    setIsAwaitingInput(false);
    setDynamicUserInput('');
  };

  const getInputStatusClass = (status: InputStatus = 'default') => {
    switch (status) {
      case 'correct':
        return 'border-success bg-success/10 focus-visible:ring-success';
      case 'incorrect':
        return 'border-destructive bg-destructive/10 focus-visible:ring-destructive';
      case 'default':
      default:
        return 'border-accent bg-accent/10 focus-visible:ring-accent';
    }
  };
  
  if (isAuthLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
      <div className="flex flex-col gap-6 h-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">{challenge.title}</CardTitle>
            <CardDescription className="text-md">{challenge.description}</CardDescription>
          </CardHeader>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle>Fill in the Blanks</CardTitle>
              <CardDescription>Type your answers into the input boxes.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 m-4 mt-0 rounded-lg">
                <pre className="font-code text-sm bg-muted rounded-md p-4 whitespace-pre-wrap">
                    {challenge.codeParts.map((part, index) => {
                        if (part === null) {
                            const blankIndex = challenge.codeParts.slice(0, index).filter(p => p === null).length;
                            const solutionText = challenge.solution[blankIndex] || '';
                            const inputWidth = `${Math.max(solutionText.length + 4, 12)}ch`;
                            return (
                                <Input
                                    key={`blank-${blankIndex}`}
                                    type="text"
                                    value={userInputs[blankIndex] || ''}
                                    onChange={(e) => handleInputChange(blankIndex, e.target.value)}
                                    style={{ width: inputWidth }}
                                    className={cn(
                                      "font-code inline-flex h-8 w-auto text-center transition-colors duration-300 mx-1",
                                      getInputStatusClass(inputStatuses[blankIndex])
                                    )}
                                />
                            );
                        }
                        return <span key={`code-${index}`}>{part}</span>;
                    })}
                </pre>
            </CardContent>
          </Card>
          
          <div className="flex flex-wrap gap-4 items-center justify-center p-4 bg-card rounded-lg border">
            <Button onClick={handleCheckCode} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              <CheckCircle className="mr-2 h-5 w-5" />
              Check Code
            </Button>
            <Button onClick={resetChallenge} variant="destructive-ghost" size="lg">
              <RefreshCw className="mr-2 h-5 w-5" />
              Reset
            </Button>
            {isCorrect && !isAwaitingInput && nextChallengeId && (
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                    <Link href={`/corecs/python/fill-in-the-blanks/${nextChallengeId}`}>Next Challenge</Link>
                </Button>
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
                      value={dynamicUserInput}
                      onChange={(e) => setDynamicUserInput(e.target.value)}
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
  );
}
