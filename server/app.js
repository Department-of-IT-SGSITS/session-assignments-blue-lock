const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

/* ------------------- MIDDLEWARE ------------------- */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

/* ------------------- ROUTES ------------------- */
app.use('/', indexRouter);
app.use('/users', usersRouter);

/* ------------------- SERVE VITE CLIENT ------------------- */
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

/* ------------------- ERROR HANDLING ------------------- */
// Handle 404
app.use((req, res, next) => {
  res.status(404);
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

// Handle other errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500);
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});


/* ------------------- SOCKET.IO ------------------- */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // replace with your frontend URL in production
    methods: ["GET", "POST"],
  },
});

// In-memory storage of document contents (for demo purposes)
// In production, replace with MongoDB or another DB
const documents = {};

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  // Join a document room
  socket.on('join-doc', (docId) => {
    socket.join(docId);
    console.log(`📄 User ${socket.id} joined doc ${docId}`);

    // Send current document content to the newly joined user
    if (documents[docId]) {
      socket.emit('load-doc', documents[docId]);
    } else {
      documents[docId] = ''; // initialize empty doc
    }
  });

  // Receive content updates from clients
  socket.on('send-changes', ({ docId, html, sender }) => {
    // Update document in memory
    documents[docId] = html;

    // Broadcast to other users in the same room
    socket.to(docId).emit('receive-changes', { html, sender });
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

/* ------------------- START SERVER ------------------- */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, server };
