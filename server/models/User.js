/*
In memory for mvp
*/
const users = [];

class User {
  constructor({ id, username, password, salesforceId, email }) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.salesforceId = salesforceId;
    this.email = email;
  }

  static async findOne({ username }) {
    return users.find(u => u.username === username);
  }

  static async findById(id) {
    return users.find(u => u.id === id);
  }

  static async findOrCreate(conditions, defaults) {
    let user = users.find(u => u.salesforceId === conditions.salesforceId);
    if (!user) {
      user = new User({ id: users.length + 1, ...defaults, salesforceId: conditions.salesforceId });
      users.push(user);
    }
    return user;
  }

  verifyPassword(password) {
    return this.password === password;
  }
}

module.exports = User;
