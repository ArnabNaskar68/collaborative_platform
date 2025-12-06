import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  allowEIO3: true,
});

const PORT = process.env.PORT || 3000;

// Store rooms and their documents
const rooms = new Map();
const userCursors = new Map(); // userId -> { roomId, position, name }

// Middleware
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Routes
app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (room) {
    res.json({
      roomId: req.params.roomId,
      content: room.content,
      users: room.users,
    });
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', (data) => {
    const { roomId, userName } = data;
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        content: '',
        users: new Map(),
        version: 0,
      });
    }

    const room = rooms.get(roomId);
    room.users.set(socket.id, { id: socket.id, name: userName });
    userCursors.set(socket.id, { roomId, position: 0, name: userName });

    // Send current document to the joining user
    socket.emit('doc-update', {
      content: room.content,
      version: room.version,
      users: Array.from(room.users.values()),
    });

    // Broadcast user joined
    io.to(roomId).emit('user-joined', {
      userId: socket.id,
      userName,
      users: Array.from(room.users.values()),
    });

    console.log(`${userName} joined room ${roomId}`);
  });

  // Handle document changes (collaborative editing)
  socket.on('doc-change', (data) => {
    const { roomId, change, version } = data;
    const room = rooms.get(roomId);

    if (!room) return;

    // Update room content
    room.content = change.content;
    room.version = version;

    console.log(`📝 Doc updated in room ${roomId}, version ${version}`);

    // Broadcast change to ALL users in the room (including sender)
    io.to(roomId).emit('doc-update', {
      content: room.content,
      version: room.version,
      userId: socket.id,
    });
  });

  // Handle cursor movements
  socket.on('cursor-move', (data) => {
    const { roomId, position } = data;
    const cursor = userCursors.get(socket.id);

    if (cursor) {
      cursor.position = position;
      // Broadcast cursor position to other users in the room
      io.to(roomId).emit('cursor-update', {
        userId: socket.id,
        userName: cursor.name,
        position,
      });
    }
  });

  // Handle user typing status
  socket.on('user-typing', (data) => {
    const { roomId, isTyping } = data;
    const cursor = userCursors.get(socket.id);

    if (cursor) {
      io.to(roomId).emit('typing-status', {
        userId: socket.id,
        userName: cursor.name,
        isTyping,
      });
    }
  });

  // Leave room
  socket.on('leave-room', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      const user = room.users.get(socket.id);
      room.users.delete(socket.id);
      io.to(roomId).emit('user-left', {
        userId: socket.id,
        userName: user?.name,
        users: Array.from(room.users.values()),
      });
    }
    userCursors.delete(socket.id);
    socket.leave(roomId);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const cursor = userCursors.get(socket.id);
    if (cursor) {
      const room = rooms.get(cursor.roomId);
      if (room) {
        room.users.delete(socket.id);
        io.to(cursor.roomId).emit('user-left', {
          userId: socket.id,
          userName: cursor.name,
          users: Array.from(room.users.values()),
        });
      }
      userCursors.delete(socket.id);
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});