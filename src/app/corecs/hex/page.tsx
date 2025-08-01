
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, CheckCircle, XCircle, Lightbulb, Timer, Baby, ArrowDown, Flame, Trophy, Settings, StopCircle } from 'lucide-react';
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
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

type BitStatus = 'default' | 'correct' | 'incorrect';

function HexPageContent() {
// Mode Toggles
const [isEasyModeActive, setIsEasyModeActive] = useState(false);
const [isTimerModeActive, setIsTimerModeActive] = useState(false);
const [hidePlaceValues, setHidePlaceValues] = useState(false);
const [isTutorialMode, setIsTutorialMode] = useState(true);

// Derived settings from modes
const bitCount = isEasyModeActive ? 4 : 8;
const binaryPlaceValues = isEasyModeActive
? [8, 4, 2, 1]
: [128, 64, 32, 16, 8, 4, 2, 1];
const nibblePlaceValues = [8, 4, 2, 1];
const maxDenaryValue = isEasyModeActive ? 15 : 255;
const maxHexValue = isEasyModeActive ? 'F' : 'FF';

// State for Hex to Denary
const [currentHex, setCurrentHex] = useState('A7');
const [userDenary, setUserDenary] = useState('');
const [hexFeedback, setHexFeedback] = useState<{ message: string; status: BitStatus }>({ message: '', status: 'default' });
const [isHexToDenHintOpen, setIsHexToDenHintOpen] = useState(false);

// State for Denary to Hex
const [currentDenary, setCurrentDenary] = useState(0);
const [userBinary, setUserBinary] = useState(Array(bitCount).fill('0'));
const [userHex, setUserHex] = useState(isEasyModeActive ? ['0'] : ['0', '0']);
const [denaryFeedback, setDenaryFeedback] = useState<{ message: string; status: BitStatus }>({ message: '', status: 'default' });
const [showHelp, setShowHelp] = useState(false);
const [bitStatuses, setBitStatuses] = useState<BitStatus[]>(Array(bitCount).fill('default'));
const [hexStatuses, setHexStatuses] = useState<BitStatus[]>(Array(isEasyModeActive ? 1 : 2).fill('default'));
const [isDenToHexHintOpen, setIsDenToHexHintOpen] = useState(false);

// State for Timer Mode
const [timerSeconds, setTimerSeconds] = useState(120);
const [timerScore, setTimerScore] = useState(0);
const [isTimerRunning, setIsTimerRunning] = useState(false);
const [isTimerFinished, setIsTimerFinished] = useState(false);
const [activeTab, setActiveTab] = useState('hex-to-den');

// Helper functions
const hexToDecimal = (hex: string): number => {
return parseInt(hex, 16);
};

const decimalToHex = (decimal: number): string => {
return decimal.toString(16).toUpperCase();
};

const hexToBinary = (hex: string): string => {
return parseInt(hex, 16).toString(2).padStart(bitCount, '0');
};

const binaryToHex = (binary: string): string => {
return parseInt(binary, 2).toString(16).toUpperCase();
};

const splitIntoNibbles = (binary: string): string[] => {
if (isEasyModeActive) {
return [binary];
}
return [binary.slice(0, 4), binary.slice(4, 8)];
};

const generateHex = (isTimer: boolean = false) => {
const randomDecimal = Math.floor(Math.random() * (maxDenaryValue + 1));
const hexValue = decimalToHex(randomDecimal).padStart(isEasyModeActive ? 1 : 2, '0');
setCurrentHex(hexValue);
setUserDenary('');
if (!isTimer) {
setHexFeedback({ message: '', status: 'default' });
}
};

const generateDenary = (isTimer: boolean = false) => {
const randomDenary = Math.floor(Math.random() * (maxDenaryValue + 1));
setCurrentDenary(randomDenary);
setUserBinary(Array(bitCount).fill('0'));
setUserHex(isEasyModeActive ? ['0'] : ['0', '0']);
if (!isTimer) {
setDenaryFeedback({ message: '', status: 'default' });
setBitStatuses(Array(bitCount).fill('default'));
setHexStatuses(Array(isEasyModeActive ? 1 : 2).fill('default'));
}
};

// --- Mode Change Logic ---
const handleEasyModeToggle = (checked: boolean) => {
setIsEasyModeActive(checked);
};

useEffect(() => {
const newBitCount = isEasyModeActive ? 4 : 8;
const newHexLength = isEasyModeActive ? 1 : 2;
setUserBinary(Array(newBitCount).fill('0'));
setUserHex(Array(newHexLength).fill('0'));
setBitStatuses(Array(newBitCount).fill('default'));
setHexStatuses(Array(newHexLength).fill('default'));

if (!isTimerModeActive) {
if (activeTab === 'hex-to-den') {
generateHex();
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
setHexFeedback({ message: '', status: 'default' });
setDenaryFeedback({ message: '', status: 'default' });

if (activeTab === 'hex-to-den') {
generateHex(true);
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
if (activeTab === 'hex-to-den') {
generateHex(true);
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

// --- Hex to Denary Logic ---
const checkHexToDenary = () => {
const userValue = parseInt(userDenary, 10);

if (isTimerModeActive) {
const correctValue = hexToDecimal(currentHex);
if (!isNaN(userValue) && userValue === correctValue) {
setTimerScore(prev => prev + 1);
}
generateHex(true);
return;
}

if (isNaN(userValue)) {
setHexFeedback({ message: 'Please enter a valid number.', status: 'incorrect' });
return;
}

const correctValue = hexToDecimal(currentHex);
const isSuccess = userValue === correctValue;

if (isSuccess) {
setHexFeedback({ message: 'Correct!', status: 'correct' });
setTimeout(() => {
generateHex();
}, 1500);
} else {
setHexFeedback({ message: 'Incorrect. Try again!', status: 'incorrect' });
}
};

// --- Denary to Hex Logic ---
const handleBitClick = (index: number) => {
if (denaryFeedback.status === 'correct') return;
const newUserBinary = [...userBinary];
newUserBinary[index] = newUserBinary[index] === '0' ? '1' : '0';
setUserBinary(newUserBinary);

// Auto-update hex when binary changes
const nibbles = splitIntoNibbles(newUserBinary.join(''));
const newHex = nibbles.map(nibble => {
const decimal = parseInt(nibble, 2);
return decimal.toString(16).toUpperCase();
});
setUserHex(newHex);
};

const handleHexInputChange = (index: number, value: string) => {
if (denaryFeedback.status === 'correct') return;

const upperValue = value.toUpperCase();
if (upperValue === '' || /^[0-9A-F]$/.test(upperValue)) {
const newHex = [...userHex];
newHex[index] = upperValue;
setUserHex(newHex);

// Auto-update binary when hex changes
try {
const fullHex = newHex.join('').padEnd(isEasyModeActive ? 1 : 2, '0');
const binary = hexToBinary(fullHex);
setUserBinary(binary.split(''));
} catch (error) {
// Invalid hex, don't update binary
}
}
};

const checkDenaryToHex = () => {
const userHexString = userHex.join('');
const correctHexString = decimalToHex(currentDenary).padStart(isEasyModeActive ? 1 : 2, '0');
const isSuccess = userHexString === correctHexString;

if (isTimerModeActive) {
if (isSuccess) {
setTimerScore(prev => prev + 1);
}
generateDenary(true);
return;
}

if (isSuccess) {
setDenaryFeedback({ message: 'Correct!', status: 'correct' });
setBitStatuses(Array(bitCount).fill('correct'));
setHexStatuses(Array(isEasyModeActive ? 1 : 2).fill('correct'));
setTimeout(() => {
generateDenary();
}, 1500);
} else {
setDenaryFeedback({ message: 'Incorrect. Try again!', status: 'incorrect' });
if (showHelp) {
const correctBinary = currentDenary.toString(2).padStart(bitCount, '0');
const bitStatuses = userBinary.map((bit, index) =>
bit === correctBinary[index] ? 'correct' : 'incorrect'
);
setBitStatuses(bitStatuses as BitStatus[]);

const hexStatuses = userHex.map((hex, index) =>
hex === correctHexString[index] ? 'correct' : 'incorrect'
);
setHexStatuses(hexStatuses as BitStatus[]);
} else {
setBitStatuses(Array(bitCount).fill('default'));
setHexStatuses(Array(isEasyModeActive ? 1 : 2).fill('default'));
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
};

// Settings Controls Component
const SettingsControls = () => {
const [tempEasy, setTempEasy] = useState(isEasyModeActive);
const [tempHard, setTempHard] = useState(hidePlaceValues);
const [tempTimer, setTempTimer] = useState(isTimerModeActive);
const [tempTutorial, setTempTutorial] = useState(isTutorialMode);

const handleOpenChange = (open: boolean) => {
if (open) {
setTempEasy(isEasyModeActive);
setTempHard(hidePlaceValues);
setTempTimer(isTimerModeActive);
setTempTutorial(isTutorialMode);
}
};

const handleApplySettings = () => {
if (isEasyModeActive !== tempEasy) {
handleEasyModeToggle(tempEasy);
}
if (hidePlaceValues !== tempHard) {
setHidePlaceValues(tempHard);
}
if (isTutorialMode !== tempTutorial) {
setIsTutorialMode(tempTutorial);
}
if (isTimerModeActive !== tempTimer) {
toggleTimerMode(tempTimer);
}
};

return (
<>
<div className="hidden md:flex items-center gap-x-2">
<div className="flex items-center gap-1 scale-90">
<Lightbulb className="w-4 h-4 text-blue-500" />
<Label htmlFor="tutorial-mode-desktop" className="text-xs font-medium whitespace-nowrap">Tutorial</Label>
<Switch id="tutorial-mode-desktop" checked={isTutorialMode} onCheckedChange={setIsTutorialMode} disabled={isTimerModeActive} />
</div>
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
<Label htmlFor="tutorial-mode-mobile" className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-blue-500" />Tutorial Mode</Label>
<Switch id="tutorial-mode-mobile" checked={tempTutorial} onCheckedChange={setTempTutorial} disabled={tempTimer} />
</div>
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
};

// Generate initial numbers on component mount
useEffect(() => {
generateHex();
generateDenary();
}, []);

return (
<div className="container mx-auto py-8 px-4">
{/* Hint Dialogs */}
<AlertDialog open={isHexToDenHintOpen} onOpenChange={setIsHexToDenHintOpen}>
<AlertDialogContent>
<AlertDialogHeader>
<AlertDialogTitle className="flex items-center gap-2">
  <Lightbulb className="w-6 h-6 text-primary" />
  How to Convert Hex to Denary
</AlertDialogTitle>
<AlertDialogDescription asChild>
<div className="pt-4 text-left space-y-2 text-foreground">
  <p>Convert each hex digit to a 4-bit binary nibble, then combine them into full binary, then use place values.</p>
  <p><strong>Example:</strong> For the hex number <strong>A7</strong></p>
  <ul className="list-disc list-inside pl-4">
      <li><strong>A</strong> = 10 in denary = <strong>1010</strong> in binary</li>
      <li><strong>7</strong> = 7 in denary = <strong>0111</strong> in binary</li>
      <li>Combined binary: <strong>10100111</strong></li>
      <li>Place values: 128 + 32 + 4 + 2 + 1 = <strong>167</strong></li>
  </ul>
</div>
</AlertDialogDescription>
</AlertDialogHeader>
<AlertDialogFooter>
<AlertDialogAction onClick={() => setIsHexToDenHintOpen(false)}>Got it!</AlertDialogAction>
</AlertDialogFooter>
</AlertDialogContent>
</AlertDialog>

<AlertDialog open={isDenToHexHintOpen} onOpenChange={setIsDenToHexHintOpen}>
<AlertDialogContent>
<AlertDialogHeader>
<AlertDialogTitle className="flex items-center gap-2">
    <Lightbulb className="w-6 h-6 text-primary" />
    How to Convert Denary to Hex
</AlertDialogTitle>
<AlertDialogDescription asChild>
  <div className="pt-4 text-left space-y-2 text-foreground">
    <p>First convert denary to binary using place values, then group into 4-bit nibbles, then convert each nibble to hex.</p>
    <p className="font-semibold">Example: Convert 167</p>
    <p><strong>Step 1:</strong> Convert to binary using place values</p>
    <p>167 = 128 + 32 + 4 + 2 + 1 = <strong>10100111</strong></p>
    <p><strong>Step 2:</strong> Group into nibbles (4 bits each)</p>
    <p><strong>1010</strong> | <strong>0111</strong></p>
    <p><strong>Step 3:</strong> Convert each nibble to hex</p>
    <ul className="list-disc list-inside pl-4">
        <li><strong>1010</strong> = 8+2 = 10 = <strong>A</strong> in hex</li>
        <li><strong>0111</strong> = 4+2+1 = 7 = <strong>7</strong> in hex</li>
    </ul>
    <p className="font-semibold">Result: A7</p>
  </div>
</AlertDialogDescription>
</AlertDialogHeader>
<AlertDialogFooter>
<AlertDialogAction onClick={() => setIsDenToHexHintOpen(false)}>Got it!</AlertDialogAction>
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
<h1 className="text-3xl font-bold tracking-tighter text-foreground">Hexadecimal Conversion</h1>
</div>

<div className="w-full max-w-4xl mx-auto">
<Card>
<CardContent className="p-4 sm:p-6">
<div className="flex justify-center flex-col sm:flex-row gap-4 mb-6">
  <Button
      variant={activeTab === 'hex-to-den' ? 'default' : 'outline'}
      onClick={() => setActiveTab('hex-to-den')}
      disabled={isTimerModeActive}
      className="flex-1"
  >
      Hex to Denary
  </Button>
  <Button
      variant={activeTab === 'den-to-hex' ? 'default' : 'outline'}
      onClick={() => setActiveTab('den-to-hex')}
      disabled={isTimerModeActive}
      className="flex-1"
  >
      Denary to Hex
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

{activeTab === 'hex-to-den' && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <CardTitle>Hex to Denary Conversion</CardTitle>
      <SettingsControls />
    </div>
    <CardDescription>
      {isTutorialMode 
        ? "Convert the hex number to denary using the nibble method." 
        : "Convert the hex number to denary. Use the binary table to help you."}
    </CardDescription>
    
    <div className="text-center p-4 bg-muted rounded-lg">
      <Label className="text-lg">Hex Number:</Label>
      <p className="text-6xl font-bold text-primary font-mono">{currentHex}</p>
    </div>

    {isTutorialMode ? (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Step 1: Convert each hex digit to binary nibbles</h3>
          <div className={cn("grid gap-4 justify-center", isEasyModeActive ? "grid-cols-1" : "grid-cols-2")}>
            {currentHex.split('').map((hexDigit, index) => {
              const binary = parseInt(hexDigit, 16).toString(2).padStart(4, '0');
              return (
                <div key={index} className="p-3 border rounded-lg bg-card">
                  <p className="text-sm text-muted-foreground">Hex digit:</p>
                  <p className="text-2xl font-bold font-mono text-primary">{hexDigit}</p>
                  <ArrowDown className="w-4 h-4 mx-auto my-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Binary nibble:</p>
                  <p className="text-xl font-mono">{binary}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Step 2: Combine nibbles into full binary</h3>
          <div className="p-3 border rounded-lg bg-card inline-block">
            <p className="text-xl font-mono">{hexToBinary(currentHex)}</p>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Step 3: Use binary place values</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-center mb-2 max-w-2xl mx-auto">
              {!hidePlaceValues && (
                <thead>
                  <tr className="text-sm text-muted-foreground">
                    {binaryPlaceValues.map(val => <th key={val} className="w-1/8 font-medium p-1">{val}</th>)}
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  {hexToBinary(currentHex).split('').map((bit, index) => (
                    <td key={index} className="p-1">
                      <p className="font-mono text-lg bg-muted p-2 rounded-md">{bit}</p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ) : (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Convert using the binary table</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-center mb-2 max-w-2xl mx-auto">
            {!hidePlaceValues && (
              <thead>
                <tr className="text-sm text-muted-foreground">
                  {binaryPlaceValues.map(val => <th key={val} className="w-1/8 font-medium p-1">{val}</th>)}
                </tr>
              </thead>
            )}
            <tbody>
              <tr>
                <td colSpan={bitCount} className="p-2 text-sm text-muted-foreground">
                  Click the bits to build the binary equivalent of {currentHex}:
                </td>
              </tr>
              <tr>
                {userBinary.map((bit, index) => (
                  <td key={index} className="p-1">
                    <button
                      onClick={() => handleBitClick(index)}
                      disabled={(!isTimerRunning && isTimerModeActive) || hexFeedback.status === 'correct'}
                      className={cn(
                        "h-12 w-full flex items-center justify-center text-lg font-mono rounded-md border transition-colors",
                        getBitInputClass(bitStatuses[index])
                      )}
                    >
                      {bit}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )}

    <div className="space-y-2">
      <Label htmlFor="denaryAnswer">Your Answer (Denary)</Label>
      <Input 
        id="denaryAnswer"
        type="number"
        inputMode="numeric"
        placeholder="e.g. 167"
        value={userDenary}
        onChange={(e) => setUserDenary(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && checkHexToDenary()}
        disabled={!isTimerRunning && isTimerModeActive}
        className={cn(getBitInputClass(hexFeedback.status))}
      />
    </div>

    <div className="flex flex-wrap gap-4 items-center justify-center">
      <Button onClick={checkHexToDenary} disabled={(!isTimerRunning && isTimerModeActive) || hexFeedback.status === 'correct'}>Submit Answer</Button>
      <Button onClick={() => setIsHexToDenHintOpen(true)} variant="outline" disabled={isTimerModeActive}>
          <Lightbulb className="mr-2 h-4 w-4" />
          Hint
      </Button>
      <Button onClick={() => generateHex()} variant="outline" disabled={isTimerModeActive}>
        <RefreshCw className="mr-2 h-4 w-4" />
        New Number
      </Button>
    </div>

    {!isTimerModeActive && hexFeedback.message && (
      <p className={cn("text-center mt-3", getFeedbackClass(hexFeedback.status))}>
         {hexFeedback.status === 'correct' && <CheckCircle className="h-5 w-5" />}
         {hexFeedback.status === 'incorrect' && <XCircle className="h-5 w-5" />}
        {hexFeedback.message}
      </p>
    )}
  </div>
)}

{activeTab === 'den-to-hex' && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <CardTitle>Denary to Hex Conversion</CardTitle>
      <SettingsControls />
    </div>
    <CardDescription>
      {isTutorialMode 
        ? "Convert the denary number to hex using binary and the nibble method." 
        : "Convert the denary number to hex. First convert to binary, then work out the hex."}
    </CardDescription>
    
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

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Step 1: Convert to binary using place values</h3>
      <div className="overflow-x-auto">
        <div className={cn("grid gap-1", isEasyModeActive ? 'grid-cols-4' : 'grid-cols-8')}>
            {!hidePlaceValues && (
              binaryPlaceValues.map(val => <div key={val} className="text-center text-sm text-muted-foreground font-medium">{val}</div>)
            )}
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
    </div>

    {isTutorialMode ? (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Step 2: Group into nibbles (4 bits each)</h3>
        <div className={cn("grid gap-4 justify-center", isEasyModeActive ? "grid-cols-1" : "grid-cols-2")}>
          {splitIntoNibbles(userBinary.join('')).map((nibble, index) => (
            <div key={index} className="p-3 border rounded-lg bg-card">
              <p className="text-sm text-muted-foreground">Nibble {index + 1}:</p>
              <div className="grid grid-cols-4 gap-1 my-2">
                {!hidePlaceValues && (
                  <>
                    {nibblePlaceValues.map(val => (
                      <div key={val} className="text-xs text-muted-foreground text-center">{val}</div>
                    ))}
                  </>
                )}
                {nibble.split('').map((bit, bitIndex) => (
                  <div key={bitIndex} className="text-lg font-mono text-center p-1 bg-muted rounded">
                    {bit}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Value: {parseInt(nibble, 2)} = {parseInt(nibble, 2).toString(16).toUpperCase()} in hex
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Step 3: Combine nibbles to form hex answer</h3>
          <div className="text-center">
            <Label>Your Hex Answer:</Label>
            <div className={cn("flex gap-2 justify-center mt-2")}>
              {userHex.map((hex, index) => (
                <Input
                  key={index}
                  value={hex}
                  onChange={(e) => handleHexInputChange(index, e.target.value)}
                  disabled={(!isTimerRunning && isTimerModeActive) || denaryFeedback.status === 'correct'}
                  className={cn(
                    "w-16 h-16 text-center text-2xl font-mono font-bold",
                    getBitInputClass(hexStatuses[index])
                  )}
                  maxLength={1}
                  placeholder="0"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Enter hex digits (0-9, A-F)
            </p>
          </div>
        </div>
      </div>
    ) : (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Step 2: Convert your binary to hex</h3>
        <div className="text-center">
          <Label>Your Hex Answer:</Label>
          <div className={cn("flex gap-2 justify-center mt-2")}>
            {userHex.map((hex, index) => (
              <Input
                key={index}
                value={hex}
                onChange={(e) => handleHexInputChange(index, e.target.value)}
                disabled={(!isTimerRunning && isTimerModeActive) || denaryFeedback.status === 'correct'}
                className={cn(
                  "w-16 h-16 text-center text-2xl font-mono font-bold",
                  getBitInputClass(hexStatuses[index])
                )}
                maxLength={1}
                placeholder="0"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Work out the hex digits from your binary (0-9, A-F)
          </p>
        </div>
      </div>
    )}

    <div className="flex flex-wrap gap-4 items-center justify-center">
        <Button onClick={checkDenaryToHex} disabled={(!isTimerRunning && isTimerModeActive) || denaryFeedback.status === 'correct'}>Submit Answer</Button>
        <Button onClick={() => setIsDenToHexHintOpen(true)} variant="outline" disabled={isTimerModeActive}>
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
</div>
</CardContent>
</Card>
</div>
</div>
);
}

export default function HexPage() {
    return (
        <ProtectedRoute>
            <HexPageContent />
        </ProtectedRoute>
    )
}
