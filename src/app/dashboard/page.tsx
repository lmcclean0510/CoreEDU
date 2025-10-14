"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/UserProvider';
import { LoaderCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role === 'teacher') {
        router.push('/dashboard/teacher');
      } else if (user?.role === 'student') {
        router.push('/dashboard/student');
      } else {
        // Fallback for users without a role
        router.push('/dashboard/student');
      }
    }
  }, [user, isLoading, isAuthenticated, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
