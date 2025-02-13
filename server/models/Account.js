// server/models/Account.js
const db = require('../services/database.js');
const { logError, logProcess } = require('../../utils/Logger.js')('bevops:models:Account', null, true);
const { v4: uuidv4 } = require('uuid');

/**
 * Account class representing a user account.
 */
class Account {
  constructor(params) {
    this.id = params?.id;
    this.name = params?.name;
  }
  /**
   * Creates a new account.
   * @param {Object} accountData - Account data.
   * @returns {Promise<Account>} The created account.
   */
  static async create({ name }) { // Removed id from params
    let newAccount;
      try {
          logProcess('Creating account', name, new Date());
          const existingAccount = await Account.findOne({ name });
          if (existingAccount) {
            throw new Error('Account already exists');
          }
          const id = uuidv4();
           newAccount = new Account({ id, name }); // Create Account object after UUID generation

          const query = 'INSERT INTO accounts (id, name) VALUES ($1, $2)';
          const values = [id, name];
          try {
            await db.query(query, values);
          } catch (error) {
            logError('Error creating account', { error: error.message });
            throw error;
          }
          return newAccount;
      } catch (error) {
          logError(`Error creating account ${error.message}`);
          throw error; // re-throw error to ensure test case fails
      }
  }
  /**
   * Finds an account by ID.
   * @param {string} id - Account ID.
   * @returns {Promise<Account|null>} The found account or null if not found.
   */
  static async findById(id) {
      try {
          logProcess('Finding account by ID', id, new Date());
          const query = 'SELECT * FROM accounts WHERE id = $1';
          const values = [id];
          try {
              const result = await db.query(query, values);
              if (result.rowCount === 0) {
                  return null;
              }
              const accountData = result.rows[0];
              return new Account(accountData);
          } catch (error) {
              logError('Error finding account by ID', { error: error.message });
              throw error;
          }
      } catch (error) {
          logError(`Error finding account by ID ${error.message}`);
          return null;
      }
  }
  /**
   * Finds an account by name
   * @param {string} name - account name
   * @returns {Promise<Account|null>} The found account or null if not found.
   */
    static async findOne({ name }) {
      try {
          logProcess('Finding account by name', name, new Date());
          const query = 'SELECT * FROM accounts WHERE name = $1';
          const values = [name];
          try {
            const result = await db.query(query, values);
            if (result.rowCount === 0) {
              return null;
            }
            const accountData = result.rows[0];
            return new Account(accountData);
          } catch (error) {
            logError('Error finding account by name', { error: error.message });
            throw error;
          }
      } catch (error) {
        logError(`Error finding account by name ${error.message}`);
        return null;
      }
  }
}

module.exports = Account;