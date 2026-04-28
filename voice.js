// ============================================================
// voice.js — Voice Emotion Analyzer
//
// HOW IT WORKS (simple explanation):
// 1. We ask the browser to access the microphone
// 2. The Web Speech API converts spoken words to text
// 3. The Web Audio API measures sound properties (pitch, energy)
// 4. We analyse both the words AND the sound to detect emotion
// ============================================================

// --- Emotion definitions ---
// Each emotion has: keywords (words that hint at it), emoji, description
// and expected audio patterns (low/high energy, pitch etc.)
const EMOTIONS = {
  tired: {
    keywords: ['tired', 'exhausted', 'sleepy', 'drained', 'fatigue', 'rest', 'sleep', 'weak'],
    emoji: '😴',
    description: 'You sound tired and drained',
    energyRange: [0, 30],   // low energy
    pitchRange: [80, 140],  // low pitch
    roughnessRange: [10, 30],
  },
  happy: {
    keywords: ['happy', 'great', 'amazing', 'excited', 'joy', 'wonderful', 'love', 'good', 'awesome', 'fantastic'],
    emoji: '😄',
    description: 'You sound happy and positive!',
    energyRange: [60, 100],
    pitchRange: [160, 250],
    roughnessRange: [5, 20],
  },
  anxious: {
    keywords: ['anxious', 'worried', 'nervous', 'stress', 'scared', 'fear', 'panic', 'overwhelm', 'tense'],
    emoji: '😰',
    description: 'You seem anxious or stressed',
    energyRange: [50, 90],
    pitchRange: [170, 280],
    roughnessRange: [20, 50],
  },
  sad: {
    keywords: ['sad', 'upset', 'crying', 'depressed', 'lonely', 'hurt', 'lost', 'empty', 'hopeless'],
    emoji: '😢',
    description: 'You sound sad or low',
    energyRange: [5, 35],
    pitchRange: [90, 150],
    roughnessRange: [8, 25],
  },
  calm: {
    keywords: ['calm', 'relaxed', 'peaceful', 'fine', 'okay', 'alright', 'serene', 'balanced'],
    emoji: '😌',
    description: 'You sound calm and balanced',
    energyRange: [30, 60],
    pitchRange: [130, 180],
    roughnessRange: [5, 18],
  },
  angry: {
    keywords: ['angry', 'mad', 'furious', 'hate', 'irritated', 'annoyed', 'frustrated', 'rage'],
    emoji: '😠',
    description: 'You sound frustrated or angry',
    energyRange: [70, 100],
    pitchRange: [150, 300],
    roughnessRange: [30, 60],
  },
};

// --- State variables ---
let audioContext = null;    // Web Audio API context
let analyserNode = null;    // Reads frequency data from mic
let micStream = null;       // The live microphone stream
let isListening = false;

// ============================================================
// startVoice() — main function called when user clicks "Try Again"
// ============================================================
async function startVoice() {
  try {
    document.getElementById('voiceStatus').textContent = 'Listening... speak now';
    document.getElementById('voiceMetrics').style.display = 'none';
    document.getElementById('voiceResult').style.display = 'none';
    document.getElementById('voiceNote').style.display = 'none';

    // Step 1: Ask browser for microphone permission
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Step 2: Set up Web Audio API to analyse sound properties
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048; // How detailed our frequency analysis is

    const source = audioContext.createMediaStreamSource(micStream);
    source.connect(analyserNode); // Connect mic → analyser

    // Step 3: Start drawing the waveform animation
    drawWaveform();

    // Step 4: Measure audio properties every 100ms for 3 seconds
    const audioMeasurements = [];
    const measureInterval = setInterval(() => {
      audioMeasurements.push(getAudioProperties());
    }, 100);

    // Step 5: Start speech recognition (converts voice to text)
    const transcript = await recognizeSpeech();

    // Step 6: Stop measuring after speech is done
    clearInterval(measureInterval);
    stopMic();

    // Step 7: Average all audio measurements
    const avgAudio = averageMeasurements(audioMeasurements);

    // Step 8: Detect emotion from transcript + audio
    const result = detectEmotion(transcript, avgAudio);

    // Step 9: Show results on screen
    displayVoiceResult(result, avgAudio);

    // Step 10: Update the global stress score
    updateStressFromVoice(result.emotion);

  } catch (err) {
    document.getElementById('voiceStatus').textContent = 'Microphone access denied — try Demo mode';
    console.error('Voice error:', err);
  }
}

