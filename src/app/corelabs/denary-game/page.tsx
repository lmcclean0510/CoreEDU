
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Trophy, Flame, CheckCircle, Gamepad2, Timer, Heart, Bomb, Star, Award, LoaderCircle, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/UserProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const generateDenary = (level: number) => {
  const bitLength = Math.min(4 + Math.floor(level / 2), 8);
  const max = Math.pow(2, bitLength) - 1;
  // Generate a number from 1 to max to avoid 0.
  return Math.floor(Math.random() * max) + 1;
};

const binaryPlaceValues = [128, 64, 32, 16, 8, 4, 2, 1];
const INITIAL_TIME = 30;
const MAX_LIVES = 3;
const LIFE_BLOCK_COOLDOWN_MS = 30000; // 30 seconds
const BONUS_BLOCK_COOLDOWN_MS = 45000; // 45 seconds

type SpecialBlockType = 'none' | 'life' | 'bonus';

function DenaryGameContent() {
  const { user, isLoading } = useAuth();
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [currentDenary, setCurrentDenary] = useState(0);
  const [userBinary, setUserBinary] = useState<string[]>(Array(8).fill('0'));
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [feedback, setFeedback] = useState<'correct' | null>(null);
  const [specialBlockType, setSpecialBlockType] = useState<SpecialBlockType>('none');
  
  const lastLifeBlockTimeRef = useRef<number | null>(null);
  const lastBonusBlockTimeRef = useRef<number | null>(null);

  const level = Math.floor(score / 10) + 1;
  const timerDuration = specialBlockType !== 'none' ? 10 : Math.max(INITIAL_TIME - (level - 1) * 2, 5);
  const isGameActive = gameState === 'playing';

  // Save high score on game over
  useEffect(() => {
    if (gameState === 'gameOver' && user && score > 0) {
      const updateUserHighScore = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          const currentHighScore = docSnap.data()?.corebinStats?.binaryBuilder?.highScore || 0;
          if (score > currentHighScore) {
            await updateDoc(userDocRef, {
              'corebinStats.binaryBuilder': {
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

  const nextChallenge = useCallback((isCorrect: boolean, prevSpecialType: SpecialBlockType) => {
    let scoreIncrease = 0;
    if (isCorrect) {
      if (prevSpecialType === 'life') {
        setLives(prev => Math.min(prev + 1, MAX_LIVES));
        scoreIncrease = 1;
      } else if (prevSpecialType === 'bonus') {
        scoreIncrease = 3;
      } else {
        scoreIncrease = 1;
      }
      setScore(prev => prev + scoreIncrease);
    }
    
    const newScoreForLevel = score + scoreIncrease;
    const newLevel = Math.floor(newScoreForLevel / 10) + 1;
    setCurrentDenary(generateDenary(newLevel));
    
    const currentLivesAfterUpdate = (isCorrect && prevSpecialType === 'life') ? Math.min(lives + 1, MAX_LIVES) : lives;
    
    const now = Date.now();
    const timeSinceLastLife = lastLifeBlockTimeRef.current ? now - lastLifeBlockTimeRef.current : Infinity;
    const canSpawnLife = currentLivesAfterUpdate < MAX_LIVES && timeSinceLastLife > LIFE_BLOCK_COOLDOWN_MS;
    
    const timeSinceLastBonus = lastBonusBlockTimeRef.current ? now - lastBonusBlockTimeRef.current : Infinity;
    const canSpawnBonus = timeSinceLastBonus > BONUS_BLOCK_COOLDOWN_MS;

    const rand = Math.random();
    if (canSpawnLife && rand < 0.15) { // 15% chance for life block
      setSpecialBlockType('life');
      setTimeLeft(10);
      lastLifeBlockTimeRef.current = now;
    } else if (canSpawnBonus && rand >= 0.15 && rand < 0.25) { // 10% chance for bonus block
      setSpecialBlockType('bonus');
      setTimeLeft(10);
      lastBonusBlockTimeRef.current = now;
    } else {
      setSpecialBlockType('none');
      const newTimerDuration = Math.max(INITIAL_TIME - (newLevel - 1) * 2, 5);
      setTimeLeft(newTimerDuration);
    }
    
    setUserBinary(Array(8).fill('0'));
    setFeedback(null);
  }, [score, lives]);

  const startGame = () => {
    setScore(0);
    setLives(MAX_LIVES);
    setUserBinary(Array(8).fill('0'));
    setCurrentDenary(generateDenary(1));
    setFeedback(null);
    setSpecialBlockType('none');
    lastLifeBlockTimeRef.current = null;
    lastBonusBlockTimeRef.current = null;
    setTimeLeft(INITIAL_TIME);
    setGameState('playing');
  };
  
  const handleTimeUp = useCallback(() => {
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setGameState('gameOver');
    } else {
      nextChallenge(false, specialBlockType);
    }
  }, [lives, nextChallenge, specialBlockType]);

  // Timer countdown effect
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [gameState, timeLeft, handleTimeUp]);

  const handleBitClick = (index: number) => {
    if (feedback === 'correct' || gameState !== 'playing') return;

    const newBinary = [...userBinary];
    newBinary[index] = newBinary[index] === '0' ? '1' : '0';
    setUserBinary(newBinary);
  };
  
  // Check for correct answer whenever userBinary changes
  useEffect(() => {
    if (gameState !== 'playing' || feedback === 'correct') return;

    const userDenaryValue = parseInt(userBinary.join(''), 2);

    if (userDenaryValue === currentDenary) {
      setFeedback('correct');
    }
  }, [userBinary, currentDenary, gameState, feedback]);

  // Handle automatic progression after a correct answer
  useEffect(() => {
    if (feedback === 'correct') {
      const timer = setTimeout(() => {
        nextChallenge(true, specialBlockType);
      }, 1000); // Wait 1 second to show feedback

      // Cleanup function to clear the timeout if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [feedback, nextChallenge, specialBlockType]);
  
  // Generate first number on mount to avoid hydration mismatch
  useEffect(() => {
    setCurrentDenary(generateDenary(1));
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <LoaderCircle className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {(gameState === 'start' || gameState === 'gameOver') && <Header />}
      <div className={cn("w-full flex flex-1 flex-col items-center justify-center p-4 font-body", isGameActive ? "bg-gradient-to-b from-gray-900 to-black text-white" : "bg-background")}>
        
        {gameState === 'start' && (
          <Card className="text-center p-4 sm:p-8 max-w-2xl shadow-lg border-2 border-transparent bg-gradient-to-br from-slate-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="text-4xl sm:text-5xl font-headline tracking-tighter text-foreground flex items-center justify-center gap-4">
                <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                Binary Builder
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base sm:text-lg mt-4">
                Click the bits to build the correct binary number for the given denary value!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="text-left bg-background/50 p-4 sm:p-6 rounded-lg border border-border">
                  <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center">How to Play</h3>
                  <ul className="space-y-3 text-card-foreground text-sm sm:text-base">
                      <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-1 shrink-0" />
                          <span><strong>Build the Binary:</strong> A denary (normal) number will be shown. Click the 8 boxes below to toggle them between 0 and 1.</span>
                      </li>
                      <li className="flex items-start gap-3">
                          <Target className="w-5 h-5 text-yellow-400 mt-1 shrink-0" />
                          <span><strong>Get it Right:</strong> When your 8 bits correctly represent the denary number, they will flash green and you'll get a new number to solve.</span>
                      </li>
                      <li className="flex items-start gap-3">
                          <Timer className="w-5 h-5 text-primary mt-1 shrink-0" />
                          <span><strong>Beat the Clock:</strong> You have a limited time for each number. The timer gets faster as you level up!</span>
                      </li>
                       <li className="flex items-start gap-3">
                          <Star className="w-5 h-5 text-yellow-500 mt-1 shrink-0" />
                          <span><strong>Gain Lives:</strong> Occasionally, a flashing yellow number will appear. Solve it in 10 seconds to gain a life back (max 3 lives)!</span>
                      </li>
                      <li className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-pink-400 mt-1 shrink-0" />
                          <span><strong>Bonus Points:</strong> Solve a rare, flashing pink number in 10 seconds to earn 3 bonus points!</span>
                      </li>
                      <li className="flex items-start gap-3">
                          <Heart className="w-5 h-5 text-red-500 mt-1 shrink-0" />
                          <span><strong>Three Lives:</strong> If the timer runs out, you lose a life. Lose all three, and the game is over.</span>
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
           <Card className="w-full max-w-2xl text-center shadow-lg border-2 border-transparent bg-gradient-to-br from-slate-50 to-cyan-50">
             <CardHeader>
                <CardTitle className="text-4xl sm:text-5xl font-bold font-headline text-destructive flex items-center justify-center gap-4">
                  <Bomb className="w-10 h-10 sm:w-12 sm:h-12" />
                  Game Over
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base sm:text-lg mt-2">
                  You ran out of lives! Here's how you did.
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
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
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
                    <div className="flex items-center gap-1">
                        {Array.from({ length: lives }).map((_, i) => (
                            <Heart key={i} className="w-7 h-7 text-red-500 fill-red-500" />
                        ))}
                        {Array.from({ length: MAX_LIVES - lives }).map((_, i) => (
                            <Heart key={i} className="w-7 h-7 text-gray-600" />
                        ))}
                    </div>
                    <Button onClick={() => setGameState('gameOver')} variant="destructive" size="sm">
                        <StopCircle className="mr-1.5" />
                        Exit
                    </Button>
                </div>
            </div>
            
            {/* Timer */}
            <div className="w-full px-2">
              <Progress value={(timeLeft / timerDuration) * 100} className="w-full h-3 transition-all duration-300" />
              <p className="text-center text-sm font-mono text-cyan-400 mt-1">Time: {timeLeft}s</p>
            </div>

            {/* Game Board */}
            <div className="bg-black/50 border-4 border-gray-700 rounded-lg overflow-hidden flex flex-col p-4 gap-4">
              
              {/* Target Denary Number */}
              <div className="text-center">
                <p className="text-xl sm:text-2xl text-cyan-400">Convert this denary number:</p>
                <p
                  className={cn(
                      "text-6xl sm:text-8xl font-bold font-mono text-white transition-all duration-300",
                      specialBlockType === 'life' && "text-yellow-400 animate-flash",
                      specialBlockType === 'bonus' && "text-pink-400 animate-flash"
                  )}
                  key={currentDenary}
                >
                  {currentDenary}
                </p>
              </div>

              {/* Binary Builder Area */}
              <div>
                <div className="grid grid-cols-8 text-center p-2 border-b-2 border-gray-600">
                  {binaryPlaceValues.map((val) => (
                    <div key={val} className="font-mono font-bold text-cyan-400 text-xs sm:text-sm md:text-base">
                      {val}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-8 gap-1 p-2 sm:gap-2 sm:p-4">
                    {userBinary.map((bit, index) => (
                      <button
                        key={index}
                        onClick={() => handleBitClick(index)}
                        disabled={gameState !== 'playing'}
                        className={cn(
                          "w-full aspect-square flex items-center justify-center font-mono text-2xl sm:text-4xl font-bold rounded-md transition-all duration-150 border-2",
                          feedback === 'correct' 
                            ? 'bg-green-500/80 border-green-300 animate-pulse-once'
                            : 'bg-gray-700/50 border-cyan-500 hover:bg-gray-600/50'
                        )}
                      >
                        {bit}
                      </button>
                    ))}
                </div>
              </div>
            </div>
             <style jsx>{`
              @keyframes pulse-once {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
                50% { transform: scale(1.05); box-shadow: 0 0 10px 10px rgba(74, 222, 128, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
              }
              .animate-pulse-once {
                animation: pulse-once 0.8s ease-in-out;
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
             `}</style>
          </div>
        )}
      </div>
      {(gameState === 'start' || gameState === 'gameOver') && <Footer />}
    </div>
  );
}

export default function DenaryGamePage() {
    return (
        <ProtectedRoute>
            <DenaryGameContent />
        </ProtectedRoute>
    )
}
