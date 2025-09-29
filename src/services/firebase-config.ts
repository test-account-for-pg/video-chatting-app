// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDjM8bvZvSjzV4HS06IAtntB63YaZix2i0",
    authDomain: "test-eadaf.firebaseapp.com",
    projectId: "test-eadaf",
    storageBucket: "test-eadaf.firebasestorage.app",
    messagingSenderId: "644396135153",
    appId: "1:644396135153:web:5dbec9f7f14a0ec10d6f50",
    measurementId: "G-5CKJX2NVL6"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export default app;
