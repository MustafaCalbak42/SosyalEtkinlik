const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Routes import
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Middleware import
const { errorHandler } = require('./middleware/errorMiddleware');
const { authMiddleware } = require('./middleware/authMiddleware');

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);

// Error handling middleware
app.use(errorHandler);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB Connected');
    
    // Start server after DB connection
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Socket.io setup
    const io = require('socket.io')(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Socket.io connection
    io.on('connection', (socket) => {
      console.log('New client connected');
      
      // Join a room
      socket.on('join', (room) => {
        socket.join(room);
      });
      
      // Send message
      socket.on('message', (data) => {
        io.to(data.room).emit('message', data);
      });
      
      // Disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
    
  })
  .catch((err) => console.log('MongoDB Connection Error:', err));

module.exports = app; 