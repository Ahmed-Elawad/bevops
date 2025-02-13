/*
Org model to represent a salesforce org.
In memory only for mvp
*/

const orgs = [];
class Org {
    constructor(orgId, name, instanceUrl, refreshToken, accessToken) {
        this.orgId = orgId;
        this.name = name;
        this.instanceUrl = instanceUrl;
        this.refreshToken = refreshToken;
        this.accessToken = accessToken;
    }

    static create(orgId, name, instanceUrl, refreshToken) {
        const org = new Org(orgId, name, instanceUrl, refreshToken);
        orgs.push(org);
        return org;
    }

    static findByOrgId(orgId) {
        return orgs.find(org => org.orgId === orgId);
    }

    static findByName(name) {
        return orgs.find(org => org.name === name);
    }

    static findAll() {
        return orgs;
    }

    static delete(orgId) {
        const index = orgs.findIndex(org => org.orgId === orgId);
        if (index !== -1) {
            orgs.splice(index, 1);
            return true;
        }
        return false;
    }
}

module.exports = Org;
