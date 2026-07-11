importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAiIKd1wdKTNAp0w1qTZlIM0FeSGg0t0b4",
  authDomain: "daily-chalchitra-60994.firebaseapp.com",
  databaseURL: "https://daily-chalchitra-60994-default-rtdb.firebaseio.com",
  projectId: "daily-chalchitra-60994",
  storageBucket: "daily-chalchitra-60994.firebasestorage.app",
  messagingSenderId: "792541060086",
  appId: "1:792541060086:web:26234a34ba73cd3b0005d7"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
