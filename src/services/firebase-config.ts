// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { FirebaseConfig } from '../types';

// Validate required environment variables //
const validateEnvVar = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Get Firebase configuration from environment variables
const getFirebaseConfig = (): FirebaseConfig => {
  const config: FirebaseConfig = {
    apiKey: validateEnvVar('REACT_APP_FIREBASE_API_KEY', process.env.REACT_APP_FIREBASE_API_KEY),
    authDomain: validateEnvVar('REACT_APP_FIREBASE_AUTH_DOMAIN', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN),
    databaseURL: validateEnvVar('REACT_APP_FIREBASE_DATABASE_URL', process.env.REACT_APP_FIREBASE_DATABASE_URL),
    projectId: validateEnvVar('REACT_APP_FIREBASE_PROJECT_ID', process.env.REACT_APP_FIREBASE_PROJECT_ID),
    storageBucket: validateEnvVar('REACT_APP_FIREBASE_STORAGE_BUCKET', process.env.REACT_APP_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: validateEnvVar(
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
      process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID
    ),
    appId: validateEnvVar('REACT_APP_FIREBASE_APP_ID', process.env.REACT_APP_FIREBASE_APP_ID),
  };

  // measurementId is optional
  if (process.env.REACT_APP_FIREBASE_MEASUREMENT_ID) {
    config.measurementId = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;
  }

  return config;
};

// Initialize Firebase with environment-based configuration
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export default app;
