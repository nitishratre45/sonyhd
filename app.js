// =========================================================
// HLS LIVE PLAYER
// =========================================================

const STREAM_URL =
  "https://films-sender-arrivals-field.trycloudflare.com/live/index.m3u8";

const video = document.getElementById("videoPlayer");
const streamStatus = document.getElementById("streamStatus");

let hls = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

function setStatus(message) {
  if (streamStatus) {
    streamStatus.textContent = message;
  }
}

function startHLS() {
  if (!video) return;

  clearTimeout(reconnectTimer);

  // Destroy previous HLS instance before creating a new one
  if (hls) {
    try {
      hls.destroy();
    } catch (error) {
      console.log("HLS destroy error:", error);
    }
    hls = null;
  }

  // -------------------------------------------------------
  // Chrome / Edge / Firefox
  // -------------------------------------------------------
  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,

      // Live-stream stability
      lowLatencyMode: false,

      // Keep a small live buffer
      maxBufferLength: 12,
      maxMaxBufferLength: 20,

      // Don't keep too much old live content
      backBufferLength: 30,

      // Stay close to live edge
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 8,

      // Manifest retry
      manifestLoadingMaxRetry: 6,
      manifestLoadingRetryDelay: 1000,
      manifestLoadingMaxRetryTimeout: 8000,

      // Fragment retry
      fragLoadingMaxRetry: 8,
      fragLoadingRetryDelay: 1000,
      fragLoadingMaxRetryTimeout: 8000,

      // Level retry
      levelLoadingMaxRetry: 6,
      levelLoadingRetryDelay: 1000,
      levelLoadingMaxRetryTimeout: 8000,

      // Prevent unnecessary stalls
      maxBufferHole: 0.5,
      highBufferWatchdogPeriod: 2
    });

    hls.loadSource(STREAM_URL);
    hls.attachMedia(video);

    // -----------------------------------------------------
    // Manifest loaded
    // -----------------------------------------------------
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      reconnectAttempts = 0;

      setStatus("LIVE - Stream connected");

      video.play().catch(() => {
        console.log("Autoplay waiting for user interaction.");
      });

      // If player is behind live edge, move closer to live
      try {
        if (hls.liveSyncPosition) {
          video.currentTime = hls.liveSyncPosition;
        }
      } catch (error) {
        console.log("Live position adjustment skipped.");
      }
    });

    // -----------------------------------------------------
    // Fragment loaded
    // -----------------------------------------------------
    hls.on(Hls.Events.FRAG_LOADED, () => {
      reconnectAttempts = 0;

      if (streamStatus) {
        streamStatus.textContent = "LIVE - Stream connected";
      }
    });

    // -----------------------------------------------------
    // HLS errors
    // -----------------------------------------------------
    hls.on(Hls.Events.ERROR, (event, data) => {
      console.log("HLS Error:", data);

      // Non-fatal errors are usually temporary.
      if (!data.fatal) {
        return;
      }

      // ---------------------------------------------------
      // Network error
      // ---------------------------------------------------
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        setStatus("Reconnecting to live stream...");

        reconnectAttempts++;

        clearTimeout(reconnectTimer);

        const delay = Math.min(
          1500 * reconnectAttempts,
          6000
        );

        reconnectTimer = setTimeout(() => {
          if (!hls) return;

          console.log("Attempting HLS network recovery...");

          try {
            hls.startLoad(-1);
          } catch (error) {
            console.log("startLoad recovery failed:", error);
            startHLS();
          }
        }, delay);

        return;
      }

      // ---------------------------------------------------
      // Media error
      // ---------------------------------------------------
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        setStatus("Recovering live video...");

        try {
          hls.recoverMediaError();
        } catch (error) {
          console.log("Media recovery failed:", error);
          startHLS();
        }

        return;
      }

      // ---------------------------------------------------
      // Other fatal error
      // ---------------------------------------------------
      setStatus("Reconnecting to live stream...");

      clearTimeout(reconnectTimer);

      reconnectAttempts++;

      reconnectTimer = setTimeout(() => {
        startHLS();
      }, 2000);
    });

    // -----------------------------------------------------
    // Video stalled
    // -----------------------------------------------------
    video.addEventListener("stalled", () => {
      console.log("Video stalled.");

      if (streamStatus) {
        streamStatus.textContent = "Buffering live stream...";
      }
    });

    // -----------------------------------------------------
    // Video playing
    // -----------------------------------------------------
    video.addEventListener("playing", () => {
      if (streamStatus) {
        streamStatus.textContent = "LIVE - Stream connected";
      }
    });

    return;
  }

  // -------------------------------------------------------
  // Safari / native HLS
  // -------------------------------------------------------
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = STREAM_URL;

    video.addEventListener(
      "loadedmetadata",
      () => {
        setStatus("LIVE - Stream connected");

        video.play().catch(() => {
          console.log("Autoplay waiting for user interaction.");
        });
      },
      { once: true }
    );

    video.addEventListener("error", () => {
      setStatus("Reconnecting to live stream...");

      clearTimeout(reconnectTimer);

      reconnectTimer = setTimeout(() => {
        video.src = STREAM_URL;
        video.load();
      }, 3000);
    });

    return;
  }

  // -------------------------------------------------------
  // Browser doesn't support HLS
  // -------------------------------------------------------
  setStatus("Your browser does not support HLS.");
}

// Start player
startHLS();


// =========================================================
// FIREBASE LIVE VIEWERS
// 150 BASE + REAL ACTIVE VISITORS
// =========================================================

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


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDm3DIHJfRPEqNqrUlYJutRQm8XIA6H3fs",

  authDomain:
    "cricket-live-39106.firebaseapp.com",

  databaseURL:
    "https://cricket-live-39106-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId:
    "cricket-live-39106",

  storageBucket:
    "cricket-live-39106.firebasestorage.app",

  messagingSenderId:
    "841890143",

  appId:
    "1:841890143:web:ca5b87c9395bdc19145eea",

  measurementId:
    "G-ZNEZC8YVMX"
};


// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);


// Active viewers location
const viewers = ref(database, "liveViewers");


// Create unique viewer session
const currentViewer = push(viewers);


// Remove this visitor automatically
// when browser/network connection closes.
onDisconnect(currentViewer)
  .remove()
  .catch((error) => {
    console.log("onDisconnect error:", error);
  });


// Register current visitor
set(currentViewer, {
  joinedAt: serverTimestamp()
})
  .catch((error) => {
    console.log("Viewer registration error:", error);
  });


// Update viewer counter
onValue(viewers, (snapshot) => {

  const data = snapshot.val() || {};

  const realVisitors =
    Object.keys(data).length;

  // Fixed base + actual active visitors
  const totalWatching =
    150 + realVisitors;

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