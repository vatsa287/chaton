const nodeRSA = require('node-rsa');
socket = io(); 
const contacts = [];
const groups = [];

const soc_id = socket.id;
socket.emit('test', soc_id)

//const moment = require('moment');
// Get chat form
chatForm = document.getElementById('chat-form');

chatContainer = document.querySelector('.chat-window');

const username = document.getElementById('chat-usr').textContent;
const phone = document.getElementById('chat-ph').textContent;
const type = document.getElementById('ty').textContent;


if(type == signup) {
 const key = new nodeRSA({b:1024});
let publickey  = key.exportKey('public');
let privatekey = key.exportKey('private');
console.log(publickey);
console.log(privatekey);

let public_key = new nodeRSA(publickey);
let private_key = new nodeRSA(privatekey);

socket.emit('signup',{phone, public_key})
}
socket.emit('userLogin', {username, phone});

function validateSignup() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const phone = document.getElementById("phone").value;
  
    socket.emit('signup',{username, password, phone})
    
    console.log(username, phone, password);
  }

  socket.on('signup-success', (id) =>{
      console.log(id)
      window.location.replace("/chat.html");
  })

// Join room [Assume we get the room name from login]
//socket.emit('joinRoom', { username, phone });

// Socket connection
socket.on('bot-message', (message) => {
    console.log(message.time);

    // Set message from server to DOM
    setMessagetoDOM(message);

    chatContainer.scrollTop = chatContainer.scrollHeight;
})



socket.on('private-key', (privateKey) => {
    console.log(privateKey)
    var Data = 
    {
        "username": username,
        "privatekey": privateKey,
        "phone": phone
    }
    localStorage.setItem(phone, JSON.stringify(Data));
})

socket.on('message', (message) => {
    
    // Set message from server to DOM

            setMessagetoDOM(message);

            //console.log(message.time);
    

    chatContainer.scrollTop = chatContainer.scrollHeight;
})

socket.on('group-message', (message) => {
    
    // Set message from server to DOM

            setGroupMsgtoDOM(message);

            console.log(message.time);
    

    chatContainer.scrollTop = chatContainer.scrollHeight;
})

socket.on('loadContacts',(fname, fphone) => {
console.log("inside loadContacts");

    const friend = {fname, fphone };
    contacts.push(friend);

    var container = document.getElementById("tab-1");

    // var div = document.createElement("div");
    //             div.classList.add('chat');
    //             div.innerHTML = '<div class="chat-right">\
    //               <div class="chat-right-top">\
    //                 <span class="contact-name">'+fname+'</span></div>\
    //               <div class="chat-right-bottom">\
    //                 <div class="chat-right-bottom-right">\
    //                 <span class="unread-messages" id='+fname+'></span>\
    //                 </div></div></div>';
    //             container.appendChild(div);

    var input = document.createElement("input");
                input.type = "button";
                input.name = fname;
                input.id = fname;
                input.value = fname;
                container.appendChild(input);

                input.onclick = function() {
                 // document.getElementById(message.from).value = fname;
                  document.getElementById("chat-name").textContent = fname;
                  document.getElementById("chat-id").textContent = fphone;
                  socket.emit('display-chat', username, fname);
                  document.querySelector('.chat-window').innerHTML = "";
                }
})


socket.on('loadGroups',(Group, GroupID) => {
    console.log("inside loadGroups");
    
        const group = {username, Group, GroupID };
        groups.push(group);
    
        var container = document.getElementById("tab-2");
    
        // var div = document.createElement("div");
        //             div.classList.add('chat');
        //             div.innerHTML = '<div class="chat-right">\
        //               <div class="chat-right-top">\
        //                 <span class="contact-name">'+group+'</span></div>\
        //               <div class="chat-right-bottom">\
        //                 <div class="chat-right-bottom-right">\
        //                 <span class="unread-messages" id='+GroupID+'></span>\
        //                 </div></div></div>';
        //             container.appendChild(div);

         var input = document.createElement("input");
                input.type = "submit";
                input.name = Group;
                input.value = Group;
                container.appendChild(input);
    
                    input.onclick = function() {
                      document.getElementById("chat-name").textContent = Group;
                      document.getElementById("chat-id").textContent = GroupID;
                      socket.emit('display-group-chat', GroupID);
                      document.querySelector('.chat-window').innerHTML = "";
                    }
    })

// Add event for submit
chatForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const txt = document.getElementById('msg').value;
    //const smg = document.getElementById('msg').value;
    const recepient = document.getElementById('chat-name').textContent;
    const recid = document.getElementById('chat-id').textContent;
    // Emit chat message to server got from user[send-button]
    console.log('recepient',recepient, recid)


    if( recid.length > 10) {
        socket.emit('group-chat',{txt, recepient, recid})
    } else {
    
        var privateKey = 0;
        var public_Key = 0
        //privateKey = localStorage.getItem("privatekey").privateKey;
        console.log('recepient', recid)
        socket.emit('get-publickey', recid)
        socket.on('return-publickey',(pkey) => {
        public_Key = pkey;
        console.log("Public key ", pkey)
        })

        const encrypt_txt = encrypt(txt, public_Key);


    socket.emit('private-chat', {txt, recepient, recid})
    }
    // Set submit to empty
    document.getElementById('msg').value = "";

})

