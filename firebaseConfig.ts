// Import functions from the SDKs
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: COLOQUE AQUI AS CHAVES DO SEU PROJETO FIREBASE
// Você pega essas chaves no Console do Firebase > Project Settings > General
const firebaseConfig = {
  apiKey: "API_KEY_AQUI",
  authDomain: "dr-passei-exemplo.firebaseapp.com",
  projectId: "dr-passei-exemplo",
  storageBucket: "dr-passei-exemplo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
// We wrap in a try-catch so the app doesn't crash if keys are missing (running locally)
let app;
let db;

try {
  // Only initialize if we have a valid config (check if apiKey is replaced)
  if (firebaseConfig.apiKey !== "API_KEY_AQUI") {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      console.log("Firebase initialized successfully");
  } else {
      console.log("Running in Local Mode (Firebase keys not set)");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { db };