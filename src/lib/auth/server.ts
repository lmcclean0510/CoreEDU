import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { UserProfile } from '@/lib/types';
import type { NormalizedUser } from './shared';

export async function getCurrentUser(): Promise<NormalizedUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const userDocRef = adminDb.doc(`users/${uid}`);
    const userDoc = await userDocRef.get();
    const profile = (userDoc.exists ? (userDoc.data() as UserProfile) : null);

    return {
      uid,
      email: decoded.email ?? null,
      role: profile?.role ?? null,
      isAdmin: !!decoded.admin,
    };
  } catch {
    return null;
  }
}
