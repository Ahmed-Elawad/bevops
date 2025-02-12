const express = require('express');
const path = require('path');
const Logger = require('../../utils/Logger.js');
const {logProcess, logError} = Logger('bevops:routes/home', null, true);

const router = express.Router();

router.get('/', (req, res) => {
    logProcess('BEVOPS:/', 'GET HOME', new Date());
    res.sendFile(path.join(__dirname, '..', '..', 'clients', 'home.html'));
});

router.get('/dashboard', (req, res) => {
    logProcess('BEVOPS.GET:/dashboard', 'GET HOME', new Date());
    res.sendFile(path.join(__dirname, '..', '..', 'clients', 'dashboard.html'));
});

module.exports = router;