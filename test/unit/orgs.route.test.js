const request = require('supertest');
const express = require('express');

// --- Mock the Org model ---
jest.mock('../../server/models/Org.js', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

const Org = require('../../server/models/Org.js');

const orgsRouter = require('../../server/routes/orgs');

function createTestApp(user = null) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    req.user = user;
    next();
  });

  app.use('/', orgsRouter);

  app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
  });
  return app;
}

describe('Org Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /orgs', () => {
    it('should return 401 if no user is present', async () => {
      const app = createTestApp(null);
      const response = await request(app).get('/orgs');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    it('should return orgs for an authenticated user', async () => {
      const user = { id: 'user-123' };
      const orgs = [
        { id: 'org-1', name: 'Org One', userId: 'user-123' },
        { id: 'org-2', name: 'Org Two', userId: 'user-123' },
      ];
      Org.find.mockResolvedValue(orgs);

      const app = createTestApp(user);
      const response = await request(app).get('/orgs');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(orgs);
      expect(Org.find).toHaveBeenCalledWith({ userId: user.id });
    });
  });

  describe('GET /orgs/:orgId', () => {
    it('should return 401 if no user is present', async () => {
      const app = createTestApp(null);
      const response = await request(app).get('/orgs/some-org-id');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    it('should return 404 if the org is not found', async () => {
      const user = { id: 'user-123' };
      Org.findById.mockResolvedValue(null);

      const app = createTestApp(user);
      const response = await request(app).get('/orgs/non-existent-org');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Org not found' });
    });

    it('should return 403 if the org does not belong to the user', async () => {
      const user = { id: 'user-123' };
      const org = { id: 'org-1', name: 'Org One', userId: 'different-user' };
      Org.findById.mockResolvedValue(org);

      const app = createTestApp(user);
      const response = await request(app).get('/orgs/org-1');
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Forbidden' });
    });

    it('should return 200 with org details if the org belongs to the user', async () => {
      const user = { id: 'user-123' };
      const org = { id: 'org-1', name: 'Org One', userId: 'user-123' };
      Org.findById.mockResolvedValue(org);

      const app = createTestApp(user);
      const response = await request(app).get('/orgs/org-1');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(org);
    });
  });

  describe('POST /orgs', () => {
    it('should return 401 if no user is present', async () => {
      const app = createTestApp(null);
      const response = await request(app)
        .post('/orgs')
        .send({ name: 'New Org', description: 'Test description' });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    it('should create a new org for an authenticated user', async () => {
      const user = { id: 'user-123' };
      const newOrg = { id: 'org-new', name: 'New Org', description: 'Test description', userId: user.id };
      Org.create.mockResolvedValue(newOrg);

      const app = createTestApp(user);
      const response = await request(app)
        .post('/orgs')
        .send({ name: 'New Org', description: 'Test description' });
      expect(response.status).toBe(201);
      expect(response.body).toEqual(newOrg);
      expect(Org.create).toHaveBeenCalledWith({
        id: expect.any(String),
        name: 'New Org',
        description: 'Test description',
        userId: user.id,
      });
    });
  });
});
