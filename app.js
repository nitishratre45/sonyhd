const STREAM_URL =
  "https://films-sender-arrivals-field.trycloudflare.com/live/index.m3u8";

const video = document.getElementById("videoPlayer");
const status = document.getElementById("status");

if (Hls.isSupported()) {

  const hls = new Hls();

  hls.loadSource(STREAM_URL);
  hls.attachMedia(video);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    document.getElementById("streamStatus").textContent = "LIVE - Stream connected";
    video.play().catch(() => {});
  });

  hls.on(Hls.Events.ERROR, (event, data) => {
    console.log("HLS Error:", data);

    if (data.fatal) {
      document.getElementById("streamStatus").textContent = "Stream unavailable";
    }
  });

} else if (video.canPlayType("application/vnd.apple.mpegurl")) {

  video.src = STREAM_URL;

  video.addEventListener("loadedmetadata", () => {
    document.getElementById("streamStatus").textContent = "LIVE - Stream connected";
    video.play().catch(() => {});
  });

} else {

  document.getElementById("streamStatus").textContent = "Your browser does not support HLS."; 
}
/* =========================================================
   FIREBASE LIVE VIEWERS
   150 BASE + REAL ACTIVE VISITORS
========================================================= */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  onDisconnect,
  onValue,
  set,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDm3DIHJfRPEqNqrUlYJutRQm8XIA6H3fs",
  authDomain: "cricket-live-39106.firebaseapp.com",
  databaseURL:
    "https://cricket-live-39106-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cricket-live-39106",
  storageBucket: "cricket-live-39106.firebasestorage.app",
  messagingSenderId: "841890143",
  appId: "1:841890143:web:ca5b87c9395bdc19145eea",
  measurementId: "G-ZNEZC8YVMX"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

const viewers = ref(database, "liveViewers");
const currentViewer = push(viewers);

/* Register this browser as an active visitor */
set(currentViewer, {
  joinedAt: serverTimestamp()
});

/* Remove visitor automatically when connection closes */
onDisconnect(currentViewer).remove();

/* Update existing viewer counter if element exists */
onValue(viewers, (snapshot) => {

  const realVisitors = snapshot.size;

  const totalWatching = 150 + realVisitors;

  const viewerElement =
    document.getElementById("watchingCount");

  if (viewerElement) {
    viewerElement.textContent =
      totalWatching.toLocaleString();
  }

  console.log(
    "Live Watching:",
    totalWatching
  );
});





