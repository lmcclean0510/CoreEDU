"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/providers/UserProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'teacher' | 'student';
  redirectTo?: string;
}

// Simple component to protect routes
export function ProtectedRoute({ 
  children, 
  requireRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;

    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Redirect if specific role required and user doesn't have it
    if (requireRole && user?.role !== requireRole) {
      router.push('/'); // Redirect to homepage if wrong role
      return;
    }
  }, [isLoading, isAuthenticated, user, requireRole, redirectTo, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated || (requireRole && user?.role !== requireRole)) {
    return null;
  }

  // Show the protected content
  return <>{children}</>;
}