"use client";

import { PuzzlesClient } from '@/components/features/puzzles/puzzles-client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PythonPage() {
  return (
    <ProtectedRoute>
      <PuzzlesClient />
    </ProtectedRoute>
  );
}
