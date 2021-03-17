const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const express = require('express');


const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Format messages to object
const formatMessage = require('./utils/messages');

// Serve the front-end to user on connecttion
app.use(express.static(path.join(__dirname, 'public')));

botName = "chat-on";

// When user connects to 'socket'
io.on('connection', socket => {
    console.log("New client connected!")

    // When user joins new room. Here by default on landing on index.html
    socket.on('joinRoom', ( {username, room} ) => {


        // Dump here from DB all previous conversations

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // Send welcome message to all users on joining
        socket.emit('message', formatMessage(botName, "Welcome to chat app!"));

        socket.broadcast
        .to(user.room)
        .emit(
          'message',
          formatMessage(botName, `${user.username} has joined the chat`)
        );

    })

    // Listen for client-chat message
    socket.on('chat-message', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })

    // Notify every other user oon disconnection
    socket.on('disconnect', () => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(botName, user.username+' as left!'))
    })

});


const PORT = 3003 || process.env.PORT;

server.listen(PORT, () => console.log('Server listening on port ' +  PORT));
