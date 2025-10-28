"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Trophy, Flame, CheckCircle, Gamepad2, Timer, Heart, Star, Award, LoaderCircle, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/providers/UserProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GameContainer } from '@/components/games/GameContainer';

const generateDenary = (level: number) => {
  const bitLength = Math.min(4 + Math.floor(level / 2), 8);
  const max = Math.pow(2, bitLength) - 1;
  return Math.floor(Math.random() * max) + 1;
};

const binaryPlaceValues = [128, 64, 32, 16, 8, 4, 2, 1];
const INITIAL_TIME = 30;
const MAX_LIVES = 3;
const LIFE_BLOCK_COOLDOWN_MS = 30000;
const BONUS_BLOCK_COOLDOWN_MS = 45000;

type SpecialBlockType = 'none' | 'life' | 'bonus';

export default function DenaryGamePage() {
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
    if (canSpawnLife && rand < 0.15) {
      setSpecialBlockType('life');
      setTimeLeft(10);
      lastLifeBlockTimeRef.current = now;
    } else if (canSpawnBonus && rand >= 0.15 && rand < 0.25) {
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
  
  useEffect(() => {
    if (gameState !== 'playing' || feedback === 'correct') return;

    const userDenaryValue = parseInt(userBinary.join(''), 2);

    if (userDenaryValue === currentDenary) {
      setFeedback('correct');
    }
  }, [userBinary, currentDenary, gameState, feedback]);

  useEffect(() => {
    if (feedback === 'correct') {
      const timer = setTimeout(() => {
        nextChallenge(true, specialBlockType);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [feedback, nextChallenge, specialBlockType]);
  
  useEffect(() => {
    setCurrentDenary(generateDenary(1));
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (gameState === 'start') {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Binary Builder</CardTitle>
              <CardDescription className="mt-1">
                Click the bits to build the correct binary number
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-6 rounded-lg border space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              How to Play
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                <span>
                  A denary number will be shown. Click the 8 boxes below to toggle them between 0 and 1
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                <span>
                  When your 8 bits correctly represent the denary number, they'll flash green!
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Timer className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>
                  Beat the clock - the timer gets faster as you level up!
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                <span>
                  Solve flashing yellow numbers in 10 seconds to gain a life back (max 3)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Award className="w-5 h-5 text-pink-400 mt-0.5 shrink-0" />
                <span>
                  Solve rare pink numbers in 10 seconds to earn 3 bonus points!
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <span>
                  You have three lives - lose all three and the game is over
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

  if (gameState === 'gameOver') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3 text-destructive">
            <Heart className="w-10 h-10" />
            Game Over
          </CardTitle>
          <CardDescription className="text-center mt-2">
            You ran out of lives! Here's how you did.
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

  return (
    <GameContainer isPlaying={isGameActive}>
      <div className="w-full h-full p-4 flex flex-col gap-4 bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="flex justify-between items-center bg-gray-800/50 border border-gray-700 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span className="font-mono">{score}</span>
            </div>
            <div className="flex items-center gap-2 text-lg font-bold">
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
        
        <div className="w-full px-2">
          <Progress value={(timeLeft / timerDuration) * 100} className="w-full h-3 transition-all duration-300" />
          <p className="text-center text-sm font-mono text-cyan-400 mt-1">Time: {timeLeft}s</p>
        </div>

        <div className="bg-black/50 border-4 border-gray-700 rounded-lg overflow-hidden flex flex-col p-4 gap-4 flex-grow">
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
          @keyframes flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .animate-flash {
            animation: flash 1s infinite;
          }
        `}</style>
      </div>
    </GameContainer>
  );
}
