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

let rooms: any = {};

function getLastState(roomCode: string) {
  if (!rooms[roomCode]) {
    rooms[roomCode] = { states: [], indexOffset: 0 };
  }
  const room = rooms[roomCode];
  if (room.states.length > 0) {
    return room.states[room.states.length - 1 - room.indexOffset];
  }
  return null;
}

function pushState(roomCode: string, data: any) {
  if (!rooms[roomCode]) {
    rooms[roomCode] = { states: [], indexOffset: 0 };
  }
  const room = rooms[roomCode];
  if (room.indexOffset == 0) {
    room.states.push(data);
  } else {
    room.states = room.states.slice(0, room.states.length - room.indexOffset);
    room.states.push(data);
    room.indexOffset = 0;
  }

  if (room.states.length > 50) {
    room.states.shift();
  }
}

io.on('connection', (socket) => {
  let currentRoom: any = null;

  socket.on('join-room', (roomCode) => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }
    socket.join(roomCode);
    currentRoom = roomCode;
    socket.emit('state-from-server', getLastState(roomCode));
  });

  socket.on('get-state', () => {
    if (currentRoom) {
      socket.emit('state-from-server', getLastState(currentRoom));
    }
  });

  socket.on('pointer-start', (data) => {
    socket.to(currentRoom).emit('pointer-start', data);
  });

  socket.on('pointer-move', (data) => {
    socket.to(currentRoom).emit('pointer-move', data);
  });

  socket.on('pointer-end', (data) => {
    socket.to(currentRoom).emit('pointer-end', data);
  });

  socket.on('undo', () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      if (room.indexOffset < room.states.length) {
        room.indexOffset++;
      }
      io.to(currentRoom).emit('state-from-server', getLastState(currentRoom));
    }
  });

  socket.on('redo', () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      if (room.indexOffset > 0) {
        room.indexOffset--;
        io.to(currentRoom).emit('state-from-server', getLastState(currentRoom));
      }
    }
  });

  socket.on('set-state', (data) => {
    if (currentRoom) {
      pushState(currentRoom, data.shapes);
    }
  });

  socket.on('erase-all', (data) => {
    socket.to(currentRoom).emit('erase-all', data);
  });

  socket.on('reset-doc', () => {
    if (currentRoom) {
      pushState(currentRoom, null);
      io.to(currentRoom).emit('state-from-server', null);
    }
  });

  socket.on('patch-style', (data) => {
    socket.to(currentRoom).emit('patch-style', data);
  });

  socket.on('patch-style-all-shapes', (data) => {
    socket.to(currentRoom).emit('patch-style-all-shapes', data);
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }
  });
})

server.listen(8201, () => {
  console.log('✔️ Server listening on port 8201')
})