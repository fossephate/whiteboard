import express from 'express';
import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const server = createServer(app);

// Define __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  while (room.states.length > 5) {
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
      try {
        const filePath = path.join(stateDir, `${roomCode}.json`);
        await fs.writeFile(filePath, JSON.stringify(roomData, null, 2));
      } catch (error) {
        console.error(`Error loading room ${roomCode}:`, error);
      }
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
      try {
        if (file.endsWith('.json')) {
          const roomCode = path.basename(file, '.json');
          const filePath = path.join(stateDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          rooms[roomCode] = JSON.parse(data);
        }
      } catch (error) {
        console.error(`Error loading room ${file}:`, error);
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

  console.log('someone connected', socket.id);

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

  socket.on('updates', (data) => {
    if (!currentRoom) {
      socket.emit('must-join-a-room');
      return;
    }

    socket.to(currentRoom).emit('updates', data);
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
    pushState(currentRoom, data);
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