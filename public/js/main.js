const socket = io();
//var CryptoJS = require("crypto-js");

// Get chat form
chatForm = document.getElementById('chat-form');

// Get username and room from URL

// Method 1 [Causes issue of loosing data after refresh causing server to fail]
// const { username, room } = Qs.parse(location.search, {
//     ignoreQueryPrefix: true,
//   });

// Method 2 [Solves refresh issue, and can move back and forward in tabs without server-crash]
const queryString = window.location.search;
console.log(queryString);
const urlParams = new URLSearchParams(queryString);
const username = urlParams.get("username");
const room = urlParams.get("room");


chatContainer = document.querySelector('.chat-container');

// Join room [Assume we get the room name from login]
socket.emit('joinRoom', {username, room});

socket.emit('load-groups-to-sidebar-request', username);


// Socket connection

// This block gets encrypted message from server:client
// Decrypt the message before display
socket.on('bot-message', (message) => {
    console.log(message);

    // Set message from server:bot to DOM
    setMessagetoDOM(message.username, message.text, message.time);

    chatContainer.scrollTop = chatContainer.scrollHeight;
})

// This block gets encrypted message from server:client
// Decrypt the message before display
socket.on('client-message', (message) => {
    console.log(message);

    // Decrypt the message before sending to DOM
    const decrypted_bytes  = CryptoJS.AES.decrypt(message.text, 'secret key 123');
    const decrypted_message = decrypted_bytes.toString(CryptoJS.enc.Utf8);

    // Set message from server:client to DOM
    setMessagetoDOM(message.username, decrypted_message, message.time);

    chatContainer.scrollTop = chatContainer.scrollHeight;
})

// Add event for submit
chatForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Message from client in plain-text
    const msg = document.getElementById('msg').value;
    console.log("In plain text:" + msg);

    // Send encrypted message to server
    const cipher_msg = CryptoJS.AES.encrypt(msg, 'secret key 123').toString();
    console.log("Sent cipher_msg: " + cipher_msg);

    // Emit chat message to server got from user[send-button]
    socket.emit('chat-message', cipher_msg);

    // Set submit to empty
    document.getElementById('msg').value = "";

})

// When user clicks on different group
// Display the chats of that group and clear the existing chat
group.addEventListener('click', (event) => {
    event.preventDefault();

    const room = document.getElementById(event.target.id).value;
    console.log("In plain text:" + username + " " + room);
    // Use same var-name as in socket.on
    //socket.emit('joinRoom', {username, clicked_group_name});
    socket.emit('joinRoom', {username, room});

    //Clear existing chat
    document.querySelector('.chat-container').innerHTML = "";
})

socket.on('load-groups-to-sidebar-response', (group_name) => {
    console.log(group_name);

    // Set list-of-groups from server to Fill Sidebar DOM
    setGroupstoSidebarDOM(group_name);

})

function setMessagetoDOM(name, decrypted_message, time)
{
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p id="message">'+decrypted_message+'</p>\
    <p id="sender" style="font-size: xx-small;">'+name+'</p>\
    <p id="time" style="font-size: xx-small;">'+time+'</p>';
    document.querySelector('.chat-container').appendChild(div);
}

function setGroupstoSidebarDOM(group_name)
{
    const div = document.createElement('div');
    //div.classList.add('group');
    //div.innerHTML = '<li><p>'+group_name+'</p></li>';
    div.innerHTML = "<input type='button' id="+group_name+" value="+group_name+">";
    document.querySelector('.group-container').appendChild(div);
}
