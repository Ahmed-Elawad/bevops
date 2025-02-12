const express = require('express');
const passport= require('passport');
const Logger = require('../../utils/Logger.js');
const {logProcess, logError} = Logger('bevops:routes/auth', null, true);
const path = require('path');
const router = express.Router();

router.post('/login', (req, res, next) => {
    try {
        logProcess('BEVOPS:/login', req.user.userId, new Date());
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                if (req.is('application/json')) {
                    return res.status(401).json({ message: info.message });
                }
                return res.redirect('/login?error=' + encodeURIComponent(info.message));
            }
            req.login(user, err => {
                if (err) return next(err);
                if (req.is('application/json')) {
                    return res.json({ message: 'Logged in', user});
                }
                return res.redicrect('/dashboard');
            });

        })(req, res, next);
    }catch(e) {
        logError(`BEVOPS:/login ${e.message}`);
        return res.status(500).json({ message: 'Internal server error'});
    }
});

router.get('/login', (req, res) => {
    try {
        logProcess('BEVOPS:GET/login', ' NULL ', new Date());
        res.sendFile(path.join(__dirname, '..', '..', 'clients', 'login.html'));
    }catch(e) {
        logError(`BEVOPS:/login ${e.message}`);
        return res.status(500).json({ message: 'Internal server error'});
    }
});

router.get('/login/salesforce', passport.authenticate('salesforce'));

router.get('/logout', (req, res) => {
    try {
        logProcess('BEVOPS:/logout', req.user.userId, new Date());
        req.logout(err => {
            if (err) {
                logError(`BEVOPS:/logout ${err.message}`);
                return res.status(500).json({ message: 'Internal server error'});
            }
        });
        res.redirect('/login');
    }catch(e) {
        logError(`BEVOPS:/logout ${e.message}`);
        return res.status(500).json({ message: 'Internal server error'});
    }
});

module.exports = router;