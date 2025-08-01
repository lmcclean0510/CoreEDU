
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Puzzle, PuzzleSection, FillInTheBlanksChallenge, FillInTheBlanksSection } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Blocks, Code, HelpCircle, Keyboard, LoaderCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/providers/UserProvider';

interface PuzzleData {
    puzzles: Puzzle[];
    puzzleSections: PuzzleSection[];
    fillInTheBlanksChallenges: FillInTheBlanksChallenge[];
    fillInTheBlanksSections: FillInTheBlanksSection[];
}

export function PuzzlesClient() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [data, setData] = useState<PuzzleData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeActivity, setActiveActivity] = useState<'jigsaw' | 'fill-in-the-blanks' | null>(null);
  
  const [isJigsawInfoDialogOpen, setIsJigsawInfoDialogOpen] = useState(false);
  const [isFillInTheBlanksInfoDialogOpen, setIsFillInTheBlanksInfoDialogOpen] = useState(false);
  
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          // Fetch all collections in parallel for performance
          const puzzleSectionsQuery = query(collection(db, 'puzzleSections'));
          const puzzlesQuery = query(collection(db, 'puzzles'), orderBy('challengeLevel'));
          const fitbSectionsQuery = query(collection(db, 'fillInTheBlanksSections'));
          const fitbChallengesQuery = query(collection(db, 'fillInTheBlanksChallenges'), orderBy('challengeLevel'));

          const [
            puzzleSectionsSnap,
            puzzlesSnap,
            fitbSectionsSnap,
            fitbChallengesSnap,
          ] = await Promise.all([
            getDocs(puzzleSectionsQuery),
            getDocs(puzzlesQuery),
            getDocs(fitbSectionsQuery),
            getDocs(fitbChallengesQuery),
          ]);

          const puzzleSections = puzzleSectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PuzzleSection[];
          const puzzles = puzzlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Puzzle[];
          const fillInTheBlanksSections = fitbSectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FillInTheBlanksSection[];
          const fillInTheBlanksChallenges = fitbChallengesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FillInTheBlanksChallenge[];
          
          setData({ puzzleSections, puzzles, fillInTheBlanksSections, fillInTheBlanksChallenges });
        } catch (error) {
          console.error("Failed to fetch puzzle data:", error);
          // You could show a toast message here
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    }
  }, [user]);

  const getPuzzlesForSection = (sectionId: string) => {
    return data?.puzzles
      .filter((p) => p.sectionId === sectionId)
      .sort((a, b) => a.challengeLevel - b.challengeLevel) || [];
  };
  
  const getFillInTheBlanksForSection = (sectionId: string) => {
    return data?.fillInTheBlanksChallenges
      .filter((p) => p.sectionId === sectionId)
      .sort((a, b) => a.challengeLevel - b.challengeLevel) || [];
  };

  const handleActivityToggle = (activity: 'jigsaw' | 'fill-in-the-blanks') => {
    setActiveActivity(prev => (prev === activity ? null : activity));
  };

  if (isAuthLoading || isLoadingData) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !data) {
    return null; // or a message indicating no data could be loaded
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Info Dialogs */}
      <AlertDialog open={isJigsawInfoDialogOpen} onOpenChange={setIsJigsawInfoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Blocks className="w-6 h-6 text-primary" />
              What is Coding Jigsaw?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-center">
              Piece together code blocks to solve challenges and learn Python fundamentals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsJigsawInfoDialogOpen(false)}>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isFillInTheBlanksInfoDialogOpen} onOpenChange={setIsFillInTheBlanksInfoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Keyboard className="w-6 h-6 text-primary" />
              What is Fill in the Blanks?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-center">
              Complete the code by typing in the missing parts to solve challenges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsFillInTheBlanksInfoDialogOpen(false)}>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground">Python</h1>
      </div>

      <div className="w-full flex flex-col md:flex-row justify-center gap-8 items-stretch mb-8">
        {/* Activity Selection Cards */}
        <Card className={cn("w-full max-w-md flex flex-col border-2 shadow-md transition-colors duration-300", activeActivity === 'jigsaw' ? 'border-primary' : 'border-transparent hover:border-primary')}>
            <CardHeader className="relative flex-grow">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 z-10 transition-transform hover:scale-110" 
                onClick={(e) => { e.stopPropagation(); setIsJigsawInfoDialogOpen(true); }}>
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <span className="sr-only">About Coding Jigsaw</span>
              </Button>
              <CardTitle className="flex items-center justify-center gap-3 text-2xl font-headline">
                <Blocks className="w-8 h-8 text-primary" />
                Coding Jigsaw
              </CardTitle>
              <CardDescription>
                Piece together code blocks to solve challenges and learn Python fundamentals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => handleActivityToggle('jigsaw')}>
                {activeActivity === 'jigsaw' ? 'Hide Activities' : 'Select Activity'}
              </Button>
            </CardContent>
        </Card>

        <Card className={cn("w-full max-w-md flex flex-col border-2 shadow-md transition-colors duration-300", activeActivity === 'fill-in-the-blanks' ? 'border-primary' : 'border-transparent hover:border-primary')}>
          <CardHeader className="relative flex-grow">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 h-8 w-8 z-10 transition-transform hover:scale-110" 
              onClick={(e) => { e.stopPropagation(); setIsFillInTheBlanksInfoDialogOpen(true); }}>
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <span className="sr-only">About Fill in the Blanks</span>
            </Button>
            <CardTitle className="flex items-center justify-center gap-3 text-2xl font-headline">
              <Keyboard className="w-8 h-8 text-primary" />
              Fill in the Blanks
            </CardTitle>
            <CardDescription>
              Complete the code by typing in the missing parts to solve challenges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => handleActivityToggle('fill-in-the-blanks')}>
              {activeActivity === 'fill-in-the-blanks' ? 'Hide Activities' : 'Select Activity'}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Activity Lists */}
      {activeActivity === 'jigsaw' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.puzzleSections.map((section) => (
              <Card key={section.id} className="flex flex-col border-2 border-transparent hover:border-accent shadow-md transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                    <Code className="w-8 h-8 text-accent" />
                    {section.title}
                  </CardTitle>
                  <CardDescription className="pt-2 min-h-[4rem]">{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    <h3 className="font-semibold">Challenges:</h3>
                    <div className="flex flex-col space-y-2">
                      {getPuzzlesForSection(section.id).map((puzzle) => (
                        <Link href={`/corecs/python/jigsaw/${puzzle.id}`} key={puzzle.id} passHref>
                          <Button variant="outline" className="w-full justify-start">
                            <span className="flex-1 text-left">Level {puzzle.challengeLevel}: {puzzle.title}</span>
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
      )}

      {activeActivity === 'fill-in-the-blanks' && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.fillInTheBlanksSections.map((section) => (
            <Card key={section.id} className="flex flex-col border-2 border-transparent hover:border-accent shadow-md transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                  <Code className="w-8 h-8 text-accent" />
                  {section.title}
                </CardTitle>
                <CardDescription className="pt-2 min-h-[4rem]">{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <div className="space-y-4">
                  <h3 className="font-semibold">Challenges:</h3>
                  <div className="flex flex-col space-y-2">
                    {getFillInTheBlanksForSection(section.id).map((challenge) => (
                      <Link href={`/corecs/python/fill-in-the-blanks/${challenge.id}`} key={challenge.id} passHref>
                        <Button variant="outline" className="w-full justify-start">
                          <span className="flex-1 text-left">Level {challenge.challengeLevel}: {challenge.title}</span>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
