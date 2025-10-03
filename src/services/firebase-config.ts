// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCBk66nyqfCQBjrmMKVcBpL4WN3Qb4NNAo",
  authDomain: "video-chatting-app-d8e8b.firebaseapp.com",
  databaseURL: "https://video-chatting-app-d8e8b-default-rtdb.firebaseio.com",
  projectId: "video-chatting-app-d8e8b",
  storageBucket: "video-chatting-app-d8e8b.firebasestorage.app",
  messagingSenderId: "1023885418877",
  appId: "1:1023885418877:web:f1f8bc3abbade363b9ec14",
  measurementId: "G-92NVY5SVWV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export default app;

