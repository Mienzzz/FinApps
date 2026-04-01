import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validate connection to Firestore
async function testConnection() {
  try {
    // Attempt to fetch a non-existent document to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log('Firebase connection initialized successfully');
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Firebase connection failed: The client is offline. Please check your configuration.");
    }
    // Other errors are expected if the document doesn't exist, but connectivity is confirmed.
  }
}

testConnection();
