// ============================================================
// chat.js — AI Wellness Chat
//
// HOW IT WORKS:
// 1. User types a message and hits Enter (or clicks send)
// 2. We send that message to our backend at POST /api/chat
// 3. Our backend (server.js) forwards it to OpenAI's GPT
// 4. GPT sends back a reply, we display it in the chat UI
//
// We also keep a "history" array so GPT remembers the
// whole conversation (not just the last message).
// ============================================================

// Stores all previous messages so GPT has context
let chatHistory = [];

// ============================================================
// sendChat() — called when user hits Enter or the send button
// ============================================================
async function sendChat() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';

  // Hide welcome screen, show messages area
  document.getElementById('chatWelcome').style.display = 'none';
  document.getElementById('chatMessages').style.display = 'flex';

  // Add the user's message to the screen
  appendChatMessage('user', message);

  // Add to history so GPT remembers it
  chatHistory.push({ role: 'user', content: message });

  // Show a loading "..." while waiting for GPT
  const loadingId = appendChatMessage('assistant', '...', true);

  try {
    // Call our backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        history: chatHistory.slice(-10), // Only send last 10 messages (saves tokens)
      }),
    });

    const data = await response.json();

    // Remove loading message
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    if (data.success) {
      appendChatMessage('assistant', data.reply);
      chatHistory.push({ role: 'assistant', content: data.reply });
    } else {
      appendChatMessage('assistant', 'Sorry, I had trouble connecting. Please try again.');
    }

  } catch (err) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    appendChatMessage('assistant', 'Connection error. Please check your internet.');
    console.error('Chat error:', err);
  }
}

// ============================================================
// appendChatMessage() — adds a message bubble to the chat UI
// ============================================================
function appendChatMessage(role, text, isLoading = false) {
  const messagesDiv = document.getElementById('chatMessages');
  const id = 'msg-' + Date.now() + Math.random();

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.id = id;

  if (isLoading) {
    bubble.innerHTML = '<span class="loading-dots">● ● ●</span>';
  } else {
    bubble.textContent = text;
  }

  messagesDiv.appendChild(bubble);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to bottom
  return id;
}

// Quick prompt buttons on the welcome screen
function sendQuick(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

// Reset the chat to welcome screen
function newChat() {
  chatHistory = [];
  document.getElementById('chatWelcome').style.display = 'flex';
  document.getElementById('chatMessages').style.display = 'none';
  document.getElementById('chatMessages').innerHTML = '';
}

// Voice input for chat — converts speech to text, then sends
function startChatVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Speech recognition not supported in this browser.');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.onresult = (e) => {
    document.getElementById('chatInput').value = e.results[0][0].transcript;
    sendChat();
  };
  recognition.start();
}
