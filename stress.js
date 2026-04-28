// ============================================================
// stress.js — Global Stress Score Tracker
//
// The stress score (0–100) shown in the top-right corner
// is calculated by combining inputs from all 3 detection modules:
// Voice, Face, and Chat behaviour.
//
// Each module calls its own update function here when it finishes.
// We use a weighted average to combine them:
//   Voice contributes 40%
//   Face contributes 40%
//   Chat contributes 20%
// ============================================================

// Store each module's stress contribution
const stressComponents = {
  voice: null,   // null = not yet measured
  face: null,
  chat: null,
};

// How each emotion maps to a stress level (0-100)
const emotionToStress = {
  // Voice emotions
  tired: 60,
  anxious: 85,
  angry: 90,
  sad: 70,
  calm: 10,
  happy: 5,

  // Face emotions
  fearful: 85,
  disgusted: 65,
  surprised: 30,
  neutral: 20,
};

// ============================================================
// updateStressFromVoice() — called from voice.js after analysis
// ============================================================
function updateStressFromVoice(emotion) {
  stressComponents.voice = emotionToStress[emotion] ?? 50;
  recalculateStress();
}

// ============================================================
// updateStressFromFace() — called from face.js after scan
// ============================================================
function updateStressFromFace(emotion) {
  stressComponents.face = emotionToStress[emotion] ?? 30;
  recalculateStress();
}

// ============================================================
// updateStressFromChat() — called from chat.js
// Analyses the user's messages for stress keywords
// ============================================================
function updateStressFromChat(userMessage) {
  const stressWords = ['stress', 'anxious', 'panic', 'overwhelm', 'cant cope', "can't cope", 'depressed', 'hopeless', 'exhausted', 'breaking'];
  const calmWords = ['better', 'good', 'happy', 'relaxed', 'calm', 'okay', 'fine', 'grateful'];

  const lower = userMessage.toLowerCase();
  let score = 40; // default neutral

  for (const w of stressWords) {
    if (lower.includes(w)) { score = 80; break; }
  }
  for (const w of calmWords) {
    if (lower.includes(w)) { score = 20; break; }
  }

  stressComponents.chat = score;
  recalculateStress();
}

// ============================================================
// recalculateStress() — weighted average of all components
// ============================================================
function recalculateStress() {
  const weights = { voice: 0.4, face: 0.4, chat: 0.2 };
  let total = 0;
  let totalWeight = 0;

  for (const [key, value] of Object.entries(stressComponents)) {
    if (value !== null) {
      total += value * weights[key];
      totalWeight += weights[key];
    }
  }

  // If no modules have run yet, show 0
  const score = totalWeight > 0 ? Math.round(total / totalWeight) : 0;

  // Update the badge in the navbar
  const badge = document.getElementById('stressBadge');
  badge.textContent = `Stress: ${score}/100`;

  // Change badge colour based on stress level
  if (score >= 70) {
    badge.style.background = '#c0392b'; // Red — high stress
  } else if (score >= 40) {
    badge.style.background = '#e67e22'; // Orange — medium
  } else {
    badge.style.background = '#27ae60'; // Green — low stress
  }
}
