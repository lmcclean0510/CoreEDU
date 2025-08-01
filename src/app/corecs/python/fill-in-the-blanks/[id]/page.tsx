
"use client";

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { FillInTheBlanksClient } from '@/components/features/puzzles/fill-in-the-blanks-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { FillInTheBlanksChallenge } from '@/lib/types';

export default function FillInTheBlanksPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [challenge, setChallenge] = useState<FillInTheBlanksChallenge | null>(null);
  const [nextChallengeId, setNextChallengeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoading(false);
        // Optionally redirect to login if not authenticated
        return;
      }
      
      if (id) {
        try {
          const challengeDocRef = doc(db, 'fillInTheBlanksChallenges', id);
          const challengeDoc = await getDoc(challengeDocRef);

          if (!challengeDoc.exists()) {
            notFound();
            return;
          }

          const challengeData = { id: challengeDoc.id, ...challengeDoc.data() } as FillInTheBlanksChallenge;
          setChallenge(challengeData);

          const nextChallengeQuery = query(
            collection(db, 'fillInTheBlanksChallenges'),
            where('challengeLevel', '>', challengeData.challengeLevel),
            orderBy('challengeLevel', 'asc'),
            limit(1)
          );
          
          const nextChallengeSnap = await getDocs(nextChallengeQuery);
          setNextChallengeId(nextChallengeSnap.docs.length > 0 ? nextChallengeSnap.docs[0].id : null);
        } catch (error) {
          console.error("Error fetching fill-in-the-blanks challenge:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [id]);


  if (isLoading) {
    return (
        <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!challenge) {
    return notFound();
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
      <FillInTheBlanksClient challenge={challenge} nextChallengeId={nextChallengeId} />
    </div>
  );
}
