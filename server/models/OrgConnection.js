const connections = [];

class OrgConnection {
    constructor(orgId, connectionId, name, instanceUrl, refreshToken, accessToken) {
        this.orgId = orgId;
        this.connectionId = connectionId;
        this.name = name;
        this.instanceUrl = instanceUrl;
        this.refreshToken = refreshToken;
        this.accessToken = accessToken;
    }

    static create(orgId, connectionId, name, instanceUrl, refreshToken) {
        const connection = new OrgConnection(orgId, connectionId, name, instanceUrl, refreshToken);
        connections.push(connection);
        return connection;
    }
    static findByOrgId(orgId) {
        return connections.find(connection => connection.orgId === orgId);
    }
    static findByName(name) {
        return connections.find(connection => connection.name === name);
    }
    static findAll() {
        return connections;
    }
    static delete(orgId) {
        const index = connections.findIndex(connection => connection.orgId === orgId);
        if (index !== -1) {
            connections.splice(index, 1);
            return true;
        }
        return false;
    }
    static update(orgId, connectionId, name, instanceUrl, refreshToken) {
        const connection = connections.find(connection => connection.orgId === orgId);
        if (connection) {
            connection.connectionId = connectionId;
            connection.name = name;
            connection.instanceUrl = instanceUrl;
            connection.refreshToken = refreshToken;
            return connection;
        }
        return null;
    }
    static findByConnectionId(connectionId) {
        return connections.find(connection => connection.connectionId === connectionId);
    }
}

module.exports = OrgConnection;
