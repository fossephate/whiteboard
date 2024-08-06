const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)

import { Server } from 'socket.io'
const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

let lastState: any = {};

io.on('connection', (socket) => {

  socket.on('get-state', (data) => {
    socket.emit('state-from-server', lastState);
  });

  socket.on('pointer-start', (data) => {
    socket.broadcast.emit('pointer-start', data);
  });

  socket.on('pointer-move', (data) => {
    socket.broadcast.emit('pointer-move', data);
  });

  socket.on('pointer-end', (data) => {
    socket.broadcast.emit('pointer-end', data);
  });


  socket.on('undo', (data) => {
    socket.broadcast.emit('undo', data);
  });

  socket.on('redo', (data) => {
    socket.broadcast.emit('redo', data);
  });


  socket.on('set-state', (data) => {
    lastState = data;
  });

  // force update other clients:
  socket.on('force-state', (data) => {
    lastState = data;
    socket.broadcast.emit('state-from-server', data);
  });

  socket.on('erase-all', (data) => {
    socket.broadcast.emit('erase-all', data);
  });

  socket.on('reset-doc', (data) => {
    lastState = null;
    socket.broadcast.emit('reset-doc', data);
  });

  socket.on('patch-style', (data) => {
    socket.broadcast.emit('patch-style', data);
  });

  socket.on('patch-style-all-shapes', (data) => {
    socket.broadcast.emit('patch-style-all-shapes', data);
  });
})

server.listen(8201, () => {
  console.log('✔️ Server listening on port 8201')
})