// ============================================================
// getAudioProperties() — measures Energy, Pitch, Roughness, Brightness
// from the live audio using frequency data
// ============================================================
function getAudioProperties() {
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyserNode.getFloatFrequencyData(dataArray); // Get frequency data in decibels

  // Energy = overall loudness (RMS of time-domain signal)
  const timeData = new Float32Array(analyserNode.fftSize);
  analyserNode.getFloatTimeDomainData(timeData);
  const rms = Math.sqrt(timeData.reduce((sum, v) => sum + v * v, 0) / timeData.length);
  const energy = Math.min(100, Math.round(rms * 1000)); // Scale to 0-100

  // Pitch = the dominant frequency (Hz) — found by finding peak in FFT
  let maxVal = -Infinity;
  let maxIdx = 0;
  for (let i = 0; i < bufferLength; i++) {
    if (dataArray[i] > maxVal) {
      maxVal = dataArray[i];
      maxIdx = i;
    }
  }
  const sampleRate = audioContext.sampleRate;
  const pitch = Math.round((maxIdx / bufferLength) * (sampleRate / 2));

  // Roughness = how much the signal varies — measures harshness/tension in voice
  let roughness = 0;
  for (let i = 1; i < timeData.length; i++) {
    roughness += Math.abs(timeData[i] - timeData[i - 1]);
  }
  roughness = Math.min(60, Math.round((roughness / timeData.length) * 500));

  // Brightness = ratio of high-frequency energy vs total — bright voice = happier
  const lowEnergy = dataArray.slice(0, bufferLength / 4).reduce((s, v) => s + Math.abs(v), 0);
  const highEnergy = dataArray.slice(bufferLength / 4).reduce((s, v) => s + Math.abs(v), 0);
  const brightness = Math.min(100, Math.round((highEnergy / (lowEnergy + highEnergy + 0.001)) * 100));

  return { energy, pitch: Math.min(300, pitch), roughness, brightness };
}

// ============================================================
// recognizeSpeech() — uses browser's Web Speech API
// Returns a Promise that resolves with the transcript text
// ============================================================
function recognizeSpeech() {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      resolve(''); // Browser doesn't support it — still analyse audio
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();
      console.log('Transcript:', text);
      resolve(text);
    };

    recognition.onerror = () => resolve('');
    recognition.onend = () => resolve('');
    recognition.start();
  });
}

// ============================================================
// detectEmotion() — the BRAIN of voice analysis
// Matches transcript keywords AND audio properties to find best emotion
// ============================================================
function detectEmotion(transcript, audio) {
  let bestEmotion = 'calm';
  let bestScore = 0;

  for (const [name, def] of Object.entries(EMOTIONS)) {
    let score = 0;

    // Keyword matching: +25 points for each matching word
    for (const word of def.keywords) {
      if (transcript.includes(word)) score += 25;
    }

    // Audio matching: check if our measured values fall in the expected ranges
    if (audio.energy >= def.energyRange[0] && audio.energy <= def.energyRange[1]) score += 20;
    if (audio.pitch >= def.pitchRange[0] && audio.pitch <= def.pitchRange[1]) score += 20;
    if (audio.roughness >= def.roughnessRange[0] && audio.roughness <= def.roughnessRange[1]) score += 10;

    if (score > bestScore) {
      bestScore = score;
      bestEmotion = name;
    }
  }

  // Calculate confidence (how sure we are)
  const confidence = Math.min(99, 50 + bestScore);

  return {
    emotion: bestEmotion,
    emoji: EMOTIONS[bestEmotion].emoji,
    description: EMOTIONS[bestEmotion].description,
    confidence,
  };
}

