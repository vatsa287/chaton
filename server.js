
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const nodeRSA = require('node-rsa');
const {v4 : uuidv4} = require('uuid');

const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    getRecepient,
    addContact,
  } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

var bodyParser = require('body-parser');
//const router = express.Router();
var urlencodedParcer = bodyParser.urlencoded({extended: false});

app.use(express.json());

const connection_url = "mongodb+srv://admin:admin@cluster0.gdn9i.mongodb.net/database0?retryWrites=true&w=majority";
const MongoClient = require('mongodb').MongoClient;
const { Script } = require('vm');
const { urlencoded } = require('express');
const client = new MongoClient(connection_url, { useNewUrlParser: true, useUnifiedTopology: true });

 // Require static assets from public folder
 app.use(express.static(path.join(__dirname, 'public')));
 // Set view engine as EJS
 app.set('views', path.join(__dirname, 'public'));
 app.engine('html', require('ejs').renderFile);
 app.set('view engine', 'html');
 // Set 'views' directory for any views 
 // being rendered res.render()
 
 // Serve the front-end to user on connection
 app.use('/', express.static(__dirname + '/index.html'));

app.get('/index.html', function(req, res){
  res.render('form');// if jade
  // You should use one of line depending on type of frontend you are with
  //res.sendFile(__dirname + '/form.html'); //if html file is root directory
 res.sendFile("index.html"); //if html file is within public directory
});

var privateKey = 0;
var publicKey = 0;

app.post('/index.html', urlencodedParcer,async function (req, res) {
    var name = req.body.username; 
    var pass = req.body.password;
    var password_hash = CryptoJS.SHA3(pass).toString();
    console.log("Password Hash", password_hash);
    var phone = req.body.phone;
    var obj = 0;

    if(phone.length != 10 ) {
        res.send('<script>alert("Enter valid phone number");window.location.replace("/index.html");</script>');
    }
    else { 
    obj = await validate(name, password_hash, phone);
    console.log("login",obj, name, pass, phone);
 
    //if(obj === 123) res.redirect('/chat.html');
    if(obj === 456) { 
        res.send('<script>alert("Incorrect Username or Password !!");window.location.replace("/index.html");</script>');  
    } else if(obj == 0){ res.send('<script>alert("User not found please SignUP!!");window.location.replace("/index.html");</script>');
    } else { 
        res.render('chat.html',{data : obj, type: "login"});  
}
} 
  }); 

   app.post('/signup.html', urlencodedParcer,async function (req, res) {
    var name = req.body.username; 
    var pass = req.body.password;
    var password_hash = CryptoJS.SHA3(pass).toString();
    var phone = req.body.phone;
    var obj = 0;

    // if(phone.length != 10 ) {
    //     res.send('<script>alert("Enter valid phone number");window.location.replace("/index.html");</script>');
    // }
    // else { 
    //const key = generateKeypair();
    obj = await addUser(name, password_hash, phone);
    // obj = { username: name,
    //     password: pass,
    //     phone: phone,
    //      };
    console.log("signup",obj, name, password_hash, phone);
    
        if(obj === 111) res.send('<script>alert("User already exists!!");window.location.replace("/index.html");</script>');
        else { 
            // privateKey = key.privateKey;
            // console.log(privateKey)
            //socket.emit('private-key', privateKey)
            res.render('chat.html',{data : obj, type: "signup"});
            
            }  
        //}       
   }); 

// Format messages to object
function formatGroupMsg(username, resid, text, time) {
  return {
    from: username,
    to: resid,
    msg: text,
    time: time
  };
}

function formatPrivateMsg(username, fname, recid, text, time) {
  return {
    from: username,
    to: fname,
    fphone: recid,
    chat: text,
    time: time
  };
}

//validate user credentials on login
async function validate(name, pass, phone) {
    console.log("inside validate");
    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const users = database.collection("users");

        const query = { username : name,
                        password : pass,
                        phone : phone }
        
        if(await users.countDocuments(query)) return users.findOne(query); 
        else { if(await users.findOne({ phone: phone})) return 456;
                else return 0;
            }
}
    finally {
        //do nothing for now
    }
}

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
        //do nothing for now
    }
}

//deleteAllChatsInDB() ;

async function addUser(name, pass, phone){
    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const users = database.collection("users");

        // Create a document to be inserted
        const document = { username: name,
                           password: pass,
                           phone: phone,
                            };

        if(await users.countDocuments({ phone: phone})) return 111;
        else {
        // Insert to DB
        const result = await users.insertOne(document);

        return document;
        console.log(
            `${result.insertedCount} user was inserted with the _id: ${result.insertedId}`,
        );
        }
    }
    finally{
        //do nothing for now
    }

}

