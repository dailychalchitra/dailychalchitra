importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAiIKd1wdKTNAp0w1qTZlIM0FeSGg0t0b4",
  authDomain: "daily-chalchitra-60994.firebaseapp.com",
  databaseURL: "https://daily-chalchitra-60994-default-rtdb.firebaseio.com",
  projectId: "daily-chalchitra-60994",
  storageBucket: "daily-chalchitra-60994.firebasestorage.app",
  messagingSenderId: "792541060086",
  appId: "1:792541060086:web:078fe75f16940c5d0005d7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/img/sun-logo.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
