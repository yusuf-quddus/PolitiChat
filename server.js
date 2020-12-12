// npm run devStart

const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const rooms = {}
const topics = {'Gun Control': {}, 'Abortion': {}, 'Free Speech': {}}
const MAX = 3
const empty = {}

var numUsers = {}

app.get('/', (req, res) => {
  for(let topic in topics) {
    rooms[topic] = { users: {} }
    empty[topic] = true
  }
  res.render('index', { rooms: rooms })
})

app.post('/room', (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect('/')
  }
  rooms[req.body.room] = { users: {} }
  res.redirect(req.body.room)
  // Send message that new room was created
  io.emit('room-created', req.body.room)
})

app.get('/:room', (req, res) => {
  room = req.params.room
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }
  if(1 <= MAX){
    res.render('room', { roomName: req.params.room })
  }
  else {
    console.log("fail")
  }
})

server.listen(3000)

io.on('connection', socket => {
  socket.on('new-user', (room, name) => {
    var clients = io.sockets.adapter.rooms[room]
    if (clients == undefined) {
      console.log("in empty if")
      socket.join(room)
      rooms[room].users[socket.id] = name
      empty[room] = false
      socket.to(room).broadcast.emit('user-connected', name)
      console.log("Max is " + MAX)
      var clients = io.sockets.adapter.rooms[room]
      console.log("Number of users is " + clients.length)
    }
    else {
     // var clients = io.sockets.adapter.rooms[room]
      if(clients.length + 1 <= MAX) {
        console.log("people in room")
        socket.join(room)
        rooms[room].users[socket.id] = name
        socket.to(room).broadcast.emit('user-connected', name)
        console.log("Max is " + MAX)
        console.log("Number of users is " + clients.length)
      }
      else {
      console.log("fail io")
      }
    }
  })
  socket.on('send-chat-message', (room, message) => {
    socket.to(room).broadcast.emit('chat-message', { message: message, name: rooms[room].users[socket.id] })
  })
  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
    })
  })
})

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}