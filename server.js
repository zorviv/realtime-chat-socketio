const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // React frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user join event
  socket.on('user_joined', (username) => {
    connectedUsers.set(socket.id, username);
    console.log(`${username} joined the chat`);
    
    // Broadcast to all clients that a new user joined
    io.emit('user_connected', {
      username,
      message: `${username} has joined the chat`,
      timestamp: new Date().toISOString(),
      userCount: connectedUsers.size
    });

    // Send current user count to all clients
    io.emit('user_count', connectedUsers.size);
  });

  // Handle incoming messages
  socket.on('send_message', (data) => {
    const { username, message } = data;
    const messageData = {
      id: Date.now(),
      username,
      message,
      timestamp: new Date().toISOString()
    };
    
    console.log(`Message from ${username}: ${message}`);
    
    // Broadcast message to all connected clients
    io.emit('receive_message', messageData);
  });

  // Handle typing indicator
  socket.on('typing', (username) => {
    socket.broadcast.emit('user_typing', username);
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('user_stop_typing');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = connectedUsers.get(socket.id);
    
    if (username) {
      console.log(`${username} disconnected`);
      connectedUsers.delete(socket.id);
      
      // Broadcast to all clients that a user left
      io.emit('user_disconnected', {
        username,
        message: `${username} has left the chat`,
        timestamp: new Date().toISOString(),
        userCount: connectedUsers.size
      });

      // Send updated user count
      io.emit('user_count', connectedUsers.size);
    } else {
      console.log('Client disconnected:', socket.id);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeUsers: connectedUsers.size,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Real-Time Chat Server with Socket.io',
    activeUsers: connectedUsers.size
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.io server is ready for connections`);
});