function setMessagetoDOM(message)
{
    const recepient = document.getElementById('chat-name').textContent;
    if(username == message.from) {
        const div = document.createElement('div');
        div.classList.add('sender');
        div.innerHTML = '<span class="sender-message-tail">'
        +message.from+'</span><span class="sender-message">'+message.chat+'</span>\
        <span class="message-time">'+message.time+'</span>';
        document.querySelector('.chat-window').appendChild(div);
    } else if(message.to == username && message.from == recepient){
            const div = document.createElement('div');
            div.classList.add('receiver');
            div.innerHTML = '<span class="receiver-message-tail">'
            +message.from+'</span><span class="receiver-message">'+message.chat+'</span>\
            <span class="message-time">'+message.time+'</span>';
            document.querySelector('.chat-window').appendChild(div);
        } else {
             //Do nothing for now
             document.getElementById(message.from).value = message.from+"    *";
        }
         
    }

    function setGroupMsgtoDOM(message)
    {
        const grp = document.getElementById('chat-id').textContent;
        if(username === message.from) {
            const div = document.createElement('div');
            div.classList.add('sender');
            div.innerHTML = '<span class="sender-message-tail">'
            +message.from+'</span><span class="sender-message">'+message.chat+'</span>\
            <span class="message-time">'+message.time+'</span>';
            document.querySelector('.chat-window').appendChild(div);
        } else  {
                const div = document.createElement('div');
                div.classList.add('receiver');
                div.innerHTML = '<span class="receiver-message-tail">'
                +message.from+'</span><span class="receiver-message">'+message.chat+'</span>\
                <span class="message-time">'+message.time+'</span>';
                document.querySelector('.chat-window').appendChild(div);
            // } else {
            //     //Do nothing for now
            // }
            }
             
        }
    


async function addcontact() {
     
    const fname = document.getElementById("fname").value;
    const fphone = document.getElementById("fphone").value;

    console.log(username,fname, fphone);

    const friend = {fname, fphone, username};
    contacts.push(friend);

    socket.emit('addContact', {fname, fphone, username});

    var container = document.getElementById("tab-1");

    var input = document.createElement("input");
                input.type = "button";
                input.id = fname;
                input.name = fname;
                input.value = fname;
                container.appendChild(input);

    // var div = document.createElement("div");
    //             div.classList.add('chat');
    //             div.innerHTML = '<div class="chat-right">\
    //               <div class="chat-right-top">\
    //                 <span class="contact-name">'+fname+'</span></div>\
    //               <div class="chat-right-bottom">\
    //                 <div class="chat-right-bottom-right">\
    //                   <span class="unread-messages" id='+fname+'></span>\
    //                 </div></div></div>';
    //             container.appendChild(div);

                input.onclick = function() {
                  document.getElementById("chat-name").textContent = fname;
                  document.getElementById("chat-id").textContent = fphone;
                  socket.emit('display-chat', username, fname);
                  document.querySelector('.chat-window').innerHTML = "";

                }
}


function creategroup() {
    var groupname = document.getElementById("groupname").value;
    
    console.log(groupname);

    const group = {username, groupname};
    groups.push(group);

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


    // var div = document.createElement("div");
    //                 div.classList.add('chat');
    //                 div.innerHTML = '<div class="chat-right">\
    //                   <div class="chat-right-top">\
    //                     <span class="contact-name">'+groupname+'</span></div>\
    //                   <div class="chat-right-bottom">\
    //                     <div class="chat-right-bottom-right">\
    //                     <span class="unread-messages"></span>\
    //                     </div></div></div>';
    //                 container.appendChild(div);

     var input = document.createElement("input");
                input.type = "submit";
                input.name = groupname;
                input.value = groupname;
                container.appendChild(input);             
    
                input.onclick = function() {
                    document.getElementById("chat-name").textContent = groupname;
                    document.getElementById("chat-id").textContent = gID;
                    socket.emit('display-group-chat', gID);
                    document.querySelector('.chat-window').innerHTML = "";
                  }
    
}



function joingroup() {
    //const groupname = document.getElementById("joingrpname").value;
    const groupID = document.getElementById("joingrpId").value;
    console.log(groupID);

    //const group = {username, groupname};
    
    socket.emit('joingroup', {username,groupID});

    socket.on('group-joined',(res) => {
        if(res != 111 && res) {
            var container = document.getElementById("tab-2");

            // var div = document.createElement("div");
            // div.classList.add('chat');
            // div.innerHTML = '<div class="chat-right">\
            //   <div class="chat-right-top">\
            //     <span class="contact-name">'+groupname+'</span></div>\
            //   <div class="chat-right-bottom">\
            //     <div class="chat-right-bottom-right">\
            //     <span class="unread-messages"></span>\
            //     </div></div></div>';
            // container.appendChild(div);

             var input = document.createElement("input");
                input.type = "submit";
                input.name = groupname;
                input.value = groupname;
                container.appendChild(input);

                input.onclick = function() {
                  document.getElementById("chat-name").textContent = groupname;
                  document.getElementById("chat-id").textContent = groupID;
                  socket.emit('display-group-chat', GroupID);
                  document.querySelector('.chat-window').innerHTML = "";
                }
        } else if(res === 111) alert('you are already in the group!!');
        else alert('group limit reached!!');
    })
}

/** Encrypt the provided string with the destination public key */
function encrypt (content, public_Key) {
  //crypt.setKey(public_Key);
  //console.log(crypt.encrypt(content.toString()));
  
var encrypt = new JSEncrypt();
encrypt.setPublicKey(public_Key)
var encrypted = encrypt.encrypt("Hello World",'utf8')

console.log(encrypted)
//return crypt.encrypt(content.toString());
return encrypted;
}

/** Decrypt the provided string with the local private key */
function decrypt (content) {
  crypt.setKey(privateKey)
  return crypt.decrypt(content)
}