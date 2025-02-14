// test/unit/login.test.js
const request = require('supertest');
const express = require('express');

// IMPORTANT: Place the mock at the very top so that any module requiring 'passport'
// gets the mocked version.
jest.mock('passport', () => {
  const authenticate = jest.fn(); // Keep track of calls
    // Mock Strategy and callback
  return {
    authenticate: authenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
         
          if (strategy === 'salesforce') {
            // Simulate Salesforce redirect.
            res.redirect(302, 'https://salesforce-mock-login');
            return; // Important to stop further execution
          } else if (strategy === 'local') {
            if (req.body.username === 'testuser' && req.body.password === 'password123') {
                const mockUser = { id: 'test-user-id', username: 'testuser' };
                req.login(mockUser, (err) => {
                  if (err) return next(err);
                  return callback(null, mockUser); // Successful authentication
                });
                return;
            } else {
              // Simulate authentication failure
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

// Mock the User model's findOrCreate method.
const mockFindOrCreate = jest.fn();
jest.mock('../../server/models/User.js', () => ({
  findOrCreate: mockFindOrCreate,
}));

// Now require the auth routes after mocking passport.
const authRoutes = require('../../server/routes/auth');

// Helper to create a minimal Express app for testing.
function createTestApp() {
  const app = express();
  // Parse both JSON and URL-encoded bodies.
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Override req.is to force JSON recognition.
  app.use((req, res, next) => {
    req.is = (type) => {
      return type === 'application/json'; 
    };
    next();
  });

    // Provide dummy implementations for req.login and req.logout.
    app.use((req, res, next) => {
      req.login = (user, callback) => {
        if (callback) {
          callback(null); // pass null to the callback
        }
      }; // Pass null to callback
      req.logout = (callback) => {
        if (callback) {
          callback(null); // pass null to the callback
        }
      };
      next();
    });

  // Setup Passport middleware.
  const passport = require('passport');
  app.use(passport.initialize());
  app.use(passport.session());

  // Mount the auth routes at /auth.
  app.use(authRoutes);

  // Error handler: send error messages as JSON.
  app.use((err, req, res, next) => {
    console.error("Error in express app", err)
    res.status(500).json({ message: err.message });
  });

  return app;
}

describe('Auth Routes', () => {
  let app;
  let authenticateMock; // To access the mock function directly

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
    authenticateMock = require('passport').authenticate; // Get the mock
  });

    test('GET /auth/login/salesforce should simulate a redirect', async () => {
      const response = await request(app).get('/login/salesforce');
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('https://salesforce-mock-login');
    });
  
    test('GET /auth/login should return the login page', async () => {
      const response = await request(app).get('/auth/login');
      expect(response.status).toBe(200);
      expect(response.type).toMatch(/html/);
    });
  
  test('POST /auth/login should successfully log in a user', async () => {
    const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/dashboard');
      expect(authenticateMock).toHaveBeenCalledWith('local', expect.any(Function));
  });

  test('POST /auth/login with invalid credentials should fail', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'invaliduser', password: 'wrongpassword' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/login?error=Invalid%20credentials');
    expect(authenticateMock).toHaveBeenCalledWith('local', expect.any(Function));
  });

  test('GET /auth/signup should return the signup page', async () => {
    const response = await request(app).get('/auth/signup');
    expect(response.status).toBe(200);
    expect(response.type).toMatch(/html/);
  });

  test('POST /auth/signup should register a new user and redirect', async () => {
    const mockUser = {
      id: 'new-user-id',
      username: 'newuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    mockFindOrCreate.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/auth/signup')
      .send({
        username: 'newuser',
        password: 'password123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/dashboard');
    expect(mockFindOrCreate).toHaveBeenCalledTimes(1);
    expect(mockFindOrCreate).toHaveBeenCalledWith({
      username: 'newuser',
      password: 'password123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    });
  });

  test('POST /auth/signup should reject if any fields are missing', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({ username: 'newuser', password: 'password123' });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Missing required fields' });
  });

  test('GET /auth/logout should log out the user and redirect to the root path', async () => {
    const response = await request(app).get('/auth/logout');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });
});