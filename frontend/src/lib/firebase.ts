// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCWdLQUVm3NLnluCpjpICXiCo-Prz3mVQI',
  authDomain: 'socialbook-19b8f.firebaseapp.com',
  projectId: 'socialbook-19b8f',
  storageBucket: 'socialbook-19b8f.firebasestorage.app',
  messagingSenderId: '640572357065',
  appId: '1:640572357065:web:f15b8fb52b825c4db05018',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
