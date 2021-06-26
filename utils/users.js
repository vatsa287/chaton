const users = [];
const contacts = [];
const groups = [];

// Join user to chat
function userJoin(id, username, phone) {
  
  const user = { id, username, phone };
  
  users.push(user);
  return user;
}

function addContact(username, fname, fphone) {
  const friend = {username, fname, fphone};

  contacts.push(friend);
  return friend;
}

// Get current user
function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function getRecepient(name) {
  console.log(name)
  return users.find(user => user.username === name);
}

// Get room users
function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getRecepient,
  addContact
};