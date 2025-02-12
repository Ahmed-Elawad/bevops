const express = require('express');
const path = require('path');
const Logger = require('../../utils/Logger.js');
const {logProcess, logError} = Logger('bevops:routes/home', null, true);
const rateLimit = require('express-rate-limit');

const router = express.Router();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

router.get('/', limiter, (req, res) => {
    logProcess('BEVOPS:/', 'GET HOME', new Date());
    res.sendFile(path.join(__dirname, '..', '..', 'clients', 'home.html'));
});

router.get('/dashboard', limiter, (req, res) => {
    logProcess('BEVOPS.GET:/dashboard', 'GET HOME', new Date());
    res.sendFile(path.join(__dirname, '..', '..', 'clients', 'dashboard.html'));
});

module.exports = router;