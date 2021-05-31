const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const {v4 : uuidv4} = require('uuid');

const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    getRecepient,
    addContact
  } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

var bodyParser = require('body-parser');
const router = express.Router();

app.use(bodyParser.urlencoded({ extended: false }));

const connection_url = "mongodb+srv://admin:admin@cluster0.gdn9i.mongodb.net/database0?retryWrites=true&w=majority";
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(connection_url, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/index.html', function(req, res){
  res.render('form');// if jade
  // You should use one of line depending on type of frontend you are with
  //res.sendFile(__dirname + '/form.html'); //if html file is root directory
 res.sendFile("index.html"); //if html file is within public directory
});

app.post('/', function (req, res) {
    var name = req.body.username; 
    var pass = req.body.pass;
    var phone = req.body.phone;
    var obj = false;
    //obj = validate(name, pass, phone);
    console.log("post",name, pass, phone)

    //res.redirect('/chat.html');

    //res.send(name + ' Submitted Successfully!');
   }); 


// Format messages to object
function formatMessage(username, text) {
  return {
    name: username,
    msg: text,
    time: moment().format('h:mm a')
  };
}

function formatPrivateMsg(username, fname, text) {
  return {
    from: username,
    to: fname,
    chat: text,
    time: moment().format('h:mm a')
  };
}

// Serve the front-end to user on connection
app.use(express.static(path.join(__dirname, 'public')));


async function addChatsToDB(username, fname, message, time) {

    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const chats = database.collection("chats");

        // Create a document to be inserted
        const document = {
            from: username,
            to: fname,
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
        //await client.close();
    }
}

async function addContactToDB(uname, fname, fphone){
    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const friends = database.collection("friends");

        // Create a document to be inserted
        const document = {
            user: uname,
            friend: fname,
            fphone: fphone
        };

        // Insert to DB
        const result = await friends.insertOne(document);

        console.log(
            `${result.insertedCount} contact was inserted with the _id: ${result.insertedId}`,
        );
    }
    finally{
        // Do nothing (for now)
        //await client.close();
    }

}

async function addGroupToDB(username, groupname){

    const GID = uuidv4();
    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const groups = database.collection("groups");
        
        // Create a document to be inserted
        const document = {
            admin: username,
            group: groupname,
            groupID: GID
        };

        // Insert to DB
        const result = await groups.insertOne(document);

        console.log(
            `${result.insertedCount} Group was inserted with the _id: ${result.insertedId}`,
        );
    }
    finally{
        // Do nothing (for now)
        //await client.close();
    }
    return GID;
}

async function getContactsFromDB(uname) {

    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const friends = database.collection("friends");

        const query = { user : uname };

        const options = {
          projection: { _id: 0 }
        };

        // MongoDB returns cursor not a object for find op
        const cursor = friends.find(query, options);

        // Return 0 when query is empty
        if ((await cursor.count()) === 0) {
          console.log("No documents found!")
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

        return obj;

    }
    finally{
        // Do nothing here (for now)
 }       
}


async function getChatsFromDB(username, fname) {

    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const chats = database.collection("chats");

        const query = { from: { $in: [ username, fname ]},
            to: { $in: [ username, fname ]} };

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
        //await client.close();
    }
}

const botName = "chaton";

// When user connects to 'socket'
io.on('connection', socket => {
    //console.log("New client connected!")
    // When user joins new room. Here by default on landing on index.html.
    // Making this function async since we want to wait for previous chats
    // to be loaded from the database, without continuing further.
    socket.on('joinRoom', ( {username, room} ) => {
        const user = userJoin(socket.id, username, phone);
        const id = socket.id;
        //socket.join(user.phone);
        //socket.emit('store', user);
        console.log(user.phone, user.id);
        //socket.emit('message', formatMessage(user.phone, user.id));

        /*socket.emit('message',
            formatMessage(botName, "Welcome to chat app!"));

        socket.broadcast.to(user.room).emit('message',
          formatMessage(botName, `${user.username} has joined the chat`)
        ); */

    })

    //user Login
    socket.on('userLogin', async ({username, phone}) => {
        console.log("New client connected!")

        const user = userJoin(socket.id, username, phone);
        const id = socket.id;
        console.log(id, username, phone, user.username, user.phone)

        /*socket.emit('message',
            formatMessage(botName, "Welcome to chat app!"));*/

        const obj = await getContactsFromDB(username).catch(console.dir);

        socket.emit('loginResponse', true);

        if(obj != 0) {
            // Send old messages from db in encrypted format
            for(var i=0; i<Object.keys(obj).length; i++) {
                socket.emit('loadContacts',obj[i].friend, obj[i].fphone);
            }
            console.log(Object.keys(obj).length,"INFO: Contacts load complete!");
        }



    })

    // Add new contact 
    socket.on('addContact', async ({uname, fname, fphone}) => {
        const friend = addContact(uname, fname, fphone);
        await addContactToDB(uname, fname, fphone);
        console.log(uname, fname, fphone)

    })

    // create group
    socket.on('creategroup', async ({username, groupname}) => {
        //const group = creategroup(username, groupname);
        const gid = await addGroupToDB(username, groupname);

        socket.emit('group-created', gid);
    })

    // Listen for client-chat message
    socket.on('chat-message', async ({txt, recepient}) => {
        console.log("sent name ",recepient)

        const user = getCurrentUser(socket.id);
        const rec = getRecepient(recepient);

        io.to(socket.id).emit('message',
            formatPrivateMsg(user.username, recepient, txt));

        io.to(rec.id).emit('message',
            formatPrivateMsg(user.username, recepient, txt));

        await addChatsToDB(user.username, recepient, txt, moment().format('h:mm a')).catch(console.dir);
    
        // Emit the messages to room in encrypted format
        console.log(txt)
        

    })

    socket.on('private-chat', async (username, fname) => {
        
        const obj = await getChatsFromDB(username, fname).catch(console.dir);

        if(obj != 0) {
            // Send old messages from db in encrypted format
            for(var i=0; i<Object.keys(obj).length; i++) {
                socket.emit('message',
                    formatPrivateMsg(obj[i].from, obj[i].to, obj[i].message, obj[i].time));
            }
            console.log("INFO: Message load complete!");
        }

    })
    // Notify every other user on disconnection

    socket.on('disconnect', () => {
        const user = getCurrentUser(socket.id);
        userLeave(socket.id);
        console.log(user.username ,"has left!!")
    })

});


const PORT = 3003 || process.env.PORT;

server.listen(PORT, () => console.log('Server listening on port ' +  PORT));