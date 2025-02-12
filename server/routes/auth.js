const express = require('express');
const passport = require('passport');
const Logger = require('../../utils/Logger.js');
const { logProcess, logError } = Logger('bevops:routes/auth', null, true);
const path = require('path');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const User = require('../models/User.js');

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
    logProcess('BEVOPS.POST:/login', req.user ? req.user.userId : 'NO USER', new Date());
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
          return res.json({ message: 'Logged in', user });
        }
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  } catch (e) {
    logError(`BEVOPS.POST:/login ${e.message}`);
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
    logProcess('BEVOPS.GET:/signup', 'NULL', new Date());
    res.sendFile(path.join(__dirname, '..', '..', 'clients', 'signup.html'));
  } catch (e) {
    logError(`BEVOPS.GET:/signup ${e.message}`);
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

    // Validate required fields.
    if (!username || !password || !email || !firstName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // (Enterprise grade:) Insert additional validations here:
    //   - Validate email format.
    //   - Enforce password complexity.
    //   - Check that username/email is not already in use.
    
    const newUser = {
      id: Date.now(),
      username,
      email,
      firstName,
      lastName: lastName || '',
    };
    
    logProcess('BEVOPS.POST:/signup', newUser.username, new Date());
    User.findOrCreate(newUser, defaults);
    req.login(newUser, (err) => {
      if (err) return next(err);
      if (req.is('application/json')) {
        return res.json({ message: 'Registration successful', user: newUser });
      }
      return res.redirect('/dashboard');
    });
  } catch (e) {
    logError(`BEVOPS.POST:/signup ${e.message}`);
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
        logError(`BEVOPS.GET:/logout ${err.message}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.redirect('/login');
    });
  } catch (e) {
    logError(`BEVOPS.GET:/logout ${e.message}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
