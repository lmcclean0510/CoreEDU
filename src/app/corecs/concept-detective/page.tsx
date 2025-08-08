
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertTriangle, LoaderCircle, CheckCircle, XCircle, Lightbulb, RefreshCw, Timer, Trophy, Brain, Target, Zap, BrainCircuit, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/UserProvider';
import { useToast } from '@/hooks/shared/use-toast';
import Link from 'next/link';
// Protected via server layout for /corecs; client wrapper not needed

// Types based on your flashcard structure
type Flashcard = {
  id: string;
  subject: string;
  examBoard: string;
  specification: string;
  specificationCode: string;
  specificationPoint: string;
  topic: string;
  subTopic: string;
  term: string;
  definition: string;
  alternativeDefinitions: string[];
  simpleDefinition: string;
  examples: string[];
  relatedTerms: string[];
  hints: string[];
};

type ContextChallenge = {
  id: string;
  flashcard: Flashcard;
  scenarios: string[];
  correctTerm: string;
  distractors: string[];
};

type FeedbackStatus = 'default' | 'correct' | 'incorrect';

function ConceptDetectiveContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  // Data state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<ContextChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<{ message: string; status: FeedbackStatus }>({ message: '', status: 'default' });
  const [showExplanation, setShowExplanation] = useState(false);

  // Settings
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes
  const [timerScore, setTimerScore] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Load flashcards on mount
  useEffect(() => {
    if (user) {
      fetchFlashcards();
    }
  }, [user]);

  const fetchFlashcards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const flashcardsRef = collection(db, 'flashcards');
      const q = query(
        flashcardsRef, 
        where('subject', '==', "GCSE Computer Science"), 
        orderBy('term')
      );
      const querySnapshot = await getDocs(q);
      const fetchedFlashcards = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Flashcard));

      if (fetchedFlashcards.length === 0) {
        setError("No flashcards were found. They may not have been added to the database yet.");
      } else {
        // Filter flashcards that have examples (needed for context switching)
        const flashcardsWithExamples = fetchedFlashcards.filter(card => 
          card.examples && card.examples.length >= 2
        );
        
        if (flashcardsWithExamples.length < 4) {
          setError("Not enough flashcards with sufficient examples found for this activity.");
        } else {
          setFlashcards(JSON.parse(JSON.stringify(flashcardsWithExamples)));
          generateChallenge(flashcardsWithExamples);
        }
      }
    } catch (err) {
      console.error("Error fetching flashcards:", err);
      setError("An error occurred while fetching flashcards. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const anonymizeScenario = (scenario: string, term: string): JSX.Element[] => {
    const patterns: string[] = [];
    
    // Extract abbreviation from parentheses first
    let abbreviation = '';
    if (term.includes('(') && term.includes(')')) {
      const abbrevMatch = term.match(/\(([^)]+)\)/);
      if (abbrevMatch) {
        abbreviation = abbrevMatch[1];
        patterns.push(abbreviation);
        patterns.push(abbreviation + 's');
      }
    }
    
    // Extract meaningful words from the term (excluding the abbreviation part)
    let cleanTerm = term;
    if (abbreviation) {
      cleanTerm = term.replace(/\s*\([^)]+\)/, '').trim();
    }
    
    // Split into words and filter out common words
    const stopWords = ['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'];
    const words = cleanTerm.toLowerCase().split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Add each meaningful word with variations
    words.forEach(word => {
      patterns.push(word);
      patterns.push(word + 's');
      
      // Add hyphenated variations for compound words
      patterns.push('\\w+-' + word);
      patterns.push('\\w+-' + word + 's');
      patterns.push(word + '-\\w+');
      patterns.push(word + 's-\\w+');
    });
    
    // Remove duplicates and sort by length (longest first)
    const uniquePatterns = [...new Set(patterns)].sort((a, b) => b.length - a.length);
    
    let processedScenario = scenario;
    
    // Replace each pattern
    uniquePatterns.forEach((pattern) => {
      let regex;
      
      if (pattern.includes('\\w+')) {
        // Pattern contains regex syntax, don't escape
        regex = new RegExp('\\b' + pattern + '\\b', 'gi');
      } else {
        // Literal pattern, escape special characters
        const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp('\\b' + escapedPattern + '\\b', 'gi');
      }
      
      processedScenario = processedScenario.replace(regex, '___PLACEHOLDER___');
    });
    
    // Split and create JSX elements
    const parts = processedScenario.split('___PLACEHOLDER___');
    const placeholderCount = (processedScenario.match(/___PLACEHOLDER___/g) || []).length;
    
    const result: JSX.Element[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        result.push(<span key={`text-${i}`}>{parts[i]}</span>);
      }
      
      if (i < placeholderCount) {
        result.push(
          <span 
            key={`placeholder-${i}`}
            className="inline-flex items-center justify-center px-3 py-1 mx-1 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-lg font-semibold text-primary shadow-sm"
          >
            <span className="text-sm">?</span>
          </span>
        );
      }
    }
    
    return result;
  };

  const generateChallenge = (availableFlashcards: Flashcard[] = flashcards) => {
    if (availableFlashcards.length < 4) {
      setError("Not enough flashcards available to generate a challenge.");
      return;
    }

    // Pick a random flashcard as the correct answer
    const correctCard = availableFlashcards[Math.floor(Math.random() * availableFlashcards.length)];
    
    // Pick 2-3 random examples from this card as scenarios
    const shuffledExamples = [...correctCard.examples].sort(() => 0.5 - Math.random());
    const scenarios = shuffledExamples.slice(0, Math.min(3, shuffledExamples.length));

    // Generate 3 distractors (wrong answers) from other flashcards
    const otherCards = availableFlashcards.filter(card => card.id !== correctCard.id);
    const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3).map(card => card.term);

    // Create answer choices (correct + distractors) and shuffle
    const allChoices = [correctCard.term, ...distractors].sort(() => 0.5 - Math.random());

    const challenge: ContextChallenge = {
      id: `challenge_${Date.now()}`,
      flashcard: correctCard,
      scenarios,
      correctTerm: correctCard.term,
      distractors: allChoices,
    };

    setCurrentChallenge(challenge);
    setSelectedAnswer('');
    setFeedback({ message: '', status: 'default' });
    setShowExplanation(false);
  };

  const checkAnswer = () => {
    if (!currentChallenge || !selectedAnswer) return;

    const isCorrect = selectedAnswer === currentChallenge.correctTerm;

    if (isTimerMode) {
      if (isCorrect) {
        setTimerScore(prev => prev + 1);
      }
      generateChallenge();
      setSelectedAnswer('');
      return;
    }

    if (isCorrect) {
      setFeedback({ 
        message: `Correct! Great job identifying ${currentChallenge.correctTerm}.`, 
        status: 'correct' 
      });
      setTimeout(() => {
        generateChallenge();
      }, 2000);
    } else {
      setFeedback({ 
        message: `Incorrect. The correct answer was ${currentChallenge.correctTerm}.`, 
        status: 'incorrect' 
      });
      setShowExplanation(true);
    }
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(seconds => seconds - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      toast({
        title: "Time's Up!",
        description: `You scored ${timerScore} points in the timer challenge!`,
      });
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, timerScore, toast]);

  const toggleTimerMode = (checked: boolean) => {
    setIsTimerMode(checked);
    if (checked) {
      setTimerSeconds(300);
      setTimerScore(0);
      setIsTimerRunning(true);
      generateChallenge();
    } else {
      setIsTimerRunning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFeedbackClass = (status: FeedbackStatus) => {
    if (status === 'correct') return 'text-success font-semibold flex items-center gap-2 justify-center';
    if (status === 'incorrect') return 'text-destructive font-semibold flex items-center gap-2 justify-center';
    return 'text-muted-foreground';
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Concept Detective</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-4">
              <Button asChild>
                <Link href="/corecs/gcse/flashcards">Back to Flashcards</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentChallenge) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Alert className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Challenge Available</AlertTitle>
          <AlertDescription>
            Unable to generate a challenge. Please try again.
            <div className="mt-4">
              <Button onClick={() => generateChallenge()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground mb-2">
          Concept Detective
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Master the art of recognizing key concepts across different scenarios. 
          This exercise builds transfer learning - essential for applying knowledge in exams.
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Timer Mode Controls */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-primary" />
                  <Label htmlFor="timer-mode" className="font-medium">Timer Challenge</Label>
                  <Switch 
                    id="timer-mode" 
                    checked={isTimerMode} 
                    onCheckedChange={toggleTimerMode} 
                  />
                </div>
                {isTimerMode && (
                  <>
                    <Badge variant="outline" className="font-mono">
                      {formatTime(timerSeconds)}
                    </Badge>
                    <Badge variant="default" className="font-mono">
                      Score: {timerScore}
                    </Badge>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>Challenge Mode</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Challenge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-6 h-6 text-primary" />
              Identify the Common Concept
            </CardTitle>
            <CardDescription>
              Read these scenarios carefully. What key computer science concept appears in all of them?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scenarios */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-lg font-medium">Scenarios:</Label>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Find the missing concept
                </Badge>
              </div>
              {currentChallenge.scenarios.map((scenario, index) => (
                <div key={index} className="relative p-6 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-muted-foreground/20 shadow-sm">
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {index + 1}
                    </Badge>
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {anonymizeScenario(scenario, currentChallenge.correctTerm)}
                  </p>
                </div>
              ))}
              <div className="text-center">
                <p className="text-sm text-muted-foreground italic">
                  What concept fits in all the highlighted spaces above?
                </p>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-lg font-medium">Select the concept that appears in all scenarios:</Label>
                <Badge variant="outline" className="text-xs">
                  Choose wisely
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentChallenge.distractors.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(option)}
                    disabled={feedback.status === 'correct' || (isTimerMode && !isTimerRunning)}
                    className={cn(
                      "p-4 text-left border rounded-xl transition-all duration-200 group",
                      "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      selectedAnswer === option
                        ? "border-primary bg-primary/5 font-medium shadow-md ring-2 ring-primary/20"
                        : "border-input bg-background hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors",
                        selectedAnswer === option
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 group-hover:border-primary/50"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 items-center justify-center pt-4">
              <Button 
                onClick={checkAnswer} 
                disabled={!selectedAnswer || feedback.status === 'correct' || (isTimerMode && !isTimerRunning)}
                className="min-w-32"
              >
                Submit Answer
              </Button>
              
              {!isTimerMode && (
                <Button 
                  onClick={() => generateChallenge()} 
                  variant="outline"
                  disabled={feedback.status === 'correct'}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Challenge
                </Button>
              )}
            </div>

            {/* Feedback */}
            {feedback.message && !isTimerMode && (
              <div className="text-center mt-6">
                <p className={cn("text-lg", getFeedbackClass(feedback.status))}>
                  {feedback.status === 'correct' && <CheckCircle className="h-6 w-6" />}
                  {feedback.status === 'incorrect' && <XCircle className="h-6 w-6" />}
                  {feedback.message}
                </p>
              </div>
            )}

            {/* Explanation */}
            {showExplanation && !isTimerMode && (
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Lightbulb className="w-5 h-5" />
                    Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p><strong>Correct Term:</strong> {currentChallenge.correctTerm}</p>
                  <p><strong>Definition:</strong> {currentChallenge.flashcard.simpleDefinition}</p>
                  <div>
                    <p className="font-medium mb-2">Why this appears in all scenarios:</p>
                    <p className="text-sm text-muted-foreground">
                      {currentChallenge.flashcard.definition}
                    </p>
                  </div>
                  {currentChallenge.flashcard.relatedTerms.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Related concepts:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentChallenge.flashcard.relatedTerms.slice(0, 4).map((term, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">
                Practice mode active - focus on learning the patterns!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ConceptDetectivePage() {
    return <ConceptDetectiveContent />
}
