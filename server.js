const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (waitingUser) {
    // Pair with waiting user
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit('chat start');
    waitingUser.emit('chat start');

    waitingUser = null;
  } else {
    // Wait for partner
    waitingUser = socket;
    socket.emit('waiting');
  }

  socket.on('message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('message', msg);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.partner) {
      socket.partner.emit('partner disconnected');
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
