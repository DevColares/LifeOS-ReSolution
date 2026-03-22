import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVthB6l_SXFQm1STedOXHhBM8N9Q64GjM",
  authDomain: "rs-pdv.firebaseapp.com",
  projectId: "rs-pdv",
  storageBucket: "rs-pdv.firebasestorage.app",
  messagingSenderId: "64737308759",
  appId: "1:64737308759:web:6029b41044de18f7957312",
  measurementId: "G-0VHCSFLH0Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
