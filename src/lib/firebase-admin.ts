// Create this file: src/lib/firebase-admin.ts

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app: App;

if (!getApps().length) {
  try {
    // Import the service account key that's already in your project
    const serviceAccount = require('../../serviceAccountKey.json');
    
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export { app as adminApp };