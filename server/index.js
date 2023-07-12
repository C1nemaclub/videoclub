import express from 'express';
import { Server } from 'socket.io';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Server is ready');
});

const server = app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const users = {};

io.on('connection', (socket) => {

  console.log(`User ${socket.id} connected`);
  users[socket.id] = {
    id: socket.id,
  };

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
  });
  
});
