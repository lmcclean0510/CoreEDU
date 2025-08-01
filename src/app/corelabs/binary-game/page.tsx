

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
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface Block {
  id: number;
  value: string;
  type: 'normal' | 'special';
}

const MAX_STACK_SIZE = 8;
const INITIAL_SPEED_MS = 10000;
const SPECIAL_BLOCK_DURATION_MS = 10000;
const SPECIAL_BLOCK_COOLDOWN_MS = 60000; // 1 minute

// Helper to generate a random binary number of a given length
const generateBinary = (level: number) => {
  const bitLength = Math.min(4 + Math.floor(level / 2), 8); // Start at 4 bits, increase to 8
  let binary = '';
  for (let i = 0; i < bitLength; i++) {
    binary += Math.round(Math.random());
  }
  return binary;
};


function BinaryGameContent() {
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
      const timeSinceLastSpecial = lastSpecialBlockTimeRef.current ? now - lastSpecialBlockTimeRef.current : Infinity;
      const canSpawnSpecial = timeSinceLastSpecial > SPECIAL_BLOCK_COOLDOWN_MS;

      // Reduced probability and added cooldown
      const isSpecialTime = Math.random() < 0.15 && !prevStack.some(b => b.type === 'special') && canSpawnSpecial; 
      
      if (isSpecialTime) {
        lastSpecialBlockTimeRef.current = now;
      }

      const newBlock: Block = {
        id: Date.now() + Math.random(),
        value: generateBinary(level).padStart(8, '0'), // Pad to 8 bits for consistent display
        type: isSpecialTime ? 'special' : 'normal',
      };
      return [newBlock, ...prevStack];
    });
  }, [level]);

  // Special block timeout management
  useEffect(() => {
    const activeTimers = specialBlockTimersRef.current;
    
    // Set timers for new special blocks
    stack.forEach(block => {
      if (block.type === 'special' && !activeTimers.has(block.id)) {
        const timerId = setTimeout(() => {
          setStack(prev => prev.filter(b => b.id !== block.id));
          activeTimers.delete(block.id);
        }, SPECIAL_BLOCK_DURATION_MS);
        activeTimers.set(block.id, timerId);
      }
    });

    // Cleanup timers for blocks that no longer exist
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
    setBombs(1); // Start with one bomb
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
      // Calculate new level based on the up-to-date score
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
  }

  const binaryPlaceValues = [128, 64, 32, 16, 8, 4, 2, 1];

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {(gameState === 'start' || gameState === 'gameOver') && <Header />}
      <div className={cn("w-full flex flex-1 flex-col items-center justify-center p-4 font-body", isGameActive ? "bg-gradient-to-b from-gray-900 to-black text-white" : "bg-background")}>
        
        {gameState === 'start' && (
          <Card className="text-center p-4 sm:p-8 max-w-2xl shadow-lg border-2 border-transparent bg-gradient-to-br from-slate-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="text-4xl sm:text-5xl font-headline tracking-tighter text-foreground flex items-center justify-center gap-4">
                <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                Binary Fall
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base sm:text-lg mt-4">
                Convert the binary numbers before the stack reaches the top!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="text-left bg-background/50 p-4 sm:p-6 rounded-lg border border-border">
                  <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center">How to Play</h3>
                  <ul className="space-y-3 text-card-foreground text-sm sm:text-base">
                      <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-1 shrink-0" />
                          <span><strong>Clear Blocks:</strong> Convert the binary number at the bottom of the stack. Type the correct decimal value to make it disappear. It will auto-submit when correct!</span>
                      </li>
                       <li className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-1 shrink-0" />
                          <span><strong>Game Over:</strong> Don't let the stack reach the top! The game ends if you have 8 blocks stacked up.</span>
                      </li>
                      <li className="flex items-start gap-3">
                          <Star className="w-5 h-5 text-yellow-500 mt-1 shrink-0" />
                          <span><strong>Special Blocks:</strong> Answer flashing yellow blocks correctly within 10 seconds to earn a bomb.</span>
                      </li>
                      <li className="flex items-start gap-3">
                          <Bomb className="w-5 h-5 text-orange-500 mt-1 shrink-0" />
                          <span><strong>Bombs:</strong> Use a bomb to clear the entire stack when you're in a tight spot. You can stack them up!</span>
                      </li>
                  </ul>
              </div>
              <Button onClick={startGame} size="lg" className="w-full py-4 text-xl sm:py-6 sm:text-2xl">
                Start Game
              </Button>
            </CardContent>
          </Card>
        )}

        {gameState === 'gameOver' && (
           <Card className="w-full max-w-2xl text-center animate-fade-in shadow-lg border-2 border-transparent bg-gradient-to-br from-slate-50 to-cyan-50">
             <CardHeader>
                <CardTitle className="text-4xl sm:text-5xl font-bold font-headline text-destructive flex items-center justify-center gap-4">
                  <Bomb className="w-10 h-10 sm:w-12 sm:h-12" />
                  Game Over
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base sm:text-lg mt-2">
                  The stack is full! Here's how you did.
                </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center text-foreground">
                    <div>
                        <p className="text-muted-foreground text-sm uppercase">Final Score</p>
                        <p className="text-5xl font-bold text-primary">{score}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-sm uppercase">Level Reached</p>
                        <p className="text-5xl font-bold">{level}</p>
                    </div>
                 </div>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                    <Button size="lg" onClick={startGame}>
                        Play Again
                    </Button>
                    <Button size="lg" onClick={() => setGameState('start')} variant="outline">
                        Back to Menu
                    </Button>
                 </div>
             </CardContent>
           </Card>
        )}

        {isGameActive && (
          <div className="w-full max-w-2xl h-full mx-auto flex flex-col gap-4">
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
                            className="text-red-500 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title="Use Bomb"
                        >
                            <Bomb className="w-7 h-7 sm:w-8 sm:h-8" />
                            <span className="sr-only">Use Bomb</span>
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
              @keyframes fade-in {
                  from { opacity: 0; transform: scale(0.9); }
                  to { opacity: 1; transform: scale(1); }
              }
              .animate-fade-in {
                  animation: fade-in 0.5s ease-out forwards;
              }
              @keyframes flash {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
              }
              .animate-flash {
                animation: flash 1s infinite;
              }
              @keyframes pulse-border {
                0%, 100% { border-color: #ef4444; } /* red-500 */
                50% { border-color: #fca5a5; } /* red-300 */
              }
              .animate-pulse-border {
                animation: pulse-border 2s ease-in-out infinite;
              }
             `}</style>
          </div>
        )}
      </div>
      {(gameState === 'start' || gameState === 'gameOver') && <Footer />}
    </>
  );
}

export default function BinaryGamePage() {
    return (
        <ProtectedRoute>
            <BinaryGameContent />
        </ProtectedRoute>
    )
}
