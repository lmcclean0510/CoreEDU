"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the heavy SeatingPlanTool component (includes @dnd-kit)
// This reduces the initial bundle size for users who don't use this feature
const SeatingPlanTool = dynamic(() => import('./SeatingPlanTool'), {
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading seating plan tool...</p>
      </div>
    </div>
  ),
  ssr: false, // Disable SSR since this uses drag-and-drop that requires browser APIs
});

export default function SeatingPlanPage() {
  return (
    <div className="absolute inset-0">
      <SeatingPlanTool />
    </div>
  );
}
