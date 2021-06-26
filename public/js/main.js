socket = io(); 
const contacts = [];
//const moment = require('moment');
// Get chat form
chatForm = document.getElementById('chat-form');

// Get username and room from URL
/*const { username, phone } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
}); */


chatContainer = document.querySelector('.chat-window');
/*unames = JSON.parse(localStorage.getItem("storedNames"));
const user = unames[0];*/
const username = localStorage.getItem("usrname");
const phone = localStorage.getItem("usrphone");



// Join room [Assume we get the room name from login]
//socket.emit('joinRoom', { username, phone });
socket.emit('userLogin', {username, phone});

// Socket connection
socket.on('bot-message', (message) => {
    console.log(message.time);

    // Set message from server to DOM
    setMessagetoDOM(message);

    chatContainer.scrollTop = chatContainer.scrollHeight;
})

/*socket.on('loginResponse',(valid) => {
        if(valid) {
            window.location.replace("chat.html");
        } else alert("please enter valid details");
    })*/

socket.on('message', (message) => {
    
    // Set message from server to DOM

            setMessagetoDOM(message);

            console.log(message.time);
    

    chatContainer.scrollTop = chatContainer.scrollHeight;
})

/*socket.on('loginResponse',(valid) => {
        if(valid) {
            window.location.replace("chat.html");
        } else alert("please enter valid details");
    })*/


socket.on('loadContacts',(fname, fphone) => {
console.log("inside loadContacts");

    const friend = {fname, fphone };
    contacts.push(friend);

    var container = document.getElementById("tab-1");

    var input = document.createElement("input");
                input.type = "button";
                input.name = fname;
                input.value = fname;
                container.appendChild(input);

                input.onclick = function() {
                  document.getElementById("chat-name").textContent = fname;
                  socket.emit('private-chat', username, fname);
                  document.querySelector('.chat-window').innerHTML = "";
                }
})

// Add event for submit
chatForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const txt = document.getElementById('msg').value;
    //const smg = document.getElementById('msg').value;
    const recepient = document.getElementById('chat-name').textContent;
    // Emit chat message to server got from user[send-button]
    console.log(recepient)
    //const u = getSID(np);
    //console.log("sending    "+a)
    /*var time = today.getHours() + ":" + today.getMinutes();
    const message = {from: username, to: recepient, msg: text, time: time};
    setMessagetoDOM(message);*/
    //const rec = contacts.find(friend => friend.name === recepient);
    socket.emit('chat-message', {txt, recepient})

    // Set submit to empty
    document.getElementById('msg').value = "";

})

function setMessagetoDOM(message)
{
    if(username == message.from) {
        const div = document.createElement('div');
        div.classList.add('sender');
        div.innerHTML = '<span class="sender-message-tail">'
        +message.from+'</span><span class="sender-message">'+message.chat+'</span>\
        <span class="message-time">'+message.time+'</span>';
        document.querySelector('.chat-window').appendChild(div);
    } else {
            const div = document.createElement('div');
            div.classList.add('receiver');
            div.innerHTML = '<span class="receiver-message-tail">'
            +message.from+'</span><span class="receiver-message">'+message.chat+'</span>\
            <span class="message-time">'+message.time+'</span>';
            document.querySelector('.chat-window').appendChild(div);
        } 
         
    }



    /*const unames = [];
    var id = null;

    //localStorage.clear();
        
    if(localStorage.getItem("storedNames") != null){
        unames = JSON.parse(localStorage.getItem("storedNames"));
        var n = unames.length;
        var i;
        for (i=0;i<n;i++) {
            const u = unames[i];
            if(u.phno  == phno || u.name == name) {
                alert('user already exists');
                return false;
            }
        }
        const user = {id, name, phno };
        unames.push(user);
        localStorage.setItem("storedNames",JSON.stringify(unames));
        return true;
    } else {
        const user = {id, name, phno };
        unames.push(user);
        localStorage.setItem("storedNames",JSON.stringify(unames));
        return true;
    }*/

/*function validateForm() {
    var name = document.getElementById('username').value;
    //var pass = document.getElementById('passwd').value;
    var phno = document.getElementById('phone').value;
    const users = [];
    //localStorage.clear();
    if(localStorage.getItem("storedNames") != null){
        users = JSON.parse(localStorage.getItem("storedNames"));
        var n = users.length;
        var i;
        for (i=0;i<n;i++) {
            const u = users[i];
            if(u.name == name && u.phno  == phno) {
                alert('login successfull!!');
                return true;
            }
        }
        alert('please enter valid details!!');
        return false;
    } else {
        alert('please signup!!');
        return false;
    }
}
*/
function addcontact() {
     
    var fname = document.getElementById("fname").value;
    var fphone = document.getElementById("fphone").value;

    console.log(fname, fphone);

    const friend = {fname, fphone};
    contacts.push(friend);

    socket.emit('addContact', {username, fname, fphone});

    var container = document.getElementById("tab-1");

    var input = document.createElement("input");
                input.type = "button";
                input.name = fname;
                input.value = fname;
                container.appendChild(input);

                input.onclick = function() {
                  document.getElementById("chat-name").textContent = fname;
                  socket.emit('private-chat', username, fname);
                  document.querySelector('.chat-window').innerHTML = "";
                }
}


function creategroup() {
    var groupname = document.getElementById("groupname").value;
    
    console.log(groupname);

    const group = {username, groupname};
    
    socket.emit('creategroup', {username, groupname});

    socket.on('group-created', (gID) => {
        document.getElementById("gid").value = gID;
        $("#grpID").show();
    })

    var container = document.getElementById("tab-2");

    var input = document.createElement("input");
                input.type = "submit";
                input.name = groupname;
                input.value = groupname;
                container.appendChild(input);

                input.onclick = function() {
                  document.getElementById("cwcn").textContent = groupname;
                  socket.emit('group-chat', username, groupname);
                  document.querySelector('.chat-window').innerHTML = "";
                }
}