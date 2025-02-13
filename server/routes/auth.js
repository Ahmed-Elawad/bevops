const express = require('express');
const passport = require('passport');
const Logger = require('../../utils/Logger.js');
const { logProcess, logError } = Logger('bevops:routes/auth', null, true);
const path = require('path');
const rateLimit = require('express-rate-limit');
const User = require('../models/User.js');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});

/**
 * POST /login
 * Authenticate user with local strategy.
 */
router.post('/login', limiter, (req, res, next) => {
  try {
    logProcess('BEVOPS.POST:/login', req.user ? req.user.id : 'NO USER', new Date());
    passport.authenticate('local', (err, user, info) => {
      logProcess('  (INFO)BEVOPS.POST:/login', user ? user.id : 'NO USER', new Date());
      if (err) {
        logError(`  (ERROR) BEVOPS.POST:/login ${err.message}`);
        return next(err);
      }
      if (!user) {
        if (req.is('application/json')) {
          logError(`  (INFO) BEVOPS.POST:/login no user (API)`);
          return res.status(401).json({ message: info.message });
        }
        logError(`  (INFO) BEVOPS.POST:/login no user (WEB)`);
        return res.redirect('/login?error=' + encodeURIComponent(info.message));
      }
      req.login(user, err => {
        if (err) {
          logError(`  (ERROR) BEVOPS.POST:/login ${err.message}`);
          return next(err);
        }
        if (req.is('aspplication/json')) {
          logProcess('  (INFO) BEVOPS.POST:/login - SUCCEEDED (API)', user.id, new Date());
          return res.json({ message: 'Logged in', user: user });
        }
        logProcess('  (INFO) BEVOPS.POST:/login - SUCCEEDED (WEB)', user.id, new Date());
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  } catch (e) {
    logError(`  (ERROR) BEVOPS.POST:/login ${e.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /login
 * Serve the login page.
 */
router.get('/login', limiter, (req, res) => {
  try {
    logProcess('BEVOPS.GET:/login', 'NULL', new Date());
    res.sendFile(path.join(__dirname, '..', '..', 'clients', 'login.html'));
  } catch (e) {
    logError(`BEVOPS.GET:/login ${e.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /signup
 * Serve the signup (registration) page.
 */
router.get('/signup', limiter, (req, res) => {
  try {
    logProcess('  (INFO)BEVOPS.GET:/signup', 'NULL', new Date());
    res.sendFile(path.join(__dirname, '..', '..', 'clients', 'signup.html'));
  } catch (e) {
    logError(`  (ERROR)BEVOPS.GET:/signup ${e.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /signup
 * Process registration of a new user.
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    logProcess('BEVOPS.POST:/signup', username, new Date());

    // Validate required fields.
    if (!username || !password || !email || !firstName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Additional enterprise validations can be added here (e.g. email format, password complexity, etc.)

    // Use the User model's findOrCreate method, which will hash the password on creation.
    const savedUser = await User.findOrCreate({ username, password, email, firstName, lastName });

    // Automatically log the user in after registration.
    req.login(savedUser, (err) => {
      if (err) return next(err);
      if (req.is('application/json')) {
        return res.json({
          message: 'Registration successful',
          user: savedUser
        });
      }
      return res.redirect('/dashboard');
    });
  } catch (e) {
    logError(`  (ERROR)BEVOPS.POST:/signup ${e.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /login/salesforce
 * Initiate Salesforce OAuth login.
 */
router.get('/login/salesforce', passport.authenticate('salesforce'));

/**
 * GET /logout
 * Log out the user.
 */
router.get('/logout', (req, res) => {
  try {
    logProcess('BEVOPS.GET:/logout', req.user ? req.user.userId : 'NO USER', new Date());
    req.logout(err => {
      if (err) {
        logError(`  (ERROR)BEVOPS.GET:/logout ${err.message}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.redirect('/');
    });
  } catch (e) {
    logError(`  (ERROR)BEVOPS.GET:/logout ${e.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;