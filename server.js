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
const MAX = 2


app.get('/', (req, res) => {
  for(let topic in topics) {
    rooms[topic] = { users: {} }
  }
  res.render('index', { rooms: topics })
})

app.get('/:room', (req, res) => {
  room = req.params.room
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }
  var clients = io.sockets.adapter.rooms[room]
  if (clients == undefined) {
    res.render('room', { roomName: req.params.room })
  }
  else {
    console.log("passing1")
    if(clients.length + 1 <= MAX) {
      res.render('room', { roomName: req.params.room })
    }
    else {
      console.log("passing2")
      room_num = room
      clients = io.sockets.adapter.rooms[room]
      if (clients.length + 1 > MAX) {
        console.log("passing3")
        room_num = room_num + io.engine.clientsCount
        clients = io.sockets.adapter.rooms[room_num]
        if (clients == undefined) {
          rooms[room_num] = { users: {} } 
          console.log("passing4")
          // res.render('room', { roomName: room_num })
          res.redirect(room_num)
        }
        else {
          rooms[room_num] = { users: {} } 
          //res.render('room', { roomName: room_num })
          console.log("passing4")
          res.redirect(room_num)
        }
      }
    }
  }
/*
  var clients = io.sockets.adapter.rooms[room]
  if(clients != undefined) {
    console.log("Http " + clients.length)
  }
  if(1 <= MAX) {
    res.render('room', { roomName: req.params.room })
  }
  else {
    console.log("fail")
  }
  */
})

server.listen(3000)

io.on('connection', socket => {
  socket.on('new-user', (room, name) => {
    var clients = io.sockets.adapter.rooms[room]
    if (clients == undefined) {
      console.log("in empty if")
      socket.join(room)
      rooms[room].users[socket.id] = name
      socket.to(room).broadcast.emit('user-connected', name)
      console.log("Max is " + MAX)
      var clients = io.sockets.adapter.rooms[room]
      console.log("Number of users is " + clients.length)
    }
    else {
      if(clients.length + 1 <= MAX) {
        console.log("people in room")
        socket.join(room)
        rooms[room].users[socket.id] = name
        socket.to(room).broadcast.emit('user-connected', name)
        console.log("Max is " + MAX)
        console.log("Number of users is " + clients.length)
      }
      else {
        console.log("failing3")
        room_num = room
        clients = io.sockets.adapter.rooms[room]
        while (clients.length + 1 > MAX) {
          console.log("io while")
          room_num = room_num + io.engine.clientsCount
          clients = io.sockets.adapter.rooms[room_num]
          if (client == undefined)
            break;
        }
        if (clients == undefined) {
          console.log("failing2")
          rooms[room_num] = { users: {} } 
          socket.join(room_num)
          rooms[room_num].users[socket.id] = name
          socket.to(room_num).broadcast.emit('user-connected', name)
        }
        else {
         console.log("failing")
        socket.join(room_num)
        rooms[room_num].users[socket.id] = name
        socket.to(room_num).broadcast.emit('user-connected', name)
        }

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