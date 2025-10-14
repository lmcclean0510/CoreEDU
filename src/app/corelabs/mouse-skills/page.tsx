"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crosshair, Timer, Trophy, MousePointerClick, Gamepad2, Move, StopCircle, ChevronRight, Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { GameContainer } from '@/components/games/GameContainer';

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  type: 'left' | 'right';
}

interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
}

const GAME_DURATION_S = 30;

export default function MouseSkillsPage() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver' | 'countdown'>('start');
  
  // Classic & Tracking Mode State
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);

  // Follow Mode State
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0 });
  const [arrowRotation, setArrowRotation] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Game settings
  const [gameMode, setGameMode] = useState<'classic' | 'tracking' | 'follow'>('classic');
  const [trackingDifficulty, setTrackingDifficulty] = useState<'easy' | 'normal' | 'hard'>('easy');
  const [leftClickEnabled, setLeftClickEnabled] = useState(true);
  const [rightClickEnabled, setRightClickEnabled] = useState(false);
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(true);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const movementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameStateRef = useRef(gameState);

  // Refs for Follow mode
  const arrowRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, destX: 0, destY: 0, startTime: 0 });
  const trailDataRef = useRef<TrailPoint[]>([]);
  const cursorRef = useRef<{ x: number, y: number } | null>(null);
  const hasMouseEnteredRef = useRef(false);
  const gameStartTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);

  const isGameActive = gameState === 'playing' || gameState === 'countdown';

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const { pauseDuration, animationDuration } = useMemo(() => {
    if (gameMode !== 'tracking') {
      return { pauseDuration: 0, animationDuration: '0.2s' };
    }
    switch (trackingDifficulty) {
      case 'hard':
        return { pauseDuration: 10, animationDuration: '3.5s' };
      case 'normal':
        return { pauseDuration: 1500, animationDuration: '0.8s' };
      case 'easy':
      default:
        return { pauseDuration: 3000, animationDuration: '0.8s' };
    }
  }, [gameMode, trackingDifficulty]);

  const { trailDuration, trailWidth } = useMemo(() => {
    const scaleFactor = () => {
      const time = timeSurvived;
      if (time <= 30) return 1.0 - ((time / 30) * 0.25);
      if (time <= 60) return 0.75 - (((time - 30) / 30) * 0.25);
      if (time >= 120) return 0.25;
      return 0.5 - (((time - 60) / 60) * 0.25);
    };

    const scale = scaleFactor();
    return {
      trailDuration: 4000 * scale,
      trailWidth: 40 * scale,
    };
  }, [timeSurvived]);

  const moveTarget = useCallback((targetId: number) => {
    if (!gameAreaRef.current || gameStateRef.current !== 'playing') return;
    
    setTargets(currentTargets => {
      const target = currentTargets.find(t => t.id === targetId);
      if (!target) {
        if (movementTimeoutRef.current) clearTimeout(movementTimeoutRef.current);
        return currentTargets;
      }
      
      const gameArea = gameAreaRef.current.getBoundingClientRect();
      const MIN_DISTANCE = (gameArea.width / 1.5);
      let newX, newY, distance;
      let attempts = 0;

      do {
        newX = Math.random() * (gameArea.width - target.size);
        newY = Math.random() * (gameArea.height - target.size);
        const dx = newX - target.x;
        const dy = newY - target.y;
        distance = Math.sqrt(dx * dx + dy * dy);
        attempts++;
      } while (distance < MIN_DISTANCE && attempts < 50);

      const updatedTarget = { ...target, x: newX, y: newY };

      if (movementTimeoutRef.current) clearTimeout(movementTimeoutRef.current);
      const animationDurationInMs = parseFloat(animationDuration.replace('s', '')) * 1000;
      
      movementTimeoutRef.current = setTimeout(() => {
        if (gameStateRef.current === 'playing') {
          moveTarget(targetId);
        }
      }, animationDurationInMs + pauseDuration);

      return currentTargets.map(t => t.id === targetId ? updatedTarget : t);
    });
  }, [pauseDuration, animationDuration]);

  const spawnNewTarget = useCallback(() => {
    if (!gameAreaRef.current) return;

    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
    }
    
    const gameArea = gameAreaRef.current.getBoundingClientRect();
    let size;
    if (gameMode === 'tracking' && trackingDifficulty === 'hard') {
      size = 60;
    } else {
      size = Math.floor(Math.random() * 40) + 40;
    }
    
    const x = Math.random() * (gameArea.width - size);
    const y = Math.random() * (gameArea.height - size);

    let type: 'left' | 'right';
    if (leftClickEnabled && rightClickEnabled) {
      type = Math.random() < 0.5 ? 'left' : 'right';
    } else if (rightClickEnabled) {
      type = 'right';
    } else {
      type = 'left';
    }
    
    const newTarget: Target = { id: Date.now(), x, y, size, type };
    setTargets([newTarget]);

    if (gameMode === 'tracking') {
       movementTimeoutRef.current = setTimeout(() => moveTarget(newTarget.id), 10);
    }
  }, [leftClickEnabled, rightClickEnabled, gameMode, moveTarget, trackingDifficulty]);

  const startGame = useCallback(() => {
    setScore(0);
    setHits(0);
    setMisses(0);
    setGameState('countdown');
    setCountdown(3);

    if (gameMode === 'follow') {
        setTimeSurvived(0);
        setTrail([]);
        setArrowRotation(0);
        hasMouseEnteredRef.current = false;
        cursorRef.current = null;
    } else {
        setTimeLeft(GAME_DURATION_S);
        setTargets([]);
    }
  }, [gameMode]);

  // Spawn initial target for classic/tracking modes
  useEffect(() => {
    if (gameState === 'playing' && gameMode !== 'follow' && targets.length === 0) {
      spawnNewTarget();
    }
  }, [gameState, gameMode, targets.length, spawnNewTarget]);

  // Timer for classic/tracking modes
  useEffect(() => {
    if (gameState !== 'playing' || gameMode === 'follow') {
      if (movementTimeoutRef.current) clearTimeout(movementTimeoutRef.current);
      return;
    };
    if (timeLeft <= 0) {
      setGameState('gameOver');
      setTargets([]);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [gameState, timeLeft, gameMode]);

  // Countdown timer effect
  useEffect(() => {
    if (gameState === 'countdown' && countdown === 3 && gameMode === 'follow') {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        const startX = rect.width / 2;
        const startY = rect.height / 2;
        arrowRef.current = { ...arrowRef.current, x: startX, y: startY };
        setArrowPosition({ x: startX, y: startY });
      }
    }

    if (gameState === 'countdown' && countdown !== null && countdown > 0) {
      const timerId = setTimeout(() => {
        setCountdown(c => (c ? c - 1 : null));
      }, 1000);
      return () => clearTimeout(timerId);
    } 
    
    else if (gameState === 'countdown' && countdown === 0) {
      setCountdown(null);
      
      if (gameMode === 'follow') {
          if (gameAreaRef.current) {
              const rect = gameAreaRef.current.getBoundingClientRect();
              const startX = arrowRef.current.x;
              const startY = arrowRef.current.y;
              
              arrowRef.current.startX = startX;
              arrowRef.current.startY = startY;
              arrowRef.current.destX = Math.random() * (rect.width - 32);
              arrowRef.current.destY = Math.random() * (rect.height - 32);
              
              const now = performance.now();
              arrowRef.current.startTime = now;
              gameStartTimeRef.current = now;
              trailDataRef.current = [];
  
              const dx = arrowRef.current.destX - startX;
              const dy = arrowRef.current.destY - startY;
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              setArrowRotation(angle);
          }
      }
      
      setGameState('playing');
    }
  }, [gameState, countdown, gameMode]);

  // Game loop for Follow Mode
  useEffect(() => {
    if (gameState !== 'playing' || gameMode !== 'follow') {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      return;
    }

    const gameLoop = (now: number) => {
        const arrow = arrowRef.current;
        const travelDuration = 3500;
        const elapsed = now - arrow.startTime;
        let currentX, currentY;

        if (elapsed >= travelDuration) {
            const gameArea = gameAreaRef.current?.getBoundingClientRect();
            if (gameArea) {
                const startX = arrow.destX;
                const startY = arrow.destY;
                arrowRef.current.startX = startX;
                arrowRef.current.startY = startY;
                
                let newX, newY;
                const MIN_DISTANCE = gameArea.width / 1.5;
                do {
                    newX = Math.random() * (gameArea.width - 32);
                    newY = Math.random() * (gameArea.height - 32);
                } while (Math.sqrt((newX - startX)**2 + (newY - startY)**2) < MIN_DISTANCE);

                arrowRef.current.destX = newX;
                arrowRef.current.destY = newY;
                arrowRef.current.startTime = now;
                currentX = startX;
                currentY = startY;

                const dx = newX - startX;
                const dy = newY - startY;
                const newAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                setArrowRotation(newAngle);
            } else {
                currentX = arrow.x;
                currentY = arrow.y;
            }
        } else {
            const progress = elapsed / travelDuration;
            currentX = arrow.startX + (arrow.destX - arrow.startX) * progress;
            currentY = arrow.startY + (arrow.destY - arrow.startY) * progress;
        }
        
        arrowRef.current.x = currentX;
        arrowRef.current.y = currentY;
        setArrowPosition({ x: currentX, y: currentY });

        const newTimeSurvived = Math.floor((now - gameStartTimeRef.current) / 1000);
        setTimeSurvived(newTimeSurvived);

        trailDataRef.current.push({ x: currentX, y: currentY, timestamp: now });
        while (trailDataRef.current.length > 0 && now - trailDataRef.current[0].timestamp > trailDuration) {
          trailDataRef.current.shift();
        }
        setTrail([...trailDataRef.current]);
        
        if (hasMouseEnteredRef.current && cursorRef.current) {
            if (now - gameStartTimeRef.current > 500) {
                const TRAIL_RADIUS = trailWidth / 2;
                const cursor = cursorRef.current;
                const isOnTrail = trailDataRef.current.some(point => Math.sqrt((cursor.x - point.x)**2 + (cursor.y - point.y)**2) < TRAIL_RADIUS);
                
                if (!isOnTrail) {
                    setGameState('gameOver');
                    return;
                }
            }
        }
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    return () => {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [gameState, gameMode, trailDuration, trailWidth]);

  const handleMiss = (e: React.MouseEvent) => {
    if (gameState !== 'playing' || !e.currentTarget.contains(e.target as Node)) return;
    setMisses(m => m + 1);
    setScore(s => Math.max(0, s - 50));
  };

  const handleTargetInteraction = (e: React.MouseEvent, target: Target) => {
    e.stopPropagation();
    e.preventDefault();

    const clickType = e.nativeEvent.button === 0 ? 'left' : 'right';
    
    if (clickType === target.type) {
      setScore(s => s + 100);
      setHits(h => h + 1);
      spawnNewTarget();
    } else {
      handleMiss(e);
    }
  };

  const handleFollowMouseMove = (e: React.MouseEvent) => {
    if (gameState !== 'playing' || gameMode !== 'follow' || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    cursorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
    };
  };

  const handleFollowMouseLeave = () => {
     if (gameState === 'playing' && gameMode === 'follow' && hasMouseEnteredRef.current) {
       setGameState('gameOver');
     }
  }
  
  const handleEndGameClick = () => {
    setGameState('gameOver');
  };

  const accuracy = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : "0.0";
  const disableStart = gameMode !== 'follow' && !leftClickEnabled && !rightClickEnabled;

  // Setup page - uses dashboard layout
  if (gameState === 'start') {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Crosshair className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Mouse Skills</CardTitle>
              <CardDescription className="mt-1">
                Test and improve your mouse precision
              </CardDescription>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure how the game behaves
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="fullscreen-toggle" className="font-medium cursor-pointer">
                      Auto Fullscreen
                    </Label>
                    <Switch 
                      id="fullscreen-toggle" 
                      checked={isFullscreenEnabled} 
                      onCheckedChange={setIsFullscreenEnabled} 
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Mode Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Choose Game Mode</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant={gameMode === 'classic' ? 'default' : 'outline'} 
                onClick={() => setGameMode('classic')} 
                className="h-auto py-4 flex-col"
              >
                <Gamepad2 className="h-5 w-5 mb-2" />
                <span className="text-sm font-medium">Classic</span>
              </Button>
              <Button 
                variant={gameMode === 'tracking' ? 'default' : 'outline'} 
                onClick={() => setGameMode('tracking')} 
                className="h-auto py-4 flex-col"
              >
                <Move className="h-5 w-5 mb-2" />
                <span className="text-sm font-medium">Tracking</span>
              </Button>
              <Button 
                variant={gameMode === 'follow' ? 'default' : 'outline'} 
                onClick={() => setGameMode('follow')} 
                className="h-auto py-4 flex-col"
              >
                <ChevronRight className="h-5 w-5 mb-2" />
                <span className="text-sm font-medium">Follow</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center min-h-[2.5rem] flex items-center justify-center px-4">
              {gameMode === 'classic' && 'Targets appear in one place. Click them quickly!'}
              {gameMode === 'tracking' && 'The target moves around. Track and click it!'}
              {gameMode === 'follow' && 'Keep your cursor inside the flying arrow trail!'}
            </p>
          </div>

          {/* Tracking Difficulty */}
          {gameMode === 'tracking' && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Difficulty</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant={trackingDifficulty === 'easy' ? 'default' : 'outline'} 
                  onClick={() => setTrackingDifficulty('easy')}
                  className="h-auto py-3"
                >
                  Easy
                </Button>
                <Button 
                  variant={trackingDifficulty === 'normal' ? 'default' : 'outline'} 
                  onClick={() => setTrackingDifficulty('normal')}
                  className="h-auto py-3"
                >
                  Normal
                </Button>
                <Button 
                  variant={trackingDifficulty === 'hard' ? 'default' : 'outline'} 
                  onClick={() => setTrackingDifficulty('hard')}
                  className="h-auto py-3"
                >
                  Hard
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {trackingDifficulty === 'easy' && 'Targets pause for 3 seconds'}
                {trackingDifficulty === 'normal' && 'Targets pause for 1.5 seconds'}
                {trackingDifficulty === 'hard' && 'Targets never stop moving!'}
              </p>
            </div>
          )}

          {/* Click Type Selection */}
          {gameMode !== 'follow' && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label className="text-base font-semibold">Click Types</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="left-click" 
                    checked={leftClickEnabled} 
                    onCheckedChange={(checked) => setLeftClickEnabled(Boolean(checked))} 
                  />
                  <Label htmlFor="left-click" className="cursor-pointer font-normal">
                    Left Click (Green Targets)
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="right-click" 
                    checked={rightClickEnabled} 
                    onCheckedChange={(checked) => setRightClickEnabled(Boolean(checked))} 
                  />
                  <Label htmlFor="right-click" className="cursor-pointer font-normal">
                    Right Click (Blue Targets)
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Start Button */}
          <Button 
            size="lg" 
            onClick={startGame} 
            disabled={disableStart} 
            className="w-full"
          >
            {disableStart ? 'Select a click type to start' : 'Start Game'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Game Over page
  if (gameState === 'gameOver') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            Game Over!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {gameMode === 'follow' ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground uppercase mb-2">Time Survived</p>
              <p className="text-6xl font-bold text-primary">{timeSurvived}s</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground uppercase mb-2">Final Score</p>
                <p className="text-4xl font-bold text-primary">{score}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase mb-2">Hits</p>
                <p className="text-4xl font-bold">{hits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase mb-2">Accuracy</p>
                <p className="text-4xl font-bold">{accuracy}%</p>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button size="lg" onClick={startGame}>
              Play Again
            </Button>
            <Button size="lg" onClick={() => setGameState('start')} variant="outline">
              Change Settings
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
      enableFullscreen={isFullscreenEnabled}
      onFullscreenExit={() => setGameState('gameOver')}
    >
      <div className="w-full h-full p-2 flex flex-col gap-2">
        {/* Stats Bar */}
        <div className="flex flex-wrap justify-between items-center gap-2 p-2 bg-card rounded-lg border">
          {gameMode === 'follow' ? (
            <div className="flex items-center gap-2 text-sm font-bold">
              <Timer className="w-4 h-4 text-primary" />
              <span>Time: {timeSurvived}s</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Timer className="w-4 h-4 text-primary" />
                <span>Time: {timeLeft}s</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>Score: {score}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <MousePointerClick className="w-4 h-4 text-green-500" />
                <span>Accuracy: {accuracy}%</span>
              </div>
            </>
          )}
          <Button onClick={handleEndGameClick} variant="destructive" size="sm">
            <StopCircle className="mr-2 h-4 w-4" />
            End Game
          </Button>
        </div>
        
        {/* Game Area */}
        <div
          ref={gameAreaRef}
          onClick={gameMode !== 'follow' ? handleMiss : undefined}
          onContextMenu={(e) => {
            if (gameMode !== 'follow') {
              e.preventDefault();
              handleMiss(e);
            }
          }}
          onMouseMove={gameMode === 'follow' ? handleFollowMouseMove : undefined}
          onMouseEnter={gameMode === 'follow' ? () => { hasMouseEnteredRef.current = true; } : undefined}
          onMouseLeave={gameMode === 'follow' ? handleFollowMouseLeave : undefined}
          className="relative flex-1 bg-card border-2 border-dashed border-primary rounded-lg overflow-hidden cursor-crosshair"
        >
          {/* Countdown Overlay */}
          {gameState === 'countdown' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 text-white">
              <p className="text-6xl font-bold animate-pulse">{countdown}</p>
            </div>
          )}

          {/* Follow Mode - Trail & Arrow */}
          {gameMode === 'follow' ? (
            <>
              <svg width="100%" height="100%" className="absolute top-0 left-0 pointer-events-none">
                {trail.map((p, i) => {
                  if (i === 0) return null;
                  const prev = trail[i-1];
                  const age = (performance.now() - p.timestamp) / trailDuration;
                  const opacity = Math.max(0, 1 - age);
                  return (
                    <line 
                      key={i} 
                      x1={prev.x} 
                      y1={prev.y} 
                      x2={p.x} 
                      y2={p.y} 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={trailWidth} 
                      strokeOpacity={opacity} 
                      strokeLinecap="round" 
                    />
                  );
                })}
              </svg>
              <div
                className="absolute z-10 pointer-events-none"
                style={{
                  left: arrowPosition.x,
                  top: arrowPosition.y,
                  transition: 'transform 0.1s linear',
                  transform: `translate(-50%, -50%) rotate(${arrowRotation}deg)`,
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="black"
                  strokeWidth="1"
                >
                  <path d="M8 5V19L19 12L8 5Z" />
                </svg>
              </div>
            </>
          ) : (
            /* Classic/Tracking Mode - Targets */
            targets.map(target => (
              <div
                key={target.id}
                className={cn(
                  "absolute rounded-full flex items-center justify-center cursor-pointer",
                  target.type === 'left' 
                    ? "bg-primary hover:bg-primary/80" 
                    : "bg-foreground hover:bg-foreground/80",
                )}
                style={{
                  left: `${target.x}px`,
                  top: `${target.y}px`,
                  width: `${target.size}px`,
                  height: `${target.size}px`,
                  transition: gameMode === 'tracking' 
                    ? `left ${animationDuration} linear, top ${animationDuration} linear` 
                    : 'none',
                }}
                onClick={(e) => handleTargetInteraction(e, target)}
                onContextMenu={(e) => handleTargetInteraction(e, target)}
              >
                <Crosshair className="w-1/2 h-1/2 text-primary-foreground" />
              </div>
            ))
          )}
        </div>
      </div>
    </GameContainer>
  );
}
