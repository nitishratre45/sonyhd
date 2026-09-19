// =========================================================
// HLS LIVE PLAYER - DIAGNOSTIC VERSION
// =========================================================

const STREAM_URL =
  "https://cloudplay-sonyliv.pages.dev/ten3.m3u8";

const video = document.getElementById("videoPlayer");
const streamStatus = document.getElementById("streamStatus");

let hls = null;

function setStatus(message) {
  if (streamStatus) {
    streamStatus.textContent = message;
  }

  console.log("[PLAYER]", message);
}

function startHLS() {

  if (!video) {
    console.error("videoPlayer not found");
    return;
  }

  if (hls) {
    try {
      hls.destroy();
    } catch (e) {
      console.log("Destroy error:", e);
    }

    hls = null;
  }

  setStatus("Connecting to live stream...");

  // Android Chrome / modern browsers
  if (Hls.isSupported()) {

    console.log("HLS.js supported");

    hls = new Hls({
      enableWorker: true,

      lowLatencyMode: false,

      maxBufferLength: 20,
      maxMaxBufferLength: 30,

      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,

      maxBufferHole: 0.5,

      manifestLoadingMaxRetry: 3,
      fragLoadingMaxRetry: 3,

      debug: false
    });

    hls.loadSource(STREAM_URL);

    hls.attachMedia(video);


    // -------------------------------
    // Manifest loaded
    // -------------------------------

    hls.on(Hls.Events.MANIFEST_PARSED, function () {

      console.log("MANIFEST PARSED");

      setStatus("Stream found - loading video...");

      video.play()
        .then(() => {
          console.log("Video playback started");
        })
        .catch(() => {
          setStatus("Tap ▶ Play to start");
        });
    });


    // -------------------------------
    // Fragment loading
    // -------------------------------

    hls.on(Hls.Events.FRAG_LOADING, function (event, data) {

      console.log(
        "Fragment loading:",
        data.frag?.url
      );

      setStatus("Loading live video...");
    });


    // -------------------------------
    // Fragment loaded
    // -------------------------------

    hls.on(Hls.Events.FRAG_LOADED, function (event, data) {

      console.log(
        "Fragment loaded:",
        data.frag?.url
      );

      setStatus("Live video received...");
    });


    // -------------------------------
    // Buffer appended
    // -------------------------------

    hls.on(Hls.Events.BUFFER_APPENDED, function () {

      console.log("Video buffer appended");

      if (!video.paused) {
        setStatus("LIVE - Playing");
      }
    });


    // -------------------------------
    // Video playing
    // -------------------------------

    video.addEventListener("playing", function () {

      console.log("HTML video PLAYING");

      setStatus("LIVE - Playing");
    });


    // -------------------------------
    // Waiting / buffering
    // -------------------------------

    video.addEventListener("waiting", function () {

      console.log("Video waiting");

      setStatus("Buffering live stream...");
    });


    // -------------------------------
    // Stalled
    // -------------------------------

    video.addEventListener("stalled", function () {

      console.log("Video stalled");

      setStatus("Stream stalled...");
    });


    // -------------------------------
    // Video error
    // -------------------------------

    video.addEventListener("error", function () {

      console.error(
        "VIDEO ERROR:",
        video.error
      );

      if (video.error) {

        setStatus(
          "Video error: " +
          video.error.code
        );
      }
    });


    // -------------------------------
    // HLS errors
    // -------------------------------

    hls.on(Hls.Events.ERROR, function (event, data) {

      console.error("HLS ERROR:", data);

      if (data.fatal) {

        if (
          data.type ===
          Hls.ErrorTypes.NETWORK_ERROR
        ) {

          setStatus(
            "Network error - stream unavailable"
          );

          console.error(
            "Network error:",
            data.details
          );

        } else if (
          data.type ===
          Hls.ErrorTypes.MEDIA_ERROR
        ) {

          setStatus(
            "Media/codec error"
          );

          console.error(
            "Media error:",
            data.details
          );

          try {
            hls.recoverMediaError();
          } catch (e) {
            console.error(e);
          }

        } else {

          setStatus(
            "HLS error: " +
            data.details
          );

          console.error(
            "Fatal HLS error:",
            data
          );
        }
      }
    });

    return;
  }


  // =====================================================
  // Native HLS
  // =====================================================

  if (
    video.canPlayType(
      "application/vnd.apple.mpegurl"
    )
  ) {

    console.log("Native HLS supported");

    video.src = STREAM_URL;

    video.addEventListener(
      "loadedmetadata",
      function () {

        setStatus(
          "Stream found - loading video..."
        );

        video.play().catch(() => {
          setStatus(
            "Tap ▶ Play to start"
          );
        });

      },
      { once: true }
    );

    return;
  }


  setStatus(
    "This browser does not support HLS."
  );
}

startHLS();
