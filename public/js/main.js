const socket = io();

//const room = "room1";

// Get chat form
chatForm = document.getElementById('chat-form');


// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
  });

console.log(username, room);

chatContainer = document.querySelector('.chat-container');

// Join room [Assume we get the room name from login]
socket.emit('joinRoom', {username, room});

// Socket connection
socket.on('message', (message) => {
    console.log(message);

    // Set message from server to DOM
    setMessagetoDOM(message);

    chatContainer.scrollTop = chatContainer.scrollHeight;
})

// Add event for submit
chatForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const msg = document.getElementById('msg').value;
    console.log(msg);

    // Emit chat message to server got from user[send-button]
    socket.emit('chat-message', msg);

    // Set submit to empty
    document.getElementById('msg').value = "";

})

function setMessagetoDOM(message)
{
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p id="message">'+message.text+'</p>\
    <p id="sender" style="font-size: xx-small;">'+message.username+'</p>\
    <p id="time" style="font-size: xx-small;">'+message.time+'</p>';
    document.querySelector('.chat-container').appendChild(div);
}