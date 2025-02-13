// test/unit/login.test.js

const request = require('supertest');
const app = require('../../app'); // Adjust this path based on your app file location
const passport = require('passport');

// Mock the passport.authenticate function, as we don't need to test passport's internal logic
jest.mock('passport', () => ({
  authenticate: jest.fn().mockImplementation((strategy, callback) => {
    return (req, res, next) => {
      if (strategy === 'salesforce') {
         // Simulate the redirect behavior of passport.authenticate
        res.redirect(302, 'https://salesforce-mock-login'); // Mock salesforce redirect URL
      }
        if (strategy === 'local') {
        // Simulate successful authentication for local
          const mockUser = {id: 'test-user-id', username: 'testuser'};
            req.login(mockUser, (err) => {
            if (err) {
              return next(err);
             }
              callback(null, mockUser);
            });
        }  else {
            callback(null, false, { message: 'Authentication failed' });
      }
    };
  })
}));

//Mock the findOrCreate method
const mockFindOrCreate = jest.fn();
jest.mock('../../server/models/User.js', () => ({
  findOrCreate: mockFindOrCreate
}));

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  test('GET /auth/login/salesforce should invoke passport.salesforce strategy and simulate a redirect', async () => {
    const response = await request(app)
      .get('/auth/login/salesforce');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('https://salesforce-mock-login');
    expect(passport.authenticate).toHaveBeenCalledTimes(1);
    expect(passport.authenticate).toHaveBeenCalledWith('salesforce');
  });

  test('GET /auth/login should return the login page', async () => {
      const response = await request(app)
          .get('/auth/login');
      expect(response.status).toBe(200);
      expect(response.type).toBe('text/html');
  });


    test('POST /auth/login should successfully log in a user', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({username: 'testuser', password: 'password123'}); // Mock form data

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/dashboard');
      expect(passport.authenticate).toHaveBeenCalledTimes(1);
      expect(passport.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
  });
 test('POST /auth/login with invalid credentials should fail', async () => {
        // Mock passport to simulate invalid credentials
        passport.authenticate.mockImplementationOnce((strategy, callback) => {
          return (req, res, next) => {
            callback(null, false, {message: 'Invalid credentials'});
          };
        });
       const response = await request(app)
           .post('/auth/login')
           .send({username: 'invaliduser', password: 'wrongpassword'});

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/login?error=Invalid%20credentials')
      expect(passport.authenticate).toHaveBeenCalledTimes(1);
      expect(passport.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
  });

 test('GET /auth/signup should return the signup page', async () => {
      const response = await request(app)
          .get('/auth/signup');
      expect(response.status).toBe(200);
      expect(response.type).toBe('text/html');
    });


   test('POST /auth/signup should register a new user and redirect', async () => {
      // Mock the user creation
      const mockUser = { id: 'new-user-id', username: 'newuser', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
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
        .send({
          username: 'newuser',
          password: 'password123'
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({message: 'Missing required fields'});
    });


  test('GET /auth/logout should log out the user and redirect to the root path', async () => {
     const response = await request(app)
          .get('/auth/logout');
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/');
  });
});