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
const topics = {
     'Gun Control': {
      thumbnail: "https://www.nbc12.com/resizer/gTz6yLmYp-5Eyr7rlFCDQz4K6h0=/1200x0/arc-anglerfish-arc2-prod-raycom.s3.amazonaws.com/public/RSZP5LNGTBFB3CIWDH4RX4FOM4.jpg"
  }, 'Abortion': {
      thumbnail: 'https://www.pewresearch.org/wp-content/uploads/2019/06/FT_19.06.07_southernBaptists.jpg'
  }, 'Free Speech': {
      thumbnail: 'https://cdn.vox-cdn.com/thumbor/FYANSSjCDz5O4DXNLRXRq9OVsDM=/1400x1050/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/14257219/shutterstock_568689847.jpg'
  },
   'Immigration': {
    thumbnail: "https://cdn.givingcompass.org/wp-content/uploads/2019/04/10102748/New-Evidence-That-Immigration-Is-Good-for-America.jpg"
  }, 'Trade Policy': {
    thumbnail: 'https://s3.amazonaws.com/blog.v-comply.com/wp-content/uploads/2017/08/23165113/foreign-trade-policy.jpg'
  }, 'Black Lives Matter': {
    thumbnail: 'https://carrcenter.hks.harvard.edu/files/cchr/files/protest_01_03.png?m=1594152902'
  }, 'Religion': {
    thumbnail: "https://www.irishtimes.com/polopoly_fs/1.2930235.1483971415!/image/image.jpg_gen/derivatives/box_620_330/image.jpg"
  }, 'Iraq War': {
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/3/34/A_joint_special_forces_team_moves_together_out_of_an_Air_Force_CV-22_Osprey_aircraft%2C_Feb._26%2C_2018.jpg"
  }
}
const MAX = 2


app.get('/', (req, res) => {
  for(let topic in topics) {
    rooms[topic] = { users: {} }
    console.log(topic)
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