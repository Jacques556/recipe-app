import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB73gks1opUULiDH9Trxi4-4uTZUT6mtuA",
    authDomain: "recipe-app-78d98.firebaseapp.com",
    projectId: "recipe-app-78d98",
    storageBucket: "recipe-app-78d98.firebasestorage.app",
    messagingSenderId: "595898770518",
    appId: "1:595898770518:web:6d4f8aa2c3c00d58c7c7f7",
    measurementId: "G-K8W7GDDRZ8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);