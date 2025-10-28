import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { isTeacher, isStudent } from '@/lib/auth/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Server-side redirect based on user role
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (isTeacher(user)) {
    redirect('/dashboard/teacher');
  }

  if (isStudent(user)) {
    redirect('/dashboard/student');
  }

  // Fallback for users without a role
  redirect('/dashboard/student');
}
