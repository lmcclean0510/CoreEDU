// src/app/corecs/gcse/flashcards/page.tsx

"use client";

import { useAuth } from '@/providers/UserProvider';
import { useFlashcardData } from '@/hooks/flashcard/use-flashcard-data';
import { FlashCardClient } from '@/components/features/flashcards/flashcard-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function FlashCardsPageContent() {
  const { isLoading: isAuthLoading } = useAuth();
  const { flashcards, isLoading, error } = useFlashcardData({ 
    subject: "GCSE Computer Science" 
  });

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Flashcards</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-4">
              <Button asChild>
                <Link href="/corecs/gcse">Back to GCSE Page</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 h-full flex flex-col flex-1">
      <FlashCardClient flashcards={flashcards} />
    </div>
  );
}

export default function FlashCardsPage() {
    return (
        <ProtectedRoute>
            <FlashCardsPageContent />
        </ProtectedRoute>
    )
}