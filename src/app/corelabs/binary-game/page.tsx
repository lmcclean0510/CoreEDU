"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Gamepad2, Trophy, Bomb, CheckCircle, AlertTriangle, Star, LoaderCircle, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/UserProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GameContainer } from '@/components/games/GameContainer';

interface Block {
  id: number;
  value: string;
  type: 'normal' | 'special';
}

const MAX_STACK_SIZE = 8;
const INITIAL_SPEED_MS = 10000;
const SPECIAL_BLOCK_DURATION_MS = 10000;
const SPECIAL_BLOCK_COOLDOWN_MS = 60000; // 1 minute

// Helper to generate a random binary number
const generateBinary = (level: number) => {
  const bitLength = Math.min(4 + Math.floor(level / 2), 8);
  let binary = '';
  for (let i = 0; i < bitLength; i++) {
    binary += Math.round(Math.random());
  }
  return binary.padStart(8, '0'); // Pad to 8 bits
};

export default function BinaryGamePage() {
  const { user, isLoading } = useAuth();
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [stack, setStack] = useState<Block[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [bombs, setBombs] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const specialBlockTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const lastSpecialBlockTimeRef = useRef<number | null>(null);

  const gameSpeed = Math.max(INITIAL_SPEED_MS - (level * 500), 800);
  const isDanger = gameState === 'playing' && stack.length >= MAX_STACK_SIZE - 2;
  const isGameActive = gameState === 'playing';
  const binaryPlaceValues = [128, 64, 32, 16, 8, 4, 2, 1];

  // Save high score on game over
  useEffect(() => {
    if (gameState === 'gameOver' && user && score > 0) {
      const updateUserHighScore = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          const currentHighScore = docSnap.data()?.corebinStats?.binaryFall?.highScore || 0;
          if (score > currentHighScore) {
            await updateDoc(userDocRef, {
              'corebinStats.binaryFall': {
                highScore: score,
                date: new Date(),
              }
            });
          }
        } catch (error) {
          console.error("Failed to update high score", error);
        }
      };
      updateUserHighScore();
    }
  }, [gameState, user, score]);

  const clearAllTimers = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    specialBlockTimersRef.current.forEach(timer => clearTimeout(timer));
    specialBlockTimersRef.current.clear();
  };

  const tick = useCallback(() => {
    setStack(prevStack => {
      if (prevStack.length >= MAX_STACK_SIZE) {
        setGameState('gameOver');
        return prevStack;
      }
      
      const now = Date.now();
      const timeSinceLastSpecial = lastSpecialBlockTimeRef.current 
        ? now - lastSpecialBlockTimeRef.current 
        : Infinity;
      const canSpawnSpecial = timeSinceLastSpecial > SPECIAL_BLOCK_COOLDOWN_MS;
      const isSpecialTime = Math.random() < 0.15 
        && !prevStack.some(b => b.type === 'special') 
        && canSpawnSpecial; 
      
      if (isSpecialTime) {
        lastSpecialBlockTimeRef.current = now;
      }

      const newBlock: Block = {
        id: Date.now() + Math.random(),
        value: generateBinary(level),
        type: isSpecialTime ? 'special' : 'normal',
      };
      return [newBlock, ...prevStack];
    });
  }, [level]);

  // Special block timeout management
  useEffect(() => {
    const activeTimers = specialBlockTimersRef.current;
    
    stack.forEach(block => {
      if (block.type === 'special' && !activeTimers.has(block.id)) {
        const timerId = setTimeout(() => {
          setStack(prev => prev.filter(b => b.id !== block.id));
          activeTimers.delete(block.id);
        }, SPECIAL_BLOCK_DURATION_MS);
        activeTimers.set(block.id, timerId);
      }
    });

    const blockIds = new Set(stack.map(b => b.id));
    for (const [id, timerId] of activeTimers.entries()) {
      if (!blockIds.has(id)) {
        clearTimeout(timerId);
        activeTimers.delete(id);
      }
    }
  }, [stack]);

  // Game loop management
  useEffect(() => {
    if (gameState !== 'playing') {
      clearAllTimers();
      return;
    }

    if (stack.length === 0) {
      tick();
      return;
    }

    gameLoopRef.current = setInterval(tick, gameSpeed);
    inputRef.current?.focus();

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, gameSpeed, tick, stack.length]);
  
  // Feedback timer
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 300);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setStack([]);
    setInputValue('');
    setBombs(1);
    setGameState('playing');
    lastSpecialBlockTimeRef.current = null;
  };

  const handleUseBomb = () => {
    if (bombs > 0) {
      setStack([]);
      setBombs(prev => prev - 1);
    }
  };

  const handleCorrectAnswer = useCallback((blockType: 'normal' | 'special') => {
    setScore(prevScore => {
      const newScore = prevScore + 1;
      setLevel(Math.floor(newScore / 10) + 1);
      return newScore;
    });
    
    if (blockType === 'special') {
      setBombs(prev => prev + 1);
    }
    
    setStack(prev => prev.slice(0, -1));
    setFeedback('correct');
    setInputValue('');
  }, []);

  // Auto-submit on correct answer
  useEffect(() => {
    if (gameState !== 'playing' || !inputValue.trim() || stack.length === 0) return;

    const bottomBlock = stack[stack.length - 1];
    if (!bottomBlock) return;

    const correctValue = parseInt(bottomBlock.value, 2);
    const userValue = parseInt(inputValue, 10);

    if (!isNaN(userValue) && userValue === correctValue) {
      handleCorrectAnswer(bottomBlock.type);
    }
  }, [inputValue, stack, gameState, handleCorrectAnswer]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || stack.length === 0) return;

    const bottomBlock = stack[stack.length - 1];
    if (!bottomBlock) return;

    const correctValue = parseInt(bottomBlock.value, 2);
    const userValue = parseInt(inputValue, 10);

    if (userValue === correctValue) {
      handleCorrectAnswer(bottomBlock.type);
    } else {
      setFeedback('incorrect');
      setInputValue('');
    }
  };
  
  const getFeedbackClass = () => {
    if (feedback === 'correct') return 'ring-4 ring-green-500';
    if (feedback === 'incorrect') return 'ring-4 ring-red-500 animate-shake';
    return 'ring-primary';
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Start menu
  if (gameState === 'start') {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Binary Fall</CardTitle>
              <CardDescription className="mt-1">
                Convert binary numbers before the stack overflows
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-6 rounded-lg border space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              How to Play
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                <span>
                  Convert the binary number at the bottom of the stack to decimal. 
                  It will auto-submit when correct!
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                <span>
                  Don't let the stack reach 8 blocks or it's game over!
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                <span>
                  Answer flashing yellow blocks within 10 seconds to earn a bomb
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Bomb className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                <span>
                  Use bombs to clear the entire stack in emergencies
                </span>
              </li>
            </ul>
          </div>
          <Button onClick={startGame} size="lg" className="w-full">
            Start Game
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Game over screen
  if (gameState === 'gameOver') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3 text-destructive">
            <Bomb className="w-10 h-10" />
            Game Over
          </CardTitle>
          <CardDescription className="text-center mt-2">
            The stack is full! Here's how you did.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground uppercase mb-2">Final Score</p>
              <p className="text-5xl font-bold text-primary">{score}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase mb-2">Level Reached</p>
              <p className="text-5xl font-bold">{level}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button size="lg" onClick={startGame}>
              Play Again
            </Button>
            <Button size="lg" onClick={() => setGameState('start')} variant="outline">
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fullscreen gameplay
  return (
    <GameContainer 
      isActive={isGameActive}
      onFullscreenExit={() => setGameState('gameOver')}
    >
      <div className="w-full h-full p-2 flex flex-col gap-2 bg-gradient-to-b from-gray-900 to-black text-white">
        {/* Game Info Header */}
        <div className="flex justify-between items-center bg-gray-800/50 border border-gray-700 rounded-lg p-2 sm:p-3 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span className="font-mono">{score}</span>
            </div>
            <div className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <Flame className="w-6 h-6 text-orange-500" />
              <span className="font-mono">{level}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button
                onClick={handleUseBomb}
                disabled={bombs === 0}
                variant="ghost"
                size="icon"
                className="text-red-500 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Use Bomb"
              >
                <Bomb className="w-7 h-7 sm:w-8 sm:h-8" />
              </Button>
              {bombs > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {bombs}
                </div>
              )}
            </div>
            <Button onClick={() => setGameState('gameOver')} variant="destructive" size="sm">
              <StopCircle className="mr-1.5" />
              Exit
            </Button>
          </div>
        </div>
        
        {/* Game Board */}
        <div className={cn(
          "bg-black/50 border-4 rounded-lg overflow-hidden flex flex-col flex-grow transition-colors duration-300",
          isDanger ? 'border-red-500 animate-pulse-border' : 'border-gray-700'
        )}>
          {/* Header for place values */}
          <div className="grid grid-cols-8 text-center p-2 border-b-2 border-gray-600">
            {binaryPlaceValues.map((val) => (
              <div key={val} className="font-mono font-bold text-cyan-400 text-xs sm:text-sm md:text-base">
                {val}
              </div>
            ))}
          </div>
          
          {/* Game Area with stack */}
          <div className="relative flex-grow flex flex-col-reverse p-2 gap-2 overflow-hidden">
            <div
              className="absolute top-0 left-0 w-full bg-red-600/50 z-10 transition-all duration-300 ease-linear"
              style={{ height: `${(stack.length / MAX_STACK_SIZE) * 100}%`}}
            />
            {stack.map((block) => (
              <div
                key={block.id}
                className={cn(
                  "w-full grid grid-cols-8 gap-1 p-1 rounded-md transition-all z-20 shadow-lg border-2",
                  block.type === 'normal' && "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300",
                  block.type === 'special' && "bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-200 animate-flash"
                )}
              >
                {block.value.split('').map((bit, index) => (
                  <div key={index} className="font-mono text-sm sm:text-lg font-bold text-center bg-black/20 rounded p-0.5 sm:p-1">
                    {bit}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Input Form */}
        <form onSubmit={handleFormSubmit}>
          <Input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            placeholder="Enter denary value..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={cn(
              "w-full p-3 text-lg sm:p-4 sm:text-xl font-mono bg-gray-800 border-2 text-white focus:ring-offset-gray-900 transition-all duration-150 placeholder:text-gray-400",
              getFeedbackClass()
            )}
          />
        </form>
        
        {/* Animations */}
        <style jsx>{`
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
          .animate-shake {
            animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .animate-flash {
            animation: flash 1s infinite;
          }
          @keyframes pulse-border {
            0%, 100% { border-color: #ef4444; }
            50% { border-color: #fca5a5; }
          }
          .animate-pulse-border {
            animation: pulse-border 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    </GameContainer>
  );
}
