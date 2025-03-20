const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const connectDB = require('./config/db');
const path = require('path');

// Routes
const userRoutes = require('./routes/userRoutes');
const hobbyRoutes = require('./routes/hobbyRoutes');
const eventRoutes = require('./routes/eventRoutes');

// Load env variables
dotenv.config({ path: '../.env' });

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// File upload directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/hobbies', hobbyRoutes);
app.use('/api/events', eventRoutes);

// Server health check
app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.io
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Socket.io connection events
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Join chat room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });
  
  // Listen for chat messages
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
  });
  
  // Disconnect event
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 