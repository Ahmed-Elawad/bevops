const Logger = require('../../utils/Logger.js');
const { logProcess, logError } = Logger('bevops.auth', null, true);
const LocalStrategy = require('passport-local').Strategy;
const SalesforceStrategy = require('passport-salesforce').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/User.js');

module.exports = function(passport) {
    try {
        passport.serializeUser((user, done) => {
            logProcess('BEVOPS:passport-serialize', user?.id, new Date());
            done(null, user.id);
        });

        passport.deserializeUser(async (id, done) => {
            try {
                logProcess('BEVOPS:passport-deserialize', id, new Date());
                const user = await User.findById(id);
                done(null, user);
            } catch(e) {
                done(e, null);
            }
        });

        passport.use('local', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
          }, async (username, password, done) => {
            logProcess('BEVOPS:passport-local', username, new Date());
            try {
              const user = await User.findByUsername(username);
              if (!user) {
                logProcess('BEVOPS:passport-local-NUUSER', username, new Date());
                return done(null, false, { message: 'Invalid username or password' });
              }
              const match = await bcrypt.compare(password, user.passwordHash);
              if (match) {
                logProcess('BEVOPS:passport-local-MATCHED', user.id, new Date());
                return done(null, user);
              }
              return done(null, false, { message: 'Invalid username or password' });
            } catch (e) {
              logError(`BEVOPS:passport-local ${e.message}`);
              return done(e);
            }
          }));

        passport.use(
            'salesforce',
            new SalesforceStrategy(
                {
                    clientID: process.env.SALESFORCE_CLIENT_ID,
                    clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
                    callbackURL: process.env.SALESFORCE_CALLBACK_URL,
                },
                async (accessToken, refreshToken, profile, done) => {
                    logProcess('BEVOPS:passport-salesforce', profile.id, new Date());
                    try {
                        const user = await User.findBySalesforceId(profile.id);
                        if (user) {
                            return done(null, user);
                        }
                        const newUser = await User.create({
                            salesforceId: profile.id,
                            email: profile.email,
                            name: profile.displayName,
                        });
                        return done(null, newUser);
                    } catch(e) {
                        logError(`BEVOPS:passport-salesforce ${e.message}`);
                        return done(e);
                    }
                }
            )
        );
    } catch(e) {
        logError(`BEVOPS:passport ${e.message}`);
    }
};