async function addUserToGroup(username, gid){
    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const groups = database.collection("groups");
        
        const grp = await groups.findOne({groupID: gid}, {sort:{$natural:-1}});
        console.log(grp.rec_count);
        const query = { $or: [{ admin: username }, { recepient: username }],
                           groupID: gid };

        if(await groups.countDocuments(query)) return 111;
        else if(grp.rec_count <= 4) {
        // Create a document to be inserted
        // Insert to DB
        const document = { recepient: username,
                            group: grp.group,
                            groupID: gid,
                            rec_count: grp.rec_count + 1}
        const result = await groups.insertOne(document);

        console.log(username , 'joined the group', grp.group);
        return document;
        } else return 0;
   
    }
    finally{
        //do nothing for now
    }

}

async function addPublickeyToDB(username, phone, publickey) {
    try {
    await client.connect();

        const database = client.db("database0");

        // collection = table
        const users = database.collection("users");

        // Create a document to be inserted
        var myquery = { phone: phone };
        var newvalues = { $set: {publickey: publickey} };
        await users.updateOne(myquery, newvalues);

        return username;
        }
    finally {
        //do nothing for now
    }
}

async function addChatsToDB(username, fname, recid, message, time) {

    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const chats = database.collection("chats");

        // Create a document to be inserted
        const document = {
            from: username,
            to: fname,
            fphone:recid,
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
        //do nothing for now
    }
}

async function addGroupChatsToDB(username, gID, message, time) {

    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const groupchats = database.collection("groupchats");

        // Create a document to be inserted
        const document = {
            from: username,
            groupID: gID ,
            message: message,
            time: time
        };

        // Insert to DB
        const result = await groupchats.insertOne(document);

        console.log(
            `${result.insertedCount} chat was inserted with the _id: ${result.insertedId}`,
        );
    }
    finally{
        //do nothing for now
    }
}

async function addContactToDB(user, fname, fphone){
    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const friends = database.collection("friends");
        
        // Create a document to be inserted
        
        const document = {
            user: user,
            friend: fname,
            fphone: fphone
        };

        if(await friends.countDocuments(document)) {
            return 11;
        } else {
        // Insert to DB
        const result = await friends.insertOne(document);

        console.log(
            `${result.insertedCount} contact was inserted with the _id: ${result.insertedId}`,
        );

        return document;
        }
    }
    finally{
        //do nothing for now
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
            groupID: GID,
            rec_count: 1
        };

        // Insert to DB
        const result = await groups.insertOne(document);

        console.log(
            `${result.insertedCount} Group was inserted with the _id: ${result.insertedId}`,
        );
        return GID;
    }
    finally{
        //do nothing for now
    }
    
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
        //do nothing for now
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
        const cursor = await chats.find(query, options);

        // Return 0 when query is empty
        if ((cursor.count()) === 0) {
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
        //do nothing for now
    }
}

async function getGroupFromDB(username) {

    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const groups = database.collection("groups");

        const query = { $or: [{ admin: username }, { recepient: username }] };

        const options = {
          projection: { _id: 0 }
        };

        // MongoDB returns cursor not a object for find op
        const cursor = groups.find(query, options);

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
        //await client.close();
    }
}

