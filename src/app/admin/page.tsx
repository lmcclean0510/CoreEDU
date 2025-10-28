"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the admin dashboard
// This reduces initial bundle size for non-admin users (students and regular teachers)
// Admin dashboard is ~317 KB and includes heavy components for flashcard/puzzle management
const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-base text-muted-foreground">Loading Admin Dashboard...</p>
      </div>
    </div>
  ),
  ssr: false, // Admin dashboard requires client-side features
});

export default function AdminPage() {
  return <AdminDashboard />;
}
