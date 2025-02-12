jest.resetModules();

jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  const mPool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mClient),
    on: jest.fn(),
    end: jest.fn().mockResolvedValue(),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});
const db = require('../../server/services/database.js');

describe('Database module', () => {
  afterAll(async () => {
    await db.pool.end();
  });

  describe('query function', () => {
    it('executes a valid query and returns expected result', async () => {
      const expectedResult = { rows: [{ value: 1 }], rowCount: 1 };
      db.pool.query.mockResolvedValueOnce(expectedResult);
      const result = await db.query('SELECT 1 as value');
      expect(result).toEqual(expectedResult);
    });

    it('throws an error for an invalid query', async () => {
      const error = new Error('invalid query');
      db.pool.query.mockRejectedValueOnce(error);
      await expect(db.query('SELECT * FROM non_existing_table')).rejects.toThrow('invalid query');
    });
  });

  describe('transaction function', () => {
    let fakeClient;
    beforeEach(() => {
      fakeClient = { query: jest.fn(), release: jest.fn() };
      db.pool.connect.mockResolvedValueOnce(fakeClient);
    });

    it('commits a transaction successfully', async () => {
      fakeClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ value: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({});

      const result = await db.transaction(async (client) => {
        const res = await client.query('SELECT 1 as value');
        return res.rows[0].value;
      });
      expect(result).toBe(1);
      expect(fakeClient.query).toHaveBeenCalledWith('BEGIN');
      expect(fakeClient.query).toHaveBeenCalledWith('COMMIT');
      expect(fakeClient.release).toHaveBeenCalled();
    });

    it('rolls back a transaction when an error occurs', async () => {
      fakeClient.query
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Deliberate transaction error'))
        .mockResolvedValueOnce({});

      await expect(
        db.transaction(async (client) => {
          await client.query('SELECT 1 as value');
          throw new Error('Deliberate transaction error');
        })
      ).rejects.toThrow('Deliberate transaction error');
      expect(fakeClient.query).toHaveBeenCalledWith('BEGIN');
      expect(fakeClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(fakeClient.release).toHaveBeenCalled();
    });
  });
});