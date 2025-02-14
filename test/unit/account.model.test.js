// test/unit/account.test.js

// Mock the database module so that no real DB calls are made.
jest.mock('../../server/services/database.js', () => {
  return {
    query: jest.fn(),
  };
});

// Require the mocked db and the Account model.
const db = require('../../server/services/database.js');
const Account = require('../../server/models/Account');


describe('Account Model', () => {
  // Clear mocks and reset stubs before each test.
  beforeEach(() => {
    db.query.mockClear();
  });

  test('should create a new account', async () => {
    const accountData = { name: 'Test Account' };

    // Simulate a successful INSERT query.
    db.query.mockResolvedValue({ rowCount: 1 });

    const account = await Account.create(accountData);

    // Verify that the returned account is an instance of Account.
    expect(account).toBeInstanceOf(Account);
    expect(account.id).toBeDefined();
    expect(account.name).toBe(accountData.name);

    // Ensure db.query was called with the expected INSERT statement.
    expect(db.query).toHaveBeenCalledTimes(2);
    const [query, values] = db.query.mock.calls[0];
    expect(query).toContain('SELECT * FROM accounts');
    expect(values).toEqual(expect.arrayContaining([
      accountData.name
    ]));
  });

  test('should throw an error when trying to create a duplicate account', async () => {
    const accountData = { name: 'Duplicate Account' };

    // Stub findOne to simulate that an account already exists by name
    Account.findOne = async ({ name }) => {
      if (name === accountData.name) {
        return new Account({ id: 'existing-id', name: accountData.name });
      }
      return null;
    };

    await expect(Account.create(accountData)).rejects.toThrow('Account already exists');
    // Ensure that no INSERT query was attempted.
    expect(db.query).not.toHaveBeenCalled();
  });

  test('should find an account by ID', async () => {
    const dummyAccountData = { id: 'dummy-id', name: 'Find Account' };

    // Simulate the SELECT query returning the account.
    db.query.mockResolvedValue({
      rowCount: 1,
      rows: [dummyAccountData],
    });

    const account = await Account.findById(dummyAccountData.id);
    expect(account).toBeInstanceOf(Account);
    expect(account.id).toBe(dummyAccountData.id);
    expect(account.name).toBe(dummyAccountData.name);
  });

  test('should return null when account is not found by ID', async () => {
    // Simulate a SELECT query with no matching rows.
    db.query.mockResolvedValue({
      rowCount: 0,
      rows: [],
    });

    const account = await Account.findById('non-existent-id');
    expect(account).toBeNull();
  });
});