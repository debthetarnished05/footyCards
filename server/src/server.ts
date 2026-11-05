import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { RoomManager } from './engine/RoomManager.js';
import { registerGameHandlers } from './handlers/gameHandlers.js';

dotenv.config();

const app = express();

const clientUrl = process.env.CLIENT_URL;
const allowedOrigins = clientUrl && clientUrl !== '*'
  ? [clientUrl, 'http://localhost:5173']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to footyCards',
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 45000,
  pingInterval: 20000,
});

// Middleware to extract persistent user ID from socket auth/query
io.use((socket, next) => {
  const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId || socket.id;
  socket.data.userId = userId as string;
  next();
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`Client connected: socket=${socket.id}, userId=${userId}`);
  registerGameHandlers(io, socket, roomManager);
});

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
};

startServer();
