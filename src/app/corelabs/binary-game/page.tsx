"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the binary game component
// This reduces initial bundle size since games are not used by all students
const BinaryGame = dynamic(() => import('./BinaryGame'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-base text-muted-foreground">Loading Binary Game...</p>
      </div>
    </div>
  ),
  ssr: false, // Games require browser APIs
});

export default function BinaryGamePage() {
  return <BinaryGame />;
}
