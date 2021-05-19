const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const CryptoJS = require('crypto-js');

const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Import Function to Format messages to object
const formatMessage = require('./utils/messages');

// Serve the front-end to user on connecttion
app.use(express.static(path.join(__dirname, 'public')));

// Chat-bot name
botName = "chat-on";

// DB connection URL pwd="admin" db="database0"
const connection_url = "mongodb+srv://admin:admin@cluster0.5syhf.mongodb.net/database0?retryWrites=true&w=majority";

// // Connect to database
// mongoose.connect(connection_url, {
//     useNewUrlParser: true, useUnifiedTopology: true
// });

// var connection = mongoose.connection;

// connection.on("once", function() {
//      console.log("DB connected!")
// });

// connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Correct method

const MongoClient = require('mongodb').MongoClient;
//const uri = "mongodb+srv://admin:admin@cluster0.5syhf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(connection_url, { useNewUrlParser: true, useUnifiedTopology: true });

// client.connect(err => {

//     const collection = client.db("database0").collection("chats");

//     // perform actions on the collection object

//     console.log("Connected to the database", client.db);

//     client.close();
// });

async function deleteAllChatsInDB() {

    try {

        await client.connect();

        // Select the DB
        const database = client.db("database0");

        // collection = table
        const chats = database.collection("chats");

        // Delete all documents in 'chats'
        const result = await chats.remove( {} );

        console.log(
            "All documents of " + chats + " are deleted"
        );

    }

    finally {
        await client.close();
    }
}

// Call this function when delete chats is called
//deleteAllChatsInDB().catch(console.dir);


async function addChatsToDB(room, username, message, time) {

    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const chats = database.collection("chats");

        // Create a document to be inserted
        const document = {
            room: room,
            name: username,
            message: message,
            time: time
        };

        // Insert to DB
        const result = await chats.insertOne(document);

        console.log(
            `${result.insertedCount} chat was inserted with the _id: ${result.insertedId}`,
        );
    }
    finally{
        // Do nothing (for now)
    }
}

async function getChatsFromDB(room) {

    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const chats = database.collection("chats");

        const query = { room : room };

        const options = {
          projection: { _id: 0 }
        };

        // MongoDB returns cursor not a object for find op
        const cursor = chats.find(query, options);

        // Return 0 when query is empty
        if ((await cursor.count()) === 0) {
          console.log("No documents found!");
          return 0;
        }

        const arr = await cursor.toArray();

        const obj = {};

        // Array to object
        for(let i=0; i<arr.length; i++)
        {
            obj[i] = await arr[i];
        }

        //await console.log(obj[0].room);
        //console.log(cursor);

        return obj;

    }
    finally{
        // Do nothing here (for now)
    }
}
// getChatsFromDB("1").catch(console.dir);

async function getGroupsFromDB(username) {

    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const chats = database.collection("chats");

        const fieldName = "room";
        const query = { name : username };

        // MongoDB returns array for distinct op
        const list_of_groups = await chats.distinct("room", query);

        // Return 0 when query is empty
        if ( list_of_groups.length === 0) {
          console.log("No groups found for user: " + username + "!");
          return 0;
        }

        // Return array of groups for user: username
        return list_of_groups;

    }
    finally{
        // Do nothing here (for now)
    }
}


// When user connects to 'socket'
io.on('connection', async socket => {
    console.log("New client connected!")

    // When user joins new room. Here by default on landing on index.html.
    // Making this function async since we want to wait for previous chats
    // to be loaded from the database, without continuing further.
    socket.on('joinRoom', async ( {username, room} ) => {

        const user = userJoin(socket.id, username, room);
        console.log(socket.id, user.room, room, user.username, username);

        socket.join(user.room);

        // Dump here from DB all previous conversations.
        // Do this only when room is entered for 2> time.
        const obj = await getChatsFromDB(user.room).catch(console.dir);
        //console.log(Object.keys(obj).length);
        //console.log(obj[0].name);

        // Send welcome message to all users on joining
        await socket.emit('bot-message',
            formatMessage(botName, "Welcome to chat app!", moment().format('h:mm a')));

        // 0 when empty
        // console.log("obj value " + obj);
        // Check if room exists
        if(obj != 0) {
            // Send old messages from db in encrypted format
            for(var i=0; i<Object.keys(obj).length; i++) {
                socket.emit('client-message',
                    formatMessage(obj[i].name, obj[i].message, obj[i].time));
            }
            console.log("INFO: Message load complete!");
        }

        // Notify the room who has joined the chat
        socket.broadcast
        .to(user.room)
        .emit(
          'bot-message',
          formatMessage(botName, `${user.username} has joined the chat`, moment().format('h:mm a'))
        );

    })

    socket.on('load-groups-to-sidebar-request', async (user) => {

        // Get all groups of a user for sidebar
        const list_of_groups = await getGroupsFromDB(user).catch(console.dir);
        // Check if a user is in atleast one group
        if(list_of_groups.length) {
            // Send all group names of that user as an array
            for(var i=0; i<list_of_groups.length; i++) {
                socket.emit('load-groups-to-sidebar-response', list_of_groups[i]);
            }
            console.log("INFO: Groups load complete!");
        }
    })


    // Listen for client-chat message
    socket.on('chat-message', (encrypted_msg) => {
        const user = getCurrentUser(socket.id);

        // Call method to insert chat-message[ENCRYPTED] to DB
        addChatsToDB(user.room, user.username, encrypted_msg, moment().format('h:mm a')).catch(console.dir);

        // Emit the messages to room in encrypted format
        io.to(user.room).emit('client-message',
            formatMessage(user.username, encrypted_msg, moment().format('h:mm a')));

    })

    // Notify every other user on disconnection
    socket.on('disconnect', () => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message',
            formatMessage(botName, user.username+' as left!', moment().format('h:mm a')))
    })

});


const PORT = 3006 || process.env.PORT;

server.listen(PORT, () => console.log('Server listening on port ' +  PORT));
