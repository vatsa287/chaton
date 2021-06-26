const users = [];
const contacts = [];
const groups = [];

// Join user to chat
function userJoin(id, username, phone, publickey, pass_hash) {
  
  const user = { id, username, phone, publickey, pass_hash};
  
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

function getRecepient(phone) {
  console.log(phone)
  return users.find(user => user.phone === phone);
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