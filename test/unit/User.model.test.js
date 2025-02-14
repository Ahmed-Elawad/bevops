const bcrypt = require('bcrypt');
const User = require('../../server/models/User.js');

describe('User Model', () => {
  beforeEach(() => {
    if (typeof User._clear === 'function') {
      User._clear();
    }
  });

  test('should create a new user with a hashed password', async () => {
    const userData = {
      username: 'testuser',
      password: 'SecretPassword123!',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = await User.create(userData);
    expect(user).toHaveProperty('id');
    expect(user.username).toBe(userData.username);
    expect(user.email).toBe(userData.email);
    expect(user.firstName).toBe(userData.firstName);
    expect(user.lastName).toBe(userData.lastName);
    expect(user.passwordHash).not.toBe(userData.password);

    const isValid = await bcrypt.compare(userData.password, user.passwordHash);
    expect(isValid).toBe(true);
  });

  test('should not allow creating duplicate users', async () => {
    const userData = {
      username: 'duplicateuser',
      password: 'Password123!',
      email: 'dup@example.com',
      firstName: 'Dup',
      lastName: 'User'
    };

    await User.create(userData);
    await expect(User.create(userData)).rejects.toThrow('User already exists');
  });

  test('should verify the correct password', async () => {
    const userData = {
      username: 'verifyuser',
      password: 'MyPass123!',
      email: 'verify@example.com',
      firstName: 'Verify',
      lastName: 'User'
    };

    const user = await User.create(userData);
    const isCorrect = await user.verifyPassword(userData.password);
    expect(isCorrect).toBe(true);

    const isIncorrect = await user.verifyPassword('WrongPassword');
    expect(isIncorrect).toBe(false);
  });

  test('should find a user by username and by id', async () => {
    const userData = {
      username: 'finduser',
      password: 'FindPass!',
      email: 'find@example.com',
      firstName: 'Find',
      lastName: 'User'
    };

    const user = await User.create(userData);
    const foundByUsername = await User.findOne({ username: userData.username });
    expect(foundByUsername).toEqual(user);

    const foundById = await User.findById(user.id);
    expect(foundById).toEqual(user);
  });

  test('findOrCreate should return the existing user if found', async () => {
    const userData = {
      username: 'orcreateuser',
      password: 'OrCreatePass!',
      email: 'orcreate@example.com',
      firstName: 'OrCreate',
      lastName: 'User'
    };

    const user1 = await User.findOrCreate(userData);
    const user2 = await User.findOrCreate(userData);
    expect(user1).toEqual(user2);
  });

  test('getPublicProfile should not include sensitive information', async () => {
    const userData = {
      username: 'publicuser',
      password: 'PublicPass!',
      email: 'public@example.com',
      firstName: 'Public',
      lastName: 'User'
    };

    const user = await User.create(userData);
    const profile = user.getPublicProfile();
    expect(profile).toHaveProperty('id', user.id);
    expect(profile).toHaveProperty('username', userData.username);
    expect(profile).toHaveProperty('email', userData.email);
    expect(profile).toHaveProperty('firstName', userData.firstName);
    expect(profile).toHaveProperty('lastName', userData.lastName);
    expect(profile).not.toHaveProperty('passwordHash');
  });
});
