// ============================================================
// face.js — Face Emotion Detection
//
// HOW IT WORKS (simple explanation):
//
// face-api.js is a JavaScript library built on TensorFlow.js.
// It contains a pre-trained CNN (Convolutional Neural Network)
// — a type of deep learning model specifically good at
// understanding images (especially faces).
//
// The CNN was trained on hundreds of thousands of face images,
// each labelled with one of 7 emotions. After training,
// it can look at ANY face and predict probabilities for
// all 7 emotions at once.
//
// We run this model INSIDE the browser — no images are
// ever sent to a server. It's 100% private.
//
// Steps:
// 1. Load the CNN model files (from our /models folder)
// 2. Start the webcam
// 3. Capture 12 frames of video
// 4. Run face detection + expression detection on EACH frame
// 5. Average the 12 results → more stable/accurate output
// 6. Display the emotion breakdown bars
// ============================================================

// Track whether models are loaded yet
let faceModelsLoaded = false;

// ============================================================
// loadFaceModels() — download the CNN weights from our server
// This only happens once (first time the Face tab is used)
// ============================================================
async function loadFaceModels() {
  if (faceModelsLoaded) return;
  console.log('Loading face detection models...');

  // faceapi.nets contains different model types:
  // - tinyFaceDetector: fast face bounding box detection
  // - faceExpressionNet: the 7-emotion CNN classifier
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');

  faceModelsLoaded = true;
  console.log('Face models ready ✅');
}

// ============================================================
// startFaceScan() — main function called when user clicks scan
// ============================================================
async function startFaceScan() {
  const video = document.getElementById('faceVideo');
  const placeholder = document.getElementById('facePlaceholder');
  const scanBtn = document.querySelector('[onclick="startFaceScan()"]');

  try {
    scanBtn.textContent = 'Loading model...';
    scanBtn.disabled = true;

    // Step 1: Load models (if not already loaded)
    await loadFaceModels();

    // Step 2: Access webcam
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    placeholder.style.display = 'none';

    scanBtn.textContent = 'Scanning...';

    // Step 3: Wait for video to start playing
    await new Promise((resolve) => {
      video.onloadedmetadata = () => { video.play(); resolve(); };
    });

    // Wait a moment for the webcam to stabilise
    await sleep(500);

    // Step 4: Capture and analyse 12 frames
    const allResults = [];
    const FRAMES = 12;

    for (let i = 0; i < FRAMES; i++) {
      // Detect face + expressions in current video frame
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detection) {
        allResults.push(detection.expressions);
        // Update bars in real time (so user sees them filling up)
        displayEmotionBars(detection.expressions);
      }

      await sleep(150); // Small pause between frames
    }

    // Step 5: Stop webcam
    stream.getTracks().forEach((t) => t.stop());

    if (allResults.length === 0) {
      alert('No face detected. Please ensure your face is visible and well-lit.');
      scanBtn.textContent = '🙂 Scan My Face';
      scanBtn.disabled = false;
      placeholder.style.display = 'flex';
      return;
    }

    // Step 6: Average all frames
    const averaged = averageExpressions(allResults);

    // Step 7: Show final result
    displayEmotionBars(averaged);

    // Step 8: Update stress score with dominant face emotion
    const dominant = getDominantEmotion(averaged);
    updateStressFromFace(dominant);

    scanBtn.textContent = '🙂 Scan My Face';
    scanBtn.disabled = false;

  } catch (err) {
    console.error('Face scan error:', err);
    scanBtn.textContent = '🙂 Scan My Face';
    scanBtn.disabled = false;
    if (err.name === 'NotAllowedError') {
      alert('Camera permission denied. Please allow camera access.');
    }
  }
}

// ============================================================
// averageExpressions() — averages results from multiple frames
// e.g. happy: [0.8, 0.7, 0.9] → happy: 0.8
// ============================================================
function averageExpressions(results) {
  const emotions = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
  const avg = {};
  emotions.forEach((e) => {
    avg[e] = results.reduce((sum, r) => sum + (r[e] || 0), 0) / results.length;
  });
  return avg;
}

// ============================================================
// displayEmotionBars() — fills the progress bars in the UI
// Each bar width = probability * 100 (as a percentage)
// ============================================================
function displayEmotionBars(expressions) {
  const emotions = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
  emotions.forEach((emotion) => {
    const prob = expressions[emotion] || 0;
    const pct = Math.round(prob * 100);
    const bar = document.getElementById('bar-' + emotion);
    const val = document.getElementById('val-' + emotion);
    if (bar) bar.style.width = pct + '%';
    if (val) val.textContent = pct + '%';
  });
}

function getDominantEmotion(expressions) {
  return Object.entries(expressions).sort((a, b) => b[1] - a[1])[0][0];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
