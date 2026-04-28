// ============================================================
// server.js — NeuroWeave X Backend
// This is the main file that runs our Node.js server.
// It does two things:
//   1. Serves our frontend HTML/CSS/JS files to the browser
//   2. Handles real-time chat (Room) using Socket.io
//   3. Handles AI Chat calls to OpenAI
// ============================================================

const express = require('express');        // Express helps us create a web server easily
const http = require('http');              // Node's built-in HTTP module
const { Server } = require('socket.io');  // Socket.io for real-time messaging
const OpenAI = require('openai');          // OpenAI SDK to call ChatGPT
const path = require('path');             // Helps with file paths
require('dotenv').config();               // Loads secret keys from .env file

// --- Setup ---
const app = express();                    // Create our Express app
const server = http.createServer(app);    // Wrap it in HTTP server
const io = new Server(server);           // Attach Socket.io to the server
const PORT = process.env.PORT || 3000;   // Use Replit's port or 3000 locally

// OpenAI client — uses our API key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Allow Express to read JSON from requests
app.use(express.json());

// Serve everything in the "public" folder as static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));


// ============================================================
// REST API — AI Wellness Chat
// When the user sends a message in the Chat tab,
// the frontend calls this endpoint.
// We forward it to OpenAI and send back GPT's reply.
// ============================================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    // history = all previous messages so GPT remembers the conversation

    // Build the message array for OpenAI
    // System message tells GPT what role to play
    const messages = [
      {
        role: 'system',
        content: `You are NeuroWeave, a friendly and empathetic AI wellness assistant.
                  You help users understand and manage stress, anxiety, emotions, and mental health.
                  Keep answers warm, supportive, science-based, and concise (under 150 words).
                  Never diagnose. Always suggest professional help for serious issues.`,
      },
      ...history,  // Add previous messages
      { role: 'user', content: message }, // Add the new message
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 300,
      temperature: 0.7,  // Controls creativity (0 = robotic, 1 = very creative)
    });

    // Extract the reply text from OpenAI's response
    const reply = completion.choices[0].message.content;

    // Send reply back to the frontend
    res.json({ reply, success: true });

  } catch (error) {
    console.error('OpenAI error:', error.message);
    res.status(500).json({ error: 'AI service unavailable', success: false });
  }
});


// ============================================================
// SOCKET.IO — Real-time Room (Wellness Lounge)
// Socket.io creates a permanent two-way connection
// between the server and every user's browser.
// When one user sends a message, we "emit" (broadcast)
// it to ALL connected users instantly.
// ============================================================

// Store connected users: { socketId: { username, status } }
const connectedUsers = {};

// Generate a random wellness-themed username
function generateUsername() {
  const adjectives = ['Calm', 'Focused', 'Bright', 'Peaceful', 'Mindful', 'Serene', 'Brave', 'Gentle'];
  const nouns = ['Spark', 'Wave', 'Bloom', 'Mind', 'Soul', 'Star', 'Light', 'River'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return adj + noun;
}

// This runs every time a new user connects to the Room
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Assign the new user a random username
  const username = generateUsername();
  connectedUsers[socket.id] = { username, status: 'online' };

  // Tell this specific user what their username is
  socket.emit('assignUsername', username);

  // Tell EVERYONE the updated user list
  io.emit('userList', Object.values(connectedUsers));

  // Send the new user a welcome message
  socket.emit('receiveMessage', {
    user: 'NeuroWeave',
    text: `Welcome to the Wellness Lounge, ${username}! You are not alone. 💙`,
    time: new Date().toLocaleTimeString(),
    isSystem: true,
  });

  // Tell everyone else that someone joined
  socket.broadcast.emit('receiveMessage', {
    user: 'NeuroWeave',
    text: `${username} joined the lounge.`,
    time: new Date().toLocaleTimeString(),
    isSystem: true,
  });


  // When a user sends a message, broadcast it to everyone
  socket.on('sendMessage', (text) => {
    const user = connectedUsers[socket.id];
    if (!user) return;

    io.emit('receiveMessage', {
      user: user.username,
      text: text,
      time: new Date().toLocaleTimeString(),
      isSystem: false,
    });
  });


  // When a user changes their status (Online/Away)
  socket.on('setStatus', (status) => {
    if (connectedUsers[socket.id]) {
      connectedUsers[socket.id].status = status;
      io.emit('userList', Object.values(connectedUsers)); // Update everyone's user list
    }
  });


  // When a user disconnects (closes tab, loses internet)
  socket.on('disconnect', () => {
    const user = connectedUsers[socket.id];
    if (user) {
      // Tell everyone they left
      io.emit('receiveMessage', {
        user: 'NeuroWeave',
        text: `${user.username} has left the lounge.`,
        time: new Date().toLocaleTimeString(),
        isSystem: true,
      });
      // Remove them from our list
      delete connectedUsers[socket.id];
      io.emit('userList', Object.values(connectedUsers));
    }
    console.log('User disconnected:', socket.id);
  });
});


// ============================================================
// Start the server
// ============================================================
server.listen(PORT, () => {
  console.log(`✅ NeuroWeave X running on port ${PORT}`);
});
