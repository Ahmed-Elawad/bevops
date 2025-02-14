const dot_env_path = './env/sfdc.server.env';
require('dotenv').config({path: dot_env_path});

const jsforce = require('jsforce');
const Logger = require('../../utils/Logger.js');
const { logProcess, logError } = Logger('bevops.services.sfdc', null, true);
const orgsById = {};
const orgsByName = {};
const orgsBeingValidated = {};

async function saveOrgToDb(org, userId) {
    try {
        if (!org || !org.recordId) {
            return;
        }
        logProcess('Saving org to DB', org.recordId, new Date());
        if (!orgsById[org.recordId]) {
            orgsById[org.recordId] = org;
        }
        if (!orgsByName[org.name]) {
            orgsByName[org.name] = org;
        }
    }catch(e) {
      logError(`Error saving org to DB: ${e.message}`);
    }
  }


async function addOrgConnection(details, user) {
    if (orgsById[details.recordId]) return org;
    const orgDirectory = `./orgs/${details.recordId}`;
    const loginUrl = details.loginUrl || 'https://test.salesforce.com';
    const connection = new jsforce.Connection({
      version: '60.0',
      oauth2: {
        clientId: process.env.CONNECTED_APP_CLIENT_ID_TEST,
        clientSecret: process.env.CONNECTED_APP_CLIENT_SECRET_TEST,
        redirectUri: `http://localhost:${process.env.BEVOPS_PORT}/auth/callback`,
      },
      instanceUrl: details.instance_url,
      accessToken: details.accessToken,
      refreshToken: details.refreshToken,
      loginUrl: loginUrl,
      refreshFn: async (conn, callback) => {
        try {
          const res = await conn.oauth2.refreshToken(conn.refreshToken);
          if (!res.access_token) {
            throw 'Access token not found after refresh';
          }
          conn.accessToken = res.access_token;
          callback(null, res.access_token);
        } catch (err) {
          logError(`Error refreshing access token: ${err.message}` );
        }
      }
    });
  
    try {
      await connection.identity();
    } catch (e) {
      logError(`Error establishing connection: ${e.message}`);
      throw e;
    }
  
    orgsById[details.recordId] = {
      recordId: details.recordId,
      accessToken: details.accessToken,
      refreshToken: details.refreshToken,
      instanceUrl: details.instance_url,
      orgId: details.recordId,
      orgManifest: {
        isgenerating: false,
        lastSynced: null,
      },
      connection: connection,
      metadata: {},
      orgConfig: {
        metadataApiVersion: '60.0',
      },
      orgMetadata: {
        location: orgDirectory,
      },
      initWithTypes: [
        'GlobalValueSet',
        'CustomObject',
        'CustomLabels',
        'StandardValueSet',
      ],
    };

 

    orgsById[details.recordId].connection.on('refresh', (accessToken, res) => {
      logProcess('Access token refreshed:', accessToken, res);
    });
      
    orgsById[details.recordId].connection.on('error', (err) => {
      logError(`Connection error: ${err}`);
    });

    orgsById[details.recordId].connection.on('INVALID_SESSION_ID', (err) => {
      logError(`Invalid session ID: ${err}`);
    });

    createDirectory(orgDirectory);
    if (!orgsBeingValidated[details.recordId]) await ensureOrgMetadataInitialized(details.recordId, user);
    return details;
}

async function ensureOrgMetadataInitialized(recordId, user) {
  if (!recordId) throw new Error('orgId is required');
  orgsBeingValidated[recordId] = true;
  try {
    let org = orgsById[recordId];
    if (!org) {
      return false;
    }
    
    // insert the org connection into the database    
    // run the logic to trigger the initialization job for the org being validation with type validation
    return true;
  } catch (error) {
    logError(`Failed to ensure org metadata: ${error.message}`);
    throw error;
  }
}

module.exports = { 
  addOrgConnection,
  ensureOrgMetadataInitialized,
  saveOrgToDb,
  orgsById,
  orgsByName,
  orgsBeingValidated
};