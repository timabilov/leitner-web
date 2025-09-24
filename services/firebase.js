import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD_L3d7aUM8eekuLbwWs_43bqvNxk-AAVk",
  authDomain: "241687352985-umb35edcp1011r61tnvekch5suuu6ldk.firebaseapp.com",
  projectId: "241687352985-umb35edcp1011r61tnvekch5suuu6ldk.apps.googleusercontent.com",
  storageBucket: "241687352985-umb35edcp1011r61tnvekch5suuu6ldk.firebasestorage.app",
  messagingSenderId: "241687352985",
  appId: "1:241687352985:web:d47a2ed671c73a2d364a08",
  measurementId: "G-9CTL14E2M3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const fbAuth = getAuth(app);


// firebase default copy

// Import the functions you need from the SDKs you need