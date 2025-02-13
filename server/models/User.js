const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const users = [];

class User {
  constructor({ id, username, passwordHash, email, firstName, lastName }) {
    this.id = id;
    this.username = username;
    this.passwordHash = passwordHash;
    this.email = email;
    this.firstName = firstName || '';
    this.lastName = lastName || '';
  }

  static async create({ username, password, email, firstName, lastName }) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error('User already exists');
    }
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = new User({ id, username, passwordHash, email, firstName, lastName });
    users.push(newUser);
    return newUser;
  }

  static async findOne({ username }) {
    return users.find(u => u.username === username);
  }

  static async findById(id) {
    return users.find(u => u.id === id);
  }

  static async findOrCreate({ username, password, email, firstName, lastName }) {
    let user = await User.findOne({ username });
    if (!user) {
      user = await User.create({ username, password, email, firstName, lastName });
    }
    return user;
  }

  async verifyPassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }

  static async findByUsername(username) {
    return users.find(u => u.username === username);
  }

  getPublicProfile() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName
    };
  }
}

module.exports = User;
