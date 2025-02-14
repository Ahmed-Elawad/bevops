const request = require('supertest');
const express = require('express');

jest.mock('passport', () => {
  const authenticate = jest.fn();
  return {
    authenticate: authenticate.mockImplementation((strategy, callback) => {
        return (req, res, next) => {
          if (strategy === 'salesforce') {
            res.redirect(302, 'https://salesforce-mock-login');
            return;
          } else if (strategy === 'local') {
            if (req.body.username === 'testuser' && req.body.password === 'password123') {
                const mockUser = { id: 'test-user-id', username: 'testuser' };
                req.login(mockUser, (err) => {
                  if (err) return next(err);
                  return callback(null, mockUser);
                });
                return;
            } else {
              return callback(null, false, { message: 'Invalid credentials' });
            }
          } else {
            return callback(null, false, { message: 'Authentication failed' });
          }
        };
      }
    ),
      initialize: () => (req, res, next) => next(),
      session: () => (req, res, next) => next(),
  };
});

const mockFindOrCreate = jest.fn();
jest.mock('../../server/models/User.js', () => ({
  findOrCreate: mockFindOrCreate,
}));

const authRoutes = require('../../server/routes/auth');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    req.is = (type) => {
      return type === 'application/json'; 
    };
    next();
  });

    app.use((req, res, next) => {
      req.login = (user, callback) => {
        if (callback) {
          callback(null);
        }
      };
      req.logout = (callback) => {
        if (callback) {
          callback(null);
        }
      };
      next();
    });

  const passport = require('passport');
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(authRoutes);

  app.use((err, req, res, next) => {
    console.error("Error in express app", err)
    res.status(500).json({ message: err.message });
  });

  return app;
}

describe('Auth Routes', () => {
  let app;
  let authenticateMock;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
    authenticateMock = require('passport').authenticate;
  });

    test('GET /login/salesforce should simulate a redirect', async () => {
      const response = await request(app).get('/login/salesforce');
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('https://salesforce-mock-login');
    });
  
    test('GET /login should return the login page', async () => {
      const response = await request(app).get('/login');
      expect(response.status).toBe(200);
      expect(response.type).toMatch(/html/);
    });
  
  test('POST /login should successfully log in a user', async () => {
    const response = await request(app).post('/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(200);
      expect(authenticateMock).toHaveBeenCalledWith('local', expect.any(Function));
  });

  test('POST /login with invalid credentials should fail', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'invaliduser', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(authenticateMock).toHaveBeenCalledWith('local', expect.any(Function));
  });

  test('GET /signup should return the signup page', async () => {
    const response = await request(app).get('/signup');
    expect(response.status).toBe(200);
    expect(response.type).toMatch(/html/);
  });

  test('POST /signup should register a new user and redirect', async () => {
    const mockUser = {
      id: 'new-user-id',
      username: 'newuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    mockFindOrCreate.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/signup')
      .send({
        username: 'newuser',
        password: 'password123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });

    expect(response.status).toBe(200);
    expect(mockFindOrCreate).toHaveBeenCalledTimes(1);
    expect(mockFindOrCreate).toHaveBeenCalledWith({
      username: 'newuser',
      password: 'password123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    });
  });

  test('POST /signup should reject if any fields are missing', async () => {
    const response = await request(app)
      .post('/signup')
      .send({ username: 'newuser', password: 'password123' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields' });
  });

  test('GET /logout should log out the user and redirect to the root path', async () => {
    const response = await request(app).get('/logout');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });
});