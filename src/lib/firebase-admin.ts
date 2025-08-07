import 'server-only';
// Hardened server-only Firebase Admin initialisation for Next.js 15 (App Router)
// -----------------------------------------------------------------------------
// IMPORTANT:
// - Do NOT import this module from any client component (files with `use client`).
// - Only import from server contexts: route handlers in app/api/**/route.ts,
//   Server Components (default, no `use client`), or Server Actions (`use server`).
// - Any route that imports this must run on the Node.js runtime, e.g.:
//     export const runtime = 'nodejs';
// -----------------------------------------------------------------------------

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore, type Settings } from 'firebase-admin/firestore';

// Helper: read a required env var or fail fast with a helpful error in all envs
// (You can relax this in development if you prefer.)
function readEnv(name: 'FIREBASE_PROJECT_ID' | 'FIREBASE_CLIENT_EMAIL' | 'FIREBASE_PRIVATE_KEY'): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`[firebase-admin] Missing required env var: ${name}`);
  }
  return v;
}

let app: App;
if (!getApps().length) {
  const projectId = readEnv('FIREBASE_PROJECT_ID');
  const clientEmail = readEnv('FIREBASE_CLIENT_EMAIL');
  // Vercel/most hosts store multiline keys with literal \n; convert to real newlines
  const privateKey = readEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
} else {
  app = getApps()[0]!;
}

const adminAuth: Auth = getAuth(app);
const adminDb: Firestore = getFirestore(app);

// Sensible Firestore defaults
const settings: Partial<Settings> = { ignoreUndefinedProperties: true };
adminDb.settings(settings);

export { app as adminApp, adminAuth, adminDb };
