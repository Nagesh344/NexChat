const WebSocket = require('ws');
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');
const { verifyWSToken } = require('./middleware/auth');

// Map of userId -> Set of WebSocket connections (supports multiple tabs)
const clients = new Map();
// Map of room -> Set of userIds
const roomMembers = new Map();

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    // Extract token from query string
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'No token provided');
      return;
    }

    const decoded = verifyWSToken(token);
    if (!decoded) {
      ws.close(1008, 'Invalid token');
      return;
    }

    const userId = decoded.id;
    ws.userId = userId;
    ws.isAlive = true;

    // Register client connection
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(ws);

    // Update user status
    await User.findByIdAndUpdate(userId, { status: 'online' });
    broadcastUserStatus(userId, 'online');

    console.log(`🔌 User ${userId} connected (${clients.get(userId).size} connections)`);

    // Ping/pong heartbeat
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        await handleMessage(ws, userId, msg);
      } catch (err) {
        sendToClient(ws, { type: 'error', message: 'Invalid message format' });
      }
    });

    ws.on('close', async () => {
      const userConns = clients.get(userId);
      if (userConns) {
        userConns.delete(ws);
        if (userConns.size === 0) {
          clients.delete(userId);
          // Remove from all rooms
          roomMembers.forEach((members, room) => members.delete(userId));
          await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
          broadcastUserStatus(userId, 'offline');
          console.log(`🔌 User ${userId} disconnected`);
        }
      }
    });

    ws.on('error', (err) => console.error('WS error:', err.message));
  });

  // Heartbeat interval - detect dead connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));

  return wss;
};

async function handleMessage(ws, userId, msg) {
  switch (msg.type) {
    case 'join_room':
      await handleJoinRoom(ws, userId, msg.room);
      break;
    case 'leave_room':
      handleLeaveRoom(userId, msg.room);
      break;
    case 'send_message':
      await handleSendMessage(ws, userId, msg);
      break;
    case 'typing_start':
      broadcastToRoom(msg.room, { type: 'typing_start', userId, username: msg.username }, userId);
      break;
    case 'typing_stop':
      broadcastToRoom(msg.room, { type: 'typing_stop', userId }, userId);
      break;
    case 'ping':
      sendToClient(ws, { type: 'pong' });
      break;
    default:
      sendToClient(ws, { type: 'error', message: `Unknown message type: ${msg.type}` });
  }
}

async function handleJoinRoom(ws, userId, roomName) {
  if (!roomMembers.has(roomName)) roomMembers.set(roomName, new Set());
  roomMembers.get(roomName).add(userId);

  ws.currentRoom = roomName;

  // Get online members in room
  const onlineInRoom = Array.from(roomMembers.get(roomName));

  sendToClient(ws, {
    type: 'room_joined',
    room: roomName,
    onlineUsers: onlineInRoom,
  });

  // Notify others in room
  broadcastToRoom(roomName, {
    type: 'user_joined',
    userId,
    room: roomName,
  }, userId);

  // Update room membership in DB
  await Room.findOneAndUpdate({ name: roomName }, { $addToSet: { members: userId } });
}

function handleLeaveRoom(userId, roomName) {
  if (roomMembers.has(roomName)) {
    roomMembers.get(roomName).delete(userId);
    broadcastToRoom(roomName, { type: 'user_left', userId, room: roomName });
  }
}

async function handleSendMessage(ws, userId, msg) {
  const { room, content } = msg;
  if (!content || !content.trim()) return;

  try {
    // Save to MongoDB
    const message = await Message.create({ sender: userId, room, content: content.trim() });
    await message.populate('sender', 'username avatar status');

    // Update room's lastMessage
    await Room.findOneAndUpdate({ name: room }, { lastMessage: message._id });

    const payload = {
      type: 'new_message',
      message: {
        _id: message._id,
        sender: message.sender,
        room,
        content: message.content,
        createdAt: message.createdAt,
      },
    };

    // Broadcast to all in room (including sender for confirmation)
    broadcastToRoom(room, payload);
  } catch (err) {
    sendToClient(ws, { type: 'error', message: 'Failed to send message' });
  }
}

function sendToClient(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastToRoom(room, data, excludeUserId = null) {
  const members = roomMembers.get(room);
  if (!members) return;

  members.forEach((uid) => {
    if (excludeUserId && uid === excludeUserId) return;
    const userConns = clients.get(uid);
    if (userConns) {
      userConns.forEach((ws) => sendToClient(ws, data));
    }
  });
}

function broadcastUserStatus(userId, status) {
  const payload = JSON.stringify({ type: 'user_status', userId, status });
  clients.forEach((conns) => {
    conns.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
  });
}

module.exports = { setupWebSocket };