// ============================================================
// displayVoiceResult() — update the UI with results
// ============================================================
function displayVoiceResult(result, audio) {
  document.getElementById('voiceStatus').textContent = 'Analysis complete · detected via your words';

  // Show metrics
  document.getElementById('voiceMetrics').style.display = 'grid';
  document.getElementById('metricEnergy').textContent = audio.energy;
  document.getElementById('metricPitch').textContent = audio.pitch + 'Hz';
  document.getElementById('metricRoughness').textContent = audio.roughness;
  document.getElementById('metricBrightness').textContent = audio.brightness;
  document.getElementById('barEnergy').style.width = audio.energy + '%';
  document.getElementById('barPitch').style.width = (audio.pitch / 3) + '%';
  document.getElementById('barRoughness').style.width = (audio.roughness / 0.6) + '%';
  document.getElementById('barBrightness').style.width = audio.brightness + '%';

  // Show result card
  document.getElementById('voiceResult').style.display = 'flex';
  document.getElementById('voiceEmoji').textContent = result.emoji;
  document.getElementById('voiceEmotion').textContent = result.emotion.charAt(0).toUpperCase() + result.emotion.slice(1);
  document.getElementById('voiceDesc').textContent = result.description;
  document.getElementById('voiceConf').textContent = result.confidence + '%';

  // Show analysis note
  const noteEl = document.getElementById('voiceNote');
  noteEl.style.display = 'block';
  noteEl.textContent = getVoiceAdvice(result.emotion, audio, result.confidence);
}

function getVoiceAdvice(emotion, audio, conf) {
  const notes = {
    tired: `Very low energy across all voice dimensions. Your body may be asking for rest. Confidence: ${conf}%.`,
    anxious: `Elevated pitch and roughness detected. Try box breathing: inhale 4s, hold 4s, exhale 4s. Confidence: ${conf}%.`,
    sad: `Low energy and pitch suggest low mood. A short walk or calling a friend can help. Confidence: ${conf}%.`,
    happy: `Your voice energy and pitch are bright! Great emotional state detected. Confidence: ${conf}%.`,
    calm: `Steady, balanced voice patterns. You appear to be in a calm state. Confidence: ${conf}%.`,
    angry: `High energy and roughness detected. Try cooling down before making any decisions. Confidence: ${conf}%.`,
  };
  return notes[emotion] || `Emotion detected with ${conf}% confidence.`;
}

// ============================================================
// Waveform animation — draws the bouncing wave on the canvas
// ============================================================
function drawWaveform() {
  if (!analyserNode) return;
  const canvas = document.getElementById('waveformCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight || 120;

  const bufferLength = analyserNode.fftSize;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    if (!isListening) return;
    requestAnimationFrame(draw);
    analyserNode.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f5c842';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * canvas.height / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();
  }

  isListening = true;
  draw();
}

function stopMic() {
  isListening = false;
  if (micStream) micStream.getTracks().forEach(t => t.stop());
  if (audioContext) audioContext.close();
}

function averageMeasurements(arr) {
  if (!arr.length) return { energy: 13, pitch: 145, roughness: 14, brightness: 12 };
  const avg = (key) => Math.round(arr.reduce((s, v) => s + v[key], 0) / arr.length);
  return { energy: avg('energy'), pitch: avg('pitch'), roughness: avg('roughness'), brightness: avg('brightness') };
}

function resetVoice() {
  stopMic();
  document.getElementById('voiceStatus').textContent = 'Click Try Again to speak';
  document.getElementById('voiceMetrics').style.display = 'none';
  document.getElementById('voiceResult').style.display = 'none';
  document.getElementById('voiceNote').style.display = 'none';
  const ctx = document.getElementById('waveformCanvas').getContext('2d');
  ctx.clearRect(0, 0, 9999, 9999);
}

// Demo mode — simulates a "Tired" result for presentation
function runVoiceDemo() {
  const demoAudio = { energy: 13, pitch: 145, roughness: 14, brightness: 12 };
  const demoResult = { emotion: 'tired', emoji: '😴', description: 'You sound tired and drained', confidence: 98 };
  document.getElementById('voiceMetrics').style.display = 'grid';
  document.getElementById('voiceResult').style.display = 'flex';
  document.getElementById('voiceNote').style.display = 'block';
  displayVoiceResult(demoResult, demoAudio);
  document.getElementById('voiceStatus').textContent = 'Demo mode · detected via your words';
}
