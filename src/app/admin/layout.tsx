import 'server-only';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?blocked=/admin');
  }
  if (!isAdmin(user)) {
    redirect('/');
  }
  return <>{children}</>;
}
