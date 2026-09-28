const app = require('./app');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('joinMonument', (monumentId) => {
    socket.join(`monument_${monumentId}`);
    console.log(`Socket ${socket.id} joined monument_${monumentId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const startServer = () => {
  server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await connectDB();
  });
};

startServer();
