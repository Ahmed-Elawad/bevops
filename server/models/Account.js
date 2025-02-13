const accounts = [];

class Account {
    constructor(name, balance) {
        this.name = name;
    }

    static create(name) {
        const account = new Account(name);
        accounts.push(account);
        return account;
    }

    static getAll() {
        return accounts;
    }

    static getByName(name) {
        return accounts.find(account => account.name === name);
    }

    static delete(name) {
        const index = accounts.findIndex(account => account.name === name);
        if (index !== -1) {
        accounts.splice(index, 1);
        return true;
        }
        return false;
    }
}

module.exports = Account;
