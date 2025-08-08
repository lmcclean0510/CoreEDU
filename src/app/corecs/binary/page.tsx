
"use client";

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, CheckCircle, XCircle, Lightbulb, Timer, Baby, Gamepad2, ArrowRight, LoaderCircle, Flame, Trophy, Settings, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/providers/UserProvider';
import { useToast } from '@/hooks/shared/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, type Timestamp } from 'firebase/firestore';


type BitStatus = 'default' | 'correct' | 'incorrect';

type Stats = {
  binToDen: { attempts: number; correct: number; incorrect: number; };
  denToBin: { attempts: number; correct: number; incorrect: number; };
  binaryFall?: { highScore: number; date: Timestamp | null };
  binaryBuilder?: { highScore: number; date: Timestamp | null };
}

const defaultStats: Stats = {
  binToDen: { attempts: 0, correct: 0, incorrect: 0 },
  denToBin: { attempts: 0, correct: 0, incorrect: 0 },
  binaryFall: { highScore: 0, date: null },
  binaryBuilder: { highScore: 0, date: null },
};

function BinaryPageContent() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Mode Toggles
  const [isEasyModeActive, setIsEasyModeActive] = useState(false);
  const [isTimerModeActive, setIsTimerModeActive] = useState(false);
  const [hidePlaceValues, setHidePlaceValues] = useState(false);


  // Derived settings from modes
  const bitCount = isEasyModeActive ? 4 : 8;
  const binaryPlaceValues = isEasyModeActive
    ? [8, 4, 2, 1]
    : [128, 64, 32, 16, 8, 4, 2, 1];
  const maxDenaryValue = isEasyModeActive ? 15 : 255;

  // State for Binary to Denary
  const [currentBinary, setCurrentBinary] = useState(Array(bitCount).fill('0').join(''));
  const [userDenary, setUserDenary] = useState('');
  const [binaryFeedback, setBinaryFeedback] = useState<{ message: string; status: BitStatus }>({ message: '', status: 'default' });
  const [isBinToDenHintOpen, setIsBinToDenHintOpen] = useState(false);


  // State for Denary to Binary
  const [currentDenary, setCurrentDenary] = useState(0);
  const [userBinary, setUserBinary] = useState(Array(bitCount).fill('0'));
  const [denaryFeedback, setDenaryFeedback] = useState<{ message: string; status: BitStatus }>({ message: '', status: 'default' });
  const [showHelp, setShowHelp] = useState(false);
  const [bitStatuses, setBitStatuses] = useState<BitStatus[]>(Array(bitCount).fill('default'));
  const [isDenToBinHintOpen, setIsDenToBinHintOpen] = useState(false);

  // State for Timer Mode
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [timerScore, setTimerScore] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [activeTab, setActiveTab] = useState('bin-to-den');

  // State for Statistics
  const [stats, setStats] = useState<Stats>(defaultStats);
  
  // Load stats from Firestore on mount
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);

      const loadStats = async () => {
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().corebinStats) {
                const fetchedStats = docSnap.data().corebinStats;
                setStats({ ...defaultStats, ...fetchedStats });
            } else {
                // If stats object doesn't exist, create it in Firestore
                await setDoc(userDocRef, { corebinStats: defaultStats }, { merge: true });
                setStats(defaultStats);
            }
        } catch (error) {
            console.error("Could not load stats from Firestore", error);
            toast({
                title: "Error",
                description: "Could not load your stats from the database.",
                variant: "destructive",
            });
        }
      };

      loadStats();
    }
  }, [user, toast]);

  const updatePracticeStats = useCallback((mode: 'binToDen' | 'denToBin', isSuccess: boolean) => {
    if (!user) return;

    // Optimistically update local state for a snappier UI
    setStats(prev => {
      const currentModeStats = prev[mode] || { attempts: 0, correct: 0, incorrect: 0 };
      return {
        ...prev,
        [mode]: {
          attempts: currentModeStats.attempts + 1,
          correct: currentModeStats.correct + (isSuccess ? 1 : 0),
          incorrect: currentModeStats.incorrect + (isSuccess ? 0 : 1),
        }
      };
    });

    // Update Firestore in the background
    const userDocRef = doc(db, 'users', user.uid);
    updateDoc(userDocRef, {
      [`corebinStats.${mode}.attempts`]: increment(1),
      [`corebinStats.${mode}.correct`]: increment(isSuccess ? 1 : 0),
      [`corebinStats.${mode}.incorrect`]: increment(isSuccess ? 0 : 1),
    }).catch(error => {
      console.error("Error updating stats:", error);
      toast({ title: "Sync Error", description: "Could not save your stats.", variant: "destructive" });
      // Note: Could add logic here to revert optimistic update on failure
    });
  }, [user, toast]);

  // --- Mode Change Logic ---
  const handleEasyModeToggle = (checked: boolean) => {
    setIsEasyModeActive(checked);
  };
  
  useEffect(() => {
    // This effect handles resetting the state when easy mode is toggled.
    const newBitCount = isEasyModeActive ? 4 : 8;
    setUserBinary(Array(newBitCount).fill('0'));
    setBitStatuses(Array(newBitCount).fill('default'));

    if (!isTimerModeActive) {
      if (activeTab === 'bin-to-den') {
        generateBinary();
      } else {
        generateDenary();
      }
    }
  }, [isEasyModeActive, activeTab, isTimerModeActive]);


  // --- Timer Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(seconds => seconds - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setIsTimerFinished(true);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, timerSeconds]);

  const toggleTimerMode = (checked: boolean) => {
    setIsTimerModeActive(checked);
    if (checked) {
      setTimerSeconds(120);
      setTimerScore(0);
      setIsTimerFinished(false);
      setBinaryFeedback({ message: '', status: 'default' });
      setDenaryFeedback({ message: '', status: 'default' });
      
      if (activeTab === 'bin-to-den') {
        generateBinary(true);
      } else {
        generateDenary(true);
      }
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  };

  const handlePlayAgain = () => {
    setIsTimerFinished(false);
    setTimerSeconds(120);
    setTimerScore(0);
    if (activeTab === 'bin-to-den') {
      generateBinary(true);
    } else {
      generateDenary(true);
    }
    setIsTimerRunning(true);
  };
  
  const handleExitTimerMode = () => {
    setIsTimerFinished(false);
    setIsTimerModeActive(false);
    setIsTimerRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  // --- Binary to Denary Logic ---
  const generateBinary = (isTimer: boolean = false) => {
    const randomBinary = Array.from({ length: bitCount }, () => Math.round(Math.random())).join('');
    setCurrentBinary(randomBinary);
    setUserDenary('');
    if (!isTimer) {
      setBinaryFeedback({ message: '', status: 'default' });
    }
  };

  const checkBinaryToDenary = () => {
    const userValue = parseInt(userDenary, 10);

    if (isTimerModeActive) {
        const correctValue = parseInt(currentBinary, 2);
        if (!isNaN(userValue) && userValue === correctValue) {
            setTimerScore(prev => prev + 1);
        }
        generateBinary(true);
        return;
    }

    if (isNaN(userValue)) {
        setBinaryFeedback({ message: 'Please enter a valid number.', status: 'incorrect' });
        return; // Don't count invalid input as an attempt
    }
    
    const correctValue = parseInt(currentBinary, 2);
    const isSuccess = userValue === correctValue;

    updatePracticeStats('binToDen', isSuccess);

    if (isSuccess) {
      setBinaryFeedback({ message: 'Correct!', status: 'correct' });
       setTimeout(() => {
        generateBinary();
      }, 1500);
    } else {
      setBinaryFeedback({ message: 'Incorrect. Try again!', status: 'incorrect' });
    }
  };

  // --- Denary to Binary Logic ---
  const generateDenary = (isTimer: boolean = false) => {
    const randomDenary = Math.floor(Math.random() * (maxDenaryValue + 1));
    setCurrentDenary(randomDenary);
    setUserBinary(Array(bitCount).fill('0'));
    if (!isTimer) {
      setDenaryFeedback({ message: '', status: 'default' });
      setBitStatuses(Array(bitCount).fill('default'));
    }
  };

  const handleBitClick = (index: number) => {
    if (denaryFeedback.status === 'correct') return;
    const newUserBinary = [...userBinary];
    newUserBinary[index] = newUserBinary[index] === '0' ? '1' : '0';
    setUserBinary(newUserBinary);
  };

  const checkDenaryToBinary = () => {
    const userBinaryString = userBinary.join('');
    
    if (userBinaryString.length !== bitCount) {
      setDenaryFeedback({ message: `Please fill in all ${bitCount} bits.`, status: 'incorrect' });
      return;
    }

    const correctBinaryString = currentDenary.toString(2).padStart(bitCount, '0');
    const isSuccess = userBinaryString === correctBinaryString;

    if (isTimerModeActive) {
        if (isSuccess) {
            setTimerScore(prev => prev + 1);
        }
        generateDenary(true);
        return;
    }
    
    updatePracticeStats('denToBin', isSuccess);
    
    if (isSuccess) {
      setDenaryFeedback({ message: 'Correct!', status: 'correct' });
      setBitStatuses(Array(bitCount).fill('correct'));
      setTimeout(() => {
        generateDenary();
      }, 1500);
    } else {
      setDenaryFeedback({ message: 'Incorrect. Try again!', status: 'incorrect' });
      if (showHelp) {
        const statuses = userBinary.map((bit, index) =>
          bit === correctBinaryString[index] ? 'correct' : 'incorrect'
        );
        setBitStatuses(statuses as BitStatus[]);
      } else {
        setBitStatuses(Array(bitCount).fill('default'));
      }
    }
  };
  
  const getFeedbackClass = (status: BitStatus) => {
    if (status === 'correct') return 'text-success font-semibold flex items-center gap-2';
    if (status === 'incorrect') return 'text-destructive font-semibold flex items-center gap-2';
    return 'text-muted-foreground';
  };
  
  const getBitInputClass = (status: BitStatus) => {
    if (status === 'correct') return 'border-success bg-success/10 focus-visible:ring-success';
    if (status === 'incorrect') return 'border-destructive bg-destructive/10 focus-visible:ring-destructive';
    return 'border-input bg-background hover:bg-muted';
  }
  
  const calculatePercentage = (correct: number, attempts: number) => {
    if (attempts === 0) return '0.0';
    return ((correct / attempts) * 100).toFixed(1);
  };

  const handleResetStats = async () => {
    if (!user) {
        toast({ title: "Not Signed In", description: "You must be signed in to reset stats.", variant: "destructive" });
        return;
    };
    
    // Optimistically update UI
    setStats(defaultStats);
    
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { corebinStats: defaultStats });
      toast({
          title: "Statistics Reset",
          description: "Your performance data has been cleared.",
      });
    } catch (error) {
      console.error("Error resetting stats:", error);
      toast({
          title: "Error",
          description: "Could not reset your stats. Please try again.",
          variant: "destructive",
      });
    }
  };

  // Generate initial numbers on component mount to avoid hydration errors
  useEffect(() => {
    generateBinary();
    generateDenary();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  const SettingsControls = () => {
    // Temporary state for the mobile settings dialog
    const [tempEasy, setTempEasy] = useState(isEasyModeActive);
    const [tempHard, setTempHard] = useState(hidePlaceValues);
    const [tempTimer, setTempTimer] = useState(isTimerModeActive);

    // Sync temp state when dialog opens
    const handleOpenChange = (open: boolean) => {
      if (open) {
        setTempEasy(isEasyModeActive);
        setTempHard(hidePlaceValues);
        setTempTimer(isTimerModeActive);
      }
    };

    // Apply settings when "Done" is clicked
    const handleApplySettings = () => {
      // Only apply if there's a change to avoid unnecessary re-renders/effect triggers
      if (isEasyModeActive !== tempEasy) {
        handleEasyModeToggle(tempEasy);
      }
      if (hidePlaceValues !== tempHard) {
        setHidePlaceValues(tempHard);
      }
      if (isTimerModeActive !== tempTimer) {
        toggleTimerMode(tempTimer);
      }
    };
    
    return (
    <>
      {/* Desktop inline controls */}
      <div className="hidden md:flex items-center gap-x-2">
        <div className="flex items-center gap-1 scale-90">
          <Baby className="w-4 h-4 text-success" />
          <Label htmlFor="easy-mode-desktop" className="text-xs font-medium whitespace-nowrap">Easy Mode</Label>
          <Switch id="easy-mode-desktop" checked={isEasyModeActive} onCheckedChange={handleEasyModeToggle} disabled={isTimerModeActive} />
        </div>
        <div className="flex items-center gap-1 scale-90">
          <Flame className="w-4 h-4 text-destructive" />
          <Label htmlFor="hard-mode-desktop" className="text-xs font-medium whitespace-nowrap">Hard Mode</Label>
          <Switch id="hard-mode-desktop" checked={hidePlaceValues} onCheckedChange={setHidePlaceValues} disabled={isTimerModeActive} />
        </div>
        <div className="flex items-center gap-1 scale-90">
          <Timer className="w-4 h-4 text-primary" />
          <Label htmlFor="timer-mode-desktop" className="text-xs font-medium whitespace-nowrap">Time Trial</Label>
          <Switch id="timer-mode-desktop" checked={isTimerModeActive} onCheckedChange={toggleTimerMode} />
        </div>
      </div>
      {/* Mobile dialog controls */}
      <div className="md:hidden">
        <Dialog onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isTimerModeActive} className="transition-transform hover:scale-110">
              <Settings className="w-5 h-5" />
              <span className="sr-only">Open settings</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Challenge Settings</DialogTitle>
              <DialogDescription>
                Customize your practice session.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="easy-mode-mobile" className="flex items-center gap-2"><Baby className="w-4 h-4 text-success" />Easy Mode</Label>
                <Switch id="easy-mode-mobile" checked={tempEasy} onCheckedChange={setTempEasy} disabled={tempTimer} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="hard-mode-mobile" className="flex items-center gap-2"><Flame className="w-4 h-4 text-destructive" />Hard Mode</Label>
                <Switch id="hard-mode-mobile" checked={tempHard} onCheckedChange={setTempHard} disabled={tempTimer} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="timer-mode-mobile" className="flex items-center gap-2"><Timer className="w-4 h-4 text-primary" />Time Trial</Label>
                <Switch id="timer-mode-mobile" checked={tempTimer} onCheckedChange={setTempTimer} />
              </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" onClick={handleApplySettings}>Done</Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

  // --- Render ---
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hint Dialogs */}
      <AlertDialog open={isBinToDenHintOpen} onOpenChange={setIsBinToDenHintOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-primary" />
                    How to Convert Binary to Denary
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="pt-4 text-left space-y-2 text-foreground">
                    <p>Use the place values to convert the binary number. For each <strong>1</strong> in the binary string, add the corresponding place value to your total.</p>
                    <p><strong>Example:</strong> For the binary number <strong>10110000</strong></p>
                    <ul className="list-disc list-inside pl-4">
                        <li>There is a <strong>1</strong> in the 128s place.</li>
                        <li>There is a <strong>1</strong> in the 32s place.</li>
                        <li>There is a <strong>1</strong> in the 16s place.</li>
                    </ul>
                    <p className="font-semibold">Total: 128 + 32 + 16 = 176</p>
                  </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setIsBinToDenHintOpen(false)}>Got it!</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDenToBinHintOpen} onOpenChange={setIsDenToBinHintOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                      <Lightbulb className="w-6 h-6 text-primary" />
                      How to Convert Denary to Binary
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="pt-4 text-left space-y-2 text-foreground">
                      <p>Work from left (most significant bit) to right (least significant bit). For each place value, ask:</p>
                      <p>"Is my number greater than or equal to this place value?"</p>
                      <ul className="list-disc list-inside pl-4">
                          <li><strong>If YES:</strong> Put a <strong>1</strong> in that column and <strong>subtract</strong> the place value from your number.</li>
                          <li><strong>If NO:</strong> Put a <strong>0</strong> in that column.</li>
                      </ul>
                      <p>Then, move to the next smaller place value with your new number.</p>
                      <p className="font-semibold">Example: Convert 150</p>
                      <p>150 &ge; 128? <strong>Yes</strong>. (1) &rarr; Remainder: 22</p>
                      <p>22 &ge; 64? <strong>No</strong>. (0)</p>
                      <p>22 &ge; 32? <strong>No</strong>. (0)</p>
                      <p>22 &ge; 16? <strong>Yes</strong>. (1) &rarr; Remainder: 6</p>
                      <p>6 &ge; 8? <strong>No</strong>. (0)</p>
                      <p>6 &ge; 4? <strong>Yes</strong>. (1) &rarr; Remainder: 2</p>
                      <p>2 &ge; 2? <strong>Yes</strong>. (1) &rarr; Remainder: 0</p>
                      <p>0 &ge; 1? <strong>No</strong>. (0)</p>
                      <p className="font-semibold">Result: 10010110</p>
                    </div>
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setIsDenToBinHintOpen(false)}>Got it!</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isTimerFinished} onOpenChange={setIsTimerFinished}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Time's Up!</AlertDialogTitle>
                  <AlertDialogDescription>
                      Great effort! Here's your score.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="text-center my-4">
                  <p className="text-lg">You scored</p>
                  <p className="text-6xl font-bold text-primary">{timerScore}</p>
                  <p className="text-lg">points!</p>
              </div>
              <AlertDialogFooter>
                  <Button onClick={handlePlayAgain}>Play Again</Button>
                  <Button variant="outline" onClick={handleExitTimerMode}>Exit Timer Mode</Button>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>


      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground">Binary Conversion</h1>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <Card>
            <CardContent className="p-4 sm:p-6">
                <div className="flex justify-center flex-col sm:flex-row gap-4 mb-6">
                    <Button
                        variant={activeTab === 'bin-to-den' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('bin-to-den')}
                        disabled={isTimerModeActive}
                        className="flex-1"
                    >
                        Binary to Denary
                    </Button>
                    <Button
                        variant={activeTab === 'den-to-bin' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('den-to-bin')}
                        disabled={isTimerModeActive}
                        className="flex-1"
                    >
                        Denary to Binary
                    </Button>
                    <Button
                        variant={activeTab === 'stats' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('stats')}
                        disabled={isTimerModeActive}
                        className="flex-1"
                    >
                        Statistics
                    </Button>
                </div>
                
                <div className="mt-4">
                  {isTimerModeActive && !isTimerFinished && (
                      <div className="flex justify-between items-center p-2 bg-muted rounded-lg mb-4">
                          <div className="flex items-center gap-2 text-sm font-bold">
                              <Timer className="w-4 h-4 text-primary" />
                              <span className="font-mono">{formatTime(timerSeconds)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold">
                              <Trophy className="w-5 h-5 text-yellow-500" />
                              <span className="font-mono">{timerScore}</span>
                          </div>
                          <Button onClick={handleExitTimerMode} variant="destructive" size="sm">
                              <StopCircle className="mr-1.5" />
                              Exit Trial
                          </Button>
                      </div>
                  )}
              
                  {activeTab === 'bin-to-den' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <CardTitle>Binary to Denary Conversion</CardTitle>
                        <SettingsControls />
                      </div>
                      <CardDescription>Convert the given binary number into its denary (base-10) equivalent.</CardDescription>
                      <div>
                        <table className="w-full table-fixed text-center mb-2">
                          {!hidePlaceValues && (
                            <thead>
                              <tr className="text-sm text-muted-foreground">
                                {binaryPlaceValues.map(val => <th key={val} className="w-1/8 font-medium">{val}</th>)}
                              </tr>
                            </thead>
                          )}
                          <tbody>
                            <tr>
                              {currentBinary.split('').map((bit, index) => (
                                <td key={index} className="p-1">
                                  <p className="binary-cell font-mono text-lg bg-muted p-2 rounded-md">{bit}</p>
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="denaryAnswer">Your Answer (Denary)</Label>
                        <Input 
                          id="denaryAnswer"
                          type="number"
                          inputMode="numeric"
                          placeholder="e.g. 170"
                          value={userDenary}
                          onChange={(e) => setUserDenary(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && checkBinaryToDenary()}
                          disabled={!isTimerRunning && isTimerModeActive}
                          className={cn(getBitInputClass(binaryFeedback.status))}
                        />
                      </div>
                      <div className="flex flex-wrap gap-4 items-center justify-center">
                        <Button onClick={checkBinaryToDenary} disabled={(!isTimerRunning && isTimerModeActive) || binaryFeedback.status === 'correct'}>Submit Answer</Button>
                        <Button onClick={() => setIsBinToDenHintOpen(true)} variant="outline" disabled={isTimerModeActive}>
                            <Lightbulb className="mr-2 h-4 w-4" />
                            Hint
                        </Button>
                        <Button onClick={() => generateBinary()} variant="outline" disabled={isTimerModeActive}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          New Number
                        </Button>
                      </div>
                      {!isTimerModeActive && binaryFeedback.message && (
                        <p className={cn("text-center mt-3", getFeedbackClass(binaryFeedback.status))}>
                           {binaryFeedback.status === 'correct' && <CheckCircle className="h-5 w-5" />}
                           {binaryFeedback.status === 'incorrect' && <XCircle className="h-5 w-5" />}
                          {binaryFeedback.message}
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'den-to-bin' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <CardTitle>Denary to Binary Conversion</CardTitle>
                        <SettingsControls />
                      </div>
                      <CardDescription>Convert the given denary number into its {bitCount}-bit binary equivalent.</CardDescription>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div>
                              <Label>Convert this number:</Label>
                              <p className="text-4xl font-bold text-primary font-mono">{currentDenary}</p>
                          </div>
                          {!isTimerModeActive && (
                            <div className="flex items-center space-x-2">
                                <Checkbox id="helpToggle" checked={showHelp} onCheckedChange={(checked) => setShowHelp(Boolean(checked))} />
                                <Label htmlFor="helpToggle">Show Help</Label>
                            </div>
                          )}
                      </div>
                      <div>
                        <div className="grid grid-cols-8 text-center mb-1">
                          {!hidePlaceValues && (
                            binaryPlaceValues.map(val => (
                              <div key={val} className="text-sm text-muted-foreground font-medium">{val}</div>
                            ))
                          )}
                        </div>
                        <div className={cn("grid gap-1", isEasyModeActive ? 'grid-cols-4' : 'grid-cols-8')}>
                          {userBinary.map((bit, index) => (
                            <button
                              key={index}
                              onClick={() => handleBitClick(index)}
                              disabled={(!isTimerRunning && isTimerModeActive) || denaryFeedback.status === 'correct'}
                              className={cn(
                                "h-12 w-full flex items-center justify-center text-lg font-mono rounded-md border transition-colors",
                                getBitInputClass(bitStatuses[index])
                              )}
                            >
                              {bit}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 items-center justify-center">
                          <Button onClick={checkDenaryToBinary} disabled={(!isTimerRunning && isTimerModeActive) || denaryFeedback.status === 'correct'}>Submit Answer</Button>
                          <Button onClick={() => setIsDenToBinHintOpen(true)} variant="outline" disabled={isTimerModeActive}>
                              <Lightbulb className="mr-2 h-4 w-4" />
                              Hint
                          </Button>
                          <Button onClick={() => generateDenary()} variant="outline" disabled={isTimerModeActive}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              New Number
                          </Button>
                      </div>
                      {!isTimerModeActive && denaryFeedback.message && (
                          <p className={cn("text-center mt-3", getFeedbackClass(denaryFeedback.status))}>
                              {denaryFeedback.status === 'correct' && <CheckCircle className="h-5 w-5" />}
                              {denaryFeedback.status === 'incorrect' && <XCircle className="h-5 w-5" />}
                              {denaryFeedback.message}
                          </p>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'stats' && (
                    <div className="space-y-6">
                      <CardTitle>Your Performance Statistics</CardTitle>
                      <CardDescription>Here's a summary of your performance. Data is synced to your account and available across all your devices.</CardDescription>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 border rounded-lg bg-card-foreground/5">
                          <h3 className="text-lg font-semibold text-center mb-4">Binary to Denary Practice</h3>
                          <div className="space-y-2 font-mono text-center">
                             <p>Attempts: {stats.binToDen.attempts}</p>
                             <p className="text-success">Correct: {stats.binToDen.correct}</p>
                             <p className="text-destructive">Incorrect: {stats.binToDen.incorrect}</p>
                             <p className="font-bold text-primary text-xl mt-2">
                                Score: {calculatePercentage(stats.binToDen.correct, stats.binToDen.attempts)}%
                             </p>
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg bg-card-foreground/5">
                          <h3 className="text-lg font-semibold text-center mb-4">Denary to Binary Practice</h3>
                          <div className="space-y-2 font-mono text-center">
                             <p>Attempts: {stats.denToBin.attempts}</p>
                             <p className="text-success">Correct: {stats.denToBin.correct}</p>
                             <p className="text-destructive">Incorrect: {stats.denToBin.incorrect}</p>
                             <p className="font-bold text-primary text-xl mt-2">
                                Score: {calculatePercentage(stats.denToBin.correct, stats.denToBin.attempts)}%
                             </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <Card className="p-4 bg-card-foreground/5">
                            <CardHeader className="p-2 text-center">
                              <CardTitle className="text-lg font-semibold flex items-center justify-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Binary Fall High Score
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 text-center">
                                <p className="text-4xl font-bold font-mono">{stats.binaryFall?.highScore || 0}</p>
                                <p className="text-sm text-muted-foreground">
                                    {stats.binaryFall?.date ? `Achieved on ${stats.binaryFall.date.toDate().toLocaleDateString()}` : 'No high score yet.'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="p-4 bg-card-foreground/5">
                            <CardHeader className="p-2 text-center">
                              <CardTitle className="text-lg font-semibold flex items-center justify-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Binary Builder High Score
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 text-center">
                                <p className="text-4xl font-bold font-mono">{stats.binaryBuilder?.highScore || 0}</p>
                                <p className="text-sm text-muted-foreground">
                                    {stats.binaryBuilder?.date ? `Achieved on ${stats.binaryBuilder.date.toDate().toLocaleDateString()}` : 'No high score yet.'}
                                </p>
                            </CardContent>
                        </Card>
                      </div>
                      <div className="flex justify-center pt-4">
                        <Button onClick={handleResetStats} variant="destructive">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reset All Statistics
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="w-full max-w-4xl mx-auto mt-12 text-center">
        <h2 className="text-3xl font-bold font-headline mb-6 flex items-center justify-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            Up for a Challenge?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="text-center border-2 border-transparent hover:border-primary transition-shadow duration-300 flex flex-col">
              <CardHeader className="flex-grow">
                <CardTitle className="text-2xl font-headline">
                  Binary Fall
                </CardTitle>
                <CardDescription>
                  Convert falling binary numbers to denary before the stack overflows! A fast-paced conversion challenge.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/corelabs/binary-game" passHref>
                  <Button>
                    Play Binary Fall
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="text-center border-2 border-transparent hover:border-primary transition-shadow duration-300 flex flex-col">
              <CardHeader className="flex-grow">
                <CardTitle className="text-2xl font-headline">
                  Binary Builder
                </CardTitle>
                <CardDescription>
                  Convert denary numbers to binary by clicking the bits. A test of your binary construction skills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/corelabs/denary-game" passHref>
                  <Button>
                    Play Binary Builder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

export default function BinaryPage() {
    return (
            <BinaryPageContent />
    )
}
