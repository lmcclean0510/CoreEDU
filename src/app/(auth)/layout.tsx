import 'server-only';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
