# 🧠 NeuroWeave X — AI-Powered Mental Wellness Platform

> Detect your emotions through your **voice**, **face**, and **chat** — in real time.

![NeuroWeave X](https://img.shields.io/badge/Built%20With-Node.js%20%7C%20Socket.io%20%7C%20OpenAI%20%7C%20face--api.js-yellow)

---

## 🌟 What is NeuroWeave X?

NeuroWeave X is a mental wellness web application that uses **Artificial Intelligence** and **Computer Vision** to automatically detect your emotional and stress state — without you having to self-report anything.

Most wellness apps say "how are you feeling?" and make you pick a mood.  
**NeuroWeave X figures it out for you** — using your voice, your face, and how you chat.

---

## ✨ Features (4 Modules)

### 🎤 1. Voice Emotion Analyzer
- Listens to your voice through the microphone
- Uses the **Web Speech API** to transcribe what you say
- Uses the **Web Audio API** to measure **Energy, Pitch, Roughness, Brightness**
- Detects emotions: Tired, Happy, Anxious, Sad, Calm, Angry
- Shows confidence score (e.g. "Tired — 98%")

### 💬 2. AI Wellness Chat
- GPT-powered chatbot specialised in mental wellness
- Ask anything: stress tips, mindfulness exercises, anxiety science
- Remembers your full conversation for context
- Supports voice input

### 🏠 3. Room (Wellness Lounge)
- Real-time group chat using **WebSocket / Socket.io**
- Multiple users can connect and chat simultaneously
- Anonymous usernames for privacy (FocusedSpark, CalmWave...)
- Shows who is online vs. away

### 😊 4. Face Emotion Detection
- Opens your webcam and runs a **CNN (deep learning model)** using **face-api.js**
- Detects 7 emotions: Neutral, Happy, Sad, Angry, Fearful, Disgusted, Surprised
- Averages 12 frames for accuracy
- All processing happens **in your browser** — no face data sent to server

### 📊 Stress Score
- Combines all 3 module outputs into a live **0–100 stress score**
- Updates in the top navbar whenever you use any module

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | HTML, CSS, JavaScript | User interface |
| Voice | Web Speech API + Web Audio API | Transcription + audio analysis |
| AI Chat | OpenAI GPT-3.5 | Conversational AI |
| Real-time Room | Socket.io (WebSocket) | Instant messaging |
| Face Detection | face-api.js (TensorFlow.js) | CNN emotion model |
| Backend | Node.js + Express | Server + API endpoints |
| Hosting | Replit | Cloud deployment |

---

## 📁 Project Structure

```
neuroweave-x/
│
├── server.js              # Main Node.js server (Express + Socket.io + OpenAI)
├── package.json           # Project dependencies
├── .env                   # Secret keys (NOT committed to GitHub)
│
└── public/                # Frontend files (served to browser)
    ├── index.html         # Main HTML — all 4 tabs
    ├── style.css          # Dark theme design
    ├── app.js             # Tab navigation
    ├── voice.js           # Voice emotion analyzer
    ├── chat.js            # AI wellness chat
    ├── room.js            # Real-time room (Socket.io client)
    ├── face.js            # Face emotion detection
    ├── stress.js          # Stress score calculator
    └── models/            # face-api.js CNN model weights
```

---

## 🚀 How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/neuroweave-x.git
cd neuroweave-x
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file with your OpenAI key
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

### 4. Download face-api.js model files
Place these files in `public/models/`:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`

Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

### 5. Start the server
```bash
npm start
```

### 6. Open in browser
```
http://localhost:3000
```

---

## 🏗️ How We Built It — Step by Step

### Step 1: Project Setup
We started by setting up a Node.js project with Express for our web server and Socket.io for real-time communication.

### Step 2: Voice Module
We researched the **Web Speech API** and **Web Audio API**, which are built into all modern browsers. The Speech API gives us text transcription, and the Audio API lets us measure acoustic properties of sound in real time.

### Step 3: AI Chat
We got an OpenAI API key and integrated the `openai` npm package into our backend. We wrote a system prompt that instructs GPT to act as a wellness coach.

### Step 4: Real-time Room
We learned how **WebSockets** work — unlike normal HTTP, they maintain a persistent connection. Socket.io makes this easy. The server broadcasts messages to all clients using `io.emit()`.

### Step 5: Face Detection
We discovered **face-api.js**, a library that provides pre-trained deep learning models that run entirely in the browser using TensorFlow.js. We just load the model weights and call their API.

### Step 6: Stress Score
We designed a weighted formula combining emotion signals from all modules into a single 0-100 score.

### Step 7: Deployment
We hosted everything on **Replit** which gives us a live URL instantly.

---

## 🔮 Future Plans

- Push notifications when stress is consistently high
- Historical stress tracking with charts
- Personalised breathing exercises based on detected emotion
- Mobile app version

---

## 👩‍💻 Team

Built with ❤️ for the hackathon finals.

---

## 📄 License

MIT License
