const users = [];

function addUser(id) {
  users.push(id);
  return users;
}

function getUsersInRoom() {
  return users;
}
