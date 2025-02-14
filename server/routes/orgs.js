/*
logic to handle authenticating a new org for a user.
*/
const express = require('express');
const path = require('path');
const Logger = require('../../utils/Logger.js');
const { logProcess, logError } = Logger('bevops:routes/orgs', null, true);
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User.js');
const Org = require('../models/Org.js');
const router = express.Router();
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

/**
 * GET /orgs
 * Return the orgs page
 */
router.get('/orgs', limiter, async (req, res) => {
    logProcess('BEVOPS.GET:/orgs', req.user ? req.user.id : 'NO USER', new Date());
    try {
        if (!req.user) {
            logProcess('BEVOPS.GET:/orgs', 'NO USER', new Date());
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const userId = req.user.id;
        const orgs = await Org.find({ userId });
        logProcess('BEVOPS.GET:/orgs', `Found ${orgs.length} orgs for user ${userId}`, new Date());
        return res.status(200).json(orgs);
    }
    catch (e) {
        logError(`BEVOPS.GET:/orgs ${e.message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


/**
 * GET /orgs/:orgId
 * Return the org details page
 */
router.get('/orgs/:orgId', limiter, async (req, res) => {
    logProcess('BEVOPS.GET:/orgs/:orgId', req.user ? req.user
        .id : 'NO USER', new Date());
    try {
        if (!req.user) {
            logProcess('BEVOPS.GET/:orgId', 'NO USER', new Date());
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { orgId } = req.params;
        const userId = req.user.id;
        const org = await Org.findById(orgId);
        if (!org) {
            logProcess('BEVOPS.GET/:orgId', `Org ${orgId} not found`, new Date());
            return res.status(404).json({ message: 'Org not found' });
        }
        if (org.userId !== userId) {
            logProcess('BEVOPS.GET/:orgId', `Org ${orgId} not found for user ${userId}`, new Date());
            return res.status(403).json({ message: 'Forbidden' });
        }
        logProcess('BEVOPS.GET/:orgId', `Org ${orgId} found for user ${userId}`, new Date());
        return res.status(200).json(org);
    }
    catch (e) {
        logError(`BEVOPS.GET/:orgId ${e.message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
);


/**
 * POST /orgs
 * Create a new org for the user
 */
router.post('/orgs', limiter, async (req, res) => {
    logProcess('BEVOPS.POST:/orgs', req.user ? req.user
        .id : 'NO USER', new Date());
    try {
        if (!req.user) {
            logProcess('BEVOPS.POST:/orgs', 'NO USER', new Date());
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { name, description } = req.body;
        const userId = req.user.id;
        const orgId = uuidv4();
        const org = await Org.create({ id: orgId, name, description, userId });
        logProcess('BEVOPS.POST:/orgs', `Created org ${orgId}`, new Date());
        return res.status(201).json(org);
    }
    catch (e) {
        logError(`BEVOPS.POST:/orgs ${e.message}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
