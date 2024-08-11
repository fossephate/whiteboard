const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app);
const fs = require('fs').promises;
const path = require('path');

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
  if (getLastState(roomCode) == null && data == null) {
    return;
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

async function saveRoomState() {
  try {
    const stateDir = path.join(__dirname, 'room_states');

    // Ensure the directory exists
    await fs.mkdir(stateDir, { recursive: true });

    // Save each room's state to a separate file
    for (const [roomCode, roomData] of Object.entries(rooms)) {
      const filePath = path.join(stateDir, `${roomCode}.json`);
      await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));
    }

    console.log('Room states saved successfully.');
  } catch (error) {
    console.error('Error saving room states:', error);
  }
}

// Load saved room states on server start
async function loadRoomStates() {
  try {
    const stateDir = path.join(__dirname, 'room_states');

    // Ensure the directory exists
    await fs.mkdir(stateDir, { recursive: true });

    const files = await fs.readdir(stateDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const roomCode = path.basename(file, '.json');
        const filePath = path.join(stateDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        rooms[roomCode] = JSON.parse(data);
      }
    }

    console.log('Room states loaded successfully.');
  } catch (error) {
    console.error('Error loading room states:', error);
  }
}

setInterval(() => {
  io.emit('ping');
}, 2000);

setInterval(() => {
  saveRoomState();
}, 1000 * 30);

io.on('connection', (socket) => {
  let currentRoom: any = null;

  socket.emit('must-join-a-room');

  socket.on('join-room', (roomCode?: string) => {
    if (roomCode == null) {
      return;
    }
    roomCode = roomCode.toLowerCase();
    if (currentRoom) {
      socket.leave(currentRoom);
    }
    socket.join(roomCode);
    currentRoom = roomCode;
    socket.emit('state-from-server', getLastState(roomCode));
  });

  socket.on('get-state', () => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    socket.emit('state-from-server', getLastState(currentRoom));
  });

  socket.on('pointer-start', (data) => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    socket.to(currentRoom).emit('pointer-start', data);
  });

  socket.on('pointer-move', (data) => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    socket.to(currentRoom).emit('pointer-move', data);
  });

  socket.on('pointer-end', (data) => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    socket.to(currentRoom).emit('pointer-end', data);
  });

  socket.on('undo', () => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    if (rooms[currentRoom]) {
      const room = rooms[currentRoom];
      if (room.indexOffset < room.states.length) {
        room.indexOffset++;
      }
      io.to(currentRoom).emit('state-from-server', getLastState(currentRoom));
    }
  });

  socket.on('redo', () => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    if (rooms[currentRoom]) {
      const room = rooms[currentRoom];
      if (room.indexOffset > 0) {
        room.indexOffset--;
        io.to(currentRoom).emit('state-from-server', getLastState(currentRoom));
      }
    }
  });

  socket.on('set-state', (data) => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    pushState(currentRoom, data.shapes);
  });

  socket.on('erase-all', (data) => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    socket.to(currentRoom).emit('erase-all', data);
  });

  socket.on('reset-doc', () => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    pushState(currentRoom, null);
    io.to(currentRoom).emit('state-from-server', null);
  });

  socket.on('patch-style', (data) => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    socket.to(currentRoom).emit('patch-style', data);
  });

  socket.on('patch-style-all-shapes', (data) => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    socket.to(currentRoom).emit('patch-style-all-shapes', data);
  });

  socket.on('disconnect', () => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }
    socket.leave(currentRoom);
  });
})


// Call loadRoomStates before starting the server
loadRoomStates().then(() => {
  server.listen(8201, () => {
    console.log('✔️ Server listening on port 8201');
  });
});