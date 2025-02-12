const request = require('supertest');
const express = require('express');
const passport = require('passport');

jest.mock('passport', () => ({
    authenticate: jest.fn((strategy, options) => {
      if (strategy === 'salesforce') {
        return (req, res, next) => res.redirect('/dummy-salesforce');
      }
      // For other strategies, simply call next() or simulate a success
      return (req, res, next) => next();
    }),
    initialize: jest.fn(),
    session: jest.fn(),
  }));

const authRoutes = require('../../server/routes/auth');

function createTestApp() {
    const app = express();
    app.use(express.json());
  
    // Provide dummy implementations for req.login and req.logout.
    app.use((req, res, next) => {
      req.login = (user, callback) => callback();
      req.logout = (callback) => callback();
      req.user = { userId: 1 };
      next();
    });
  
    app.use('/auth', authRoutes);
    // Error handler to pass errors as JSON.
    app.use((err, req, res, next) => {
      res.status(500).json({ message: err.message });
    });
  
    return app;
  }

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should return 401 with an error message when authentication fails', async () => {
      passport.authenticate.mockImplementation((strategy, callback) => {
        return (req, res, next) => {
          callback(null, false, { message: 'Invalid credentials' });
        };
      });

      const response = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'wrong', password: 'wrong' });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return a success message with user details when authentication succeeds', async () => {
      const dummyUser = { userId: 1, username: 'testuser' };
      passport.authenticate.mockImplementation((strategy, callback) => {
        return (req, res, next) => {
          callback(null, dummyUser, {});
        };
      });

      const response = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'testuser', password: 'password' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged in');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject(dummyUser);
    });
  });

  describe('GET /auth/login/salesforce', () => {
    it('should invoke passport.salesforce strategy and simulate a redirect', async () => {
      passport.authenticate.mockImplementation((strategy) => {
        return (req, res, next) => {
          res.redirect('/dummy-salesforce');
        };
      });

      const response = await request(app)
        .get('/auth/login/salesforce');

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/dummy-salesforce');
    });
  });

  describe('GET /auth/logout', () => {
    it('should logout and redirect to /login', async () => {
      const response = await request(app)
        .get('/auth/logout');
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/login');
    });
  });
});
