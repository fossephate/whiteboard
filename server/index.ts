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

let states: any[] = [];
let indexOffset = 0;

function getLastState() {
  if (states.length > 0) {
    return states[states.length - 1 - indexOffset];
  }
  return null;
}

function pushState(data: any) {
  if (indexOffset == 0) {
    states.push(data);
  } else {
    // When indexOffset > 0, we need to remove the future states
    states = states.slice(0, states.length - indexOffset);
    states.push(data);
    indexOffset = 0;
  }

  if (states.length > 50) {
    states.shift();
  }
}

io.on('connection', (socket) => {

  socket.on('get-state', (data) => {
    socket.emit('state-from-server', getLastState());
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
    if (indexOffset < states.length) {
      indexOffset++;
    }
    io.emit('state-from-server', getLastState());
  });

  socket.on('redo', (data) => {
    if (indexOffset > 0) {
      indexOffset--;
      io.emit('state-from-server', getLastState());
    }
  });


  socket.on('set-state', (data) => {
    pushState(data.shapes);
  });

  // force update other clients:
  // socket.on('force-state', (data) => {
  //   lastState = data;
  //   states.push(data);
  //   socket.broadcast.emit('state-from-server', data);
  // });

  socket.on('erase-all', (data) => {
    socket.broadcast.emit('erase-all', data);
  });

  socket.on('reset-doc', (data) => {
    pushState(null);
    socket.broadcast.emit('state-from-server', null);
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
