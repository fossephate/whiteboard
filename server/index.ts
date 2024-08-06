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

type Point = { x: number; y: number }

type DrawLine = {
  prevPoint: Point | null
  currentPoint: Point
  color: string
}

io.on('connection', (socket) => {
  // socket.on('client-ready', () => {
  //   socket.broadcast.emit('get-canvas-state')
  // })

  // socket.on('canvas-state', (state) => {
  //   console.log('received canvas state')
  //   socket.broadcast.emit('canvas-state-from-server', state)
  // })

  // socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLine) => {
  //   socket.broadcast.emit('draw-line', { prevPoint, currentPoint, color })
  // })

  socket.on('pointer-start', (data) => {
    socket.broadcast.emit('pointer-start', data);
  });

  socket.on('pointer-move', (data) => {
    socket.broadcast.emit('pointer-move', data);
  });

  socket.on('pointer-end', (data) => {
    socket.broadcast.emit('pointer-end', data);
  });


  socket.on('shape-complete', (data) => {
    socket.broadcast.emit('shape-complete', data);
  });

  socket.on('erase-all', (data) => {
    socket.broadcast.emit('erase-all', data);
  });

  socket.on('reset-doc', (data) => {
    socket.broadcast.emit('reset-doc', data);
  });

  socket.on('patch-style', (data) => {
    socket.broadcast.emit('patch-style', data);
  });

  socket.on('patch-style-all-shapes', (data) => {
    socket.broadcast.emit('patch-style-all-shapes', data);
  });

  // socket.on('reset-doc', (data) => {
  //   socket.broadcast.emit('reset-doc', data);
  // });

  // socket.on('')

  socket.on('clear', () => io.emit('clear'))
})

server.listen(8201, () => {
  console.log('✔️ Server listening on port 8201')
})
