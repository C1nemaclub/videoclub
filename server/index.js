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

  const otherUsers = getOthersUsers(socket.id);
  socket.emit('all-users', otherUsers);

  socket.on('call-user', (payload)=>{
    io.to(payload.userToCall).emit('user-joined', {signal: payload.signal, callerID: payload.callerID})
  })

  socket.on('answer-call', (payload)=>{
    io.to(payload.callerID).emit('call-accepted', {signal: payload.signal, id: socket.id})
  })

  socket.on('disconnect', () => {
    delete users[socket.id]
    console.log(`User ${socket.id} disconnected`);
  });
});

const getOthersUsers = (myID) => {
  return Object.values(users).filter((user) => user.id !== myID);
};
