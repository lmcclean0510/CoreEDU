
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PuzzleClient } from '@/components/features/puzzles/puzzle-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { Puzzle } from '@/lib/types';

export default function JigsawPuzzlePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [nextPuzzleId, setNextPuzzleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const puzzleDocRef = doc(db, 'puzzles', id);
          const puzzleDoc = await getDoc(puzzleDocRef);

          if (!puzzleDoc.exists()) {
            router.push('/404');
            return;
          }

          const puzzleData = { id: puzzleDoc.id, ...puzzleDoc.data() } as Puzzle;
          setPuzzle(puzzleData);

          const nextPuzzleQuery = query(
            collection(db, 'puzzles'),
            where('challengeLevel', '>', puzzleData.challengeLevel),
            orderBy('challengeLevel', 'asc'),
            limit(1)
          );
          
          const nextPuzzleSnap = await getDocs(nextPuzzleQuery);
          setNextPuzzleId(nextPuzzleSnap.docs.length > 0 ? nextPuzzleSnap.docs[0].id : null);
        } catch (error) {
          console.error('Error loading puzzle:', error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [id, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 h-full flex items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!puzzle) {
    return null;
  }
  
  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 h-full">
      <div className="flex justify-start mb-4">
        <Button asChild variant="outline">
          <Link href="/corecs/python">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Python
          </Link>
        </Button>
      </div>
      <PuzzleClient puzzle={puzzle} nextPuzzleId={nextPuzzleId} />
    </div>
  );
}
