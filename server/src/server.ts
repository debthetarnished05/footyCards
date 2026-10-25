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
app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
  res.json({
    message:"Welcome to footyCards"
  })
})
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();



io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
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