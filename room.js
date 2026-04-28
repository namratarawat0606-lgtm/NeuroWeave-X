// ============================================================
// room.js — Wellness Lounge (Real-time Chat Room)
//
// HOW IT WORKS (simple explanation):
//
// Normal websites: You ask, server responds. Done. (one-way)
// WebSocket (Socket.io): The connection STAYS OPEN permanently.
// Anyone can send data to anyone, at any time, instantly.
//
// Think of it like a phone call that never hangs up.
// When any user says something, the server BROADCASTS it
// to every other connected user in milliseconds.
//
// Steps:
// 1. User opens the page → browser connects to server via WebSocket
// 2. Server assigns them a random username (FocusedSpark, etc.)
// 3. User sends message → server receives it → broadcasts to everyone
// 4. All browsers receive the broadcast → display the message
// ============================================================

// Connect to our server's Socket.io endpoint
const socket = io();

// Our username (assigned by server)
let myUsername = '';
let isAway = false;

// ============================================================
// Events we RECEIVE from the server
// ============================================================

// Server tells us our random username
socket.on('assignUsername', (username) => {
  myUsername = username;
  document.getElementById('roomInput').placeholder = `Message as ${username}...`;
  document.getElementById('roomFooter').innerHTML =
    `You appear as <strong>${username}</strong> · Open in another browser to test multi-user`;
});

// Server sends the updated list of all online users
socket.on('userList', (users) => {
  const count = users.length;
  document.getElementById('onlineCount').textContent =
    count + ' online · ' + count + ' members';

  const listEl = document.getElementById('userList');
  listEl.innerHTML = '';

  users.forEach((user) => {
    const div = document.createElement('div');
    div.className = 'user-item';
    div.innerHTML = `
      <div class="user-avatar" style="background:${stringToColor(user.username)}">
        ${user.username[0]}
      </div>
      <div class="user-info">
        <span class="user-name">${user.username} ${user.username === myUsername ? '(you)' : ''}</span>
        <span class="user-status ${user.status}">${user.status}</span>
      </div>
      <span class="status-dot ${user.status === 'online' ? 'green' : 'gray'}"></span>
    `;
    listEl.appendChild(div);
  });
});

// Server broadcasts a message (from any user or system)
socket.on('receiveMessage', (data) => {
  appendRoomMessage(data);
});

// ============================================================
// Events we SEND to the server
// ============================================================

function sendRoomMessage() {
  const input = document.getElementById('roomInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  // Emit (send) the message to the server
  // Server will then emit it to ALL connected users
  socket.emit('sendMessage', text);
}

function toggleAway() {
  isAway = !isAway;
  const status = isAway ? 'away' : 'online';
  socket.emit('setStatus', status);

  const btn = document.getElementById('awayBtn');
  btn.textContent = isAway ? 'Set Online' : 'Set Away';
  btn.style.background = isAway ? '#444' : '';
}

// ============================================================
// appendRoomMessage() — adds a message to the room UI
// ============================================================
function appendRoomMessage(data) {
  const messagesDiv = document.getElementById('roomMessages');

  const div = document.createElement('div');

  if (data.isSystem) {
    // System messages (join/leave notifications)
    div.className = 'room-system-msg';
    div.textContent = data.text;
  } else {
    div.className = 'room-msg';
    const isMe = data.user === myUsername;
    div.innerHTML = `
      <div class="room-msg-header">
        <span class="room-msg-user" style="color:${stringToColor(data.user)}">${data.user}</span>
        <span class="room-msg-time">${data.time}</span>
      </div>
      <div class="room-msg-text ${isMe ? 'mine' : ''}">${escapeHtml(data.text)}</div>
    `;
  }

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Convert a username string to a consistent colour (for avatar background)
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