async function getGroupChatsFromDB(gid) {

    try {

        await client.connect();

        const database = client.db("database0");

        // collection = table
        const groupchats = database.collection("groupchats");

        const query = { groupID: gid };

        const options = {
          projection: { _id: 0 }
        };

        // MongoDB returns cursor not a object for find op
        const cursor = await groupchats.find(query, options);

        // Return 0 when query is empty
        if ((cursor.count()) === 0) {
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

        return obj;
    }
    finally{
        //do nothing for now
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
        
        console.log(user.phone, user.id);
       
        /*socket.emit('message',
            formatMessage(botName, "Welcome to chat app!"));

        socket.broadcast.to(user.room).emit('message',
          formatMessage(botName, `${user.username} has joined the chat`)
        ); */

    })

    socket.on('signup',async ({username, phone, publickey}) => {
        const obj = await addPublickeyToDB(username, phone, publickey);
        const user = userJoin(socket.id, username, phone, publickey);
        console.log("public key", publickey)
        console.log("public key added to", obj)
    })

    //user Login
    socket.on('userLogin', async ({username, phone, publickey}) => {
        console.log("New client connected!")

        const user = userJoin(socket.id, username, phone, publickey);
        const id = socket.id;
        console.log(id, username, phone, user.username, user.phone)

        const obj = await getContactsFromDB(username).catch(console.dir);
        if(obj != 0) {
        
            for(var i=0; i<Object.keys(obj).length; i++) {
                socket.emit('loadContacts',obj[i].friend, obj[i].fphone);
            }
            console.log(Object.keys(obj).length,"INFO: Contacts load complete!");
        }

        const grps = await getGroupFromDB(username).catch(console.dir);
        if(grps != 0) {
        
            for(var i=0; i<Object.keys(grps).length; i++) {
                socket.emit('loadGroups',grps[i].group, grps[i].groupID);
                socket.join(grps[i].groupID)
            }
            console.log(Object.keys(obj).length,"INFO: groups load complete!");
        }
    })

    //return public key to user
    socket.on('get-publickey',(recid) => {
        console.log('server',recid)
        const rec = getRecepient(recid);
        console.log('server',rec.phone,rec.username)
        var pkey = rec.publickey;
        console.log("server pub key",pkey)
        socket.emit('return-publickey',pkey)

    })

    // Add new contact to DB
    socket.on('addContact', async ({fname, fphone,}) => {
        const user = getCurrentUser(socket.id);
        const friend = addContact(user.username, fname, fphone);
        const res = await addContactToDB(user.username, fname, fphone);
        socket.emit('add-contact-res', res)
        console.log(user.username, fname, fphone)

    })

    // create group
    socket.on('creategroup', async ({username, groupname}) => {
        //const group = creategroup(username, groupname);
        const gid = await addGroupToDB(username, groupname);
        socket.join(gid)
        socket.emit('group-created', gid)
    })

    //Join group
    socket.on('joingroup',async ({username, gid}) => {
        var res = await addUserToGroup(username, gid);

        if(res != 111 && res) {
            socket.join(gid)
            socket.emit('group-joined',res)
        } else socket.emit('group-joined',res)
        
    })

    // Listen for client-chat message
    socket.on('private-chat', async ({encrypted, recepient, recid}) => {
        console.log("sent name ",recepient)

        const user = getCurrentUser(socket.id);

        io.to(socket.id).emit('message',
            formatPrivateMsg(user.username, recepient, recid, encrypted, moment().format('h:mm a')));

        const rec = getRecepient(recid);
        if(rec.id != null) {
        io.to(rec.id).emit('message',
            formatPrivateMsg(user.username, recepient, recid, encrypted, moment().format('h:mm a')));
        }
        await addChatsToDB(user.username, recepient, recid, encrypted, moment().format('h:mm a')).catch(console.dir);  
    })

    //group chat message
    socket.on('group-chat', async ({txt, recepient, recid}) => {
    
        const user = getCurrentUser(socket.id);

        io.to(recid).emit('group-message',
            formatGroupMsg(user.username, recid, txt, moment().format('h:mm a')));

        const cipher_msg = CryptoJS.AES.encrypt(txt, recid).toString();
    
        // Add messages to DB in encrypted format
        await addGroupChatsToDB(user.username, recid, cipher_msg, moment().format('h:mm a')).catch(console.dir);
    
    })

    // Display previous messages from DB
    socket.on('display-chat', async (username, fname) => {
        
        const obj = await getChatsFromDB(username, fname).catch(console.dir);

        if(obj != 0) {
            // Send old messages from db in encrypted format
            for(var i=0; i<Object.keys(obj).length; i++) {
                socket.emit('message',
                    formatPrivateMsg(obj[i].from, obj[i].to, obj[i].fphone, obj[i].message, obj[i].time));
                
            }
            console.log("INFO: Message load complete!");
        }

    })

    // Display all old chats from DB to DOM
    socket.on('display-group-chat', async (gid) => {
        
        const obj = await getGroupChatsFromDB(gid).catch(console.dir);

        if(obj != 0) {
            // Send old messages from db in encrypted format
            for(var i=0; i<Object.keys(obj).length; i++) {

                const decrypted_bytes  = CryptoJS.AES.decrypt(obj[i].message, obj[i].groupID);
                const decrypted_message = decrypted_bytes.toString(CryptoJS.enc.Utf8);
                socket.emit('group-message',
                    formatGroupMsg(obj[i].from, obj[i].groupID, decrypted_message, obj[i].time));
                
            }
            console.log("INFO: Message load complete!");
        }

    })

    //user on disconnection
    socket.on('disconnect', () => {
        const user = getCurrentUser(socket.id);
        userLeave(socket.id);
        if(user != null) console.log(user.username ,"has left!!")
    })

});

const PORT = 3003 || process.env.PORT;

server.listen(PORT, () => console.log('Server listening on port ' +  PORT));