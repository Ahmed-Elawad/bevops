// load env variables
try {

const dot_env_path = './env/server.env';
const Logger = require('../utils/Logger.js');
const {logProcess, logError} = Logger('bevops.server', null, true);

require('dotenv').config({path: dot_env_path});
const appPort = process.env.server_app_port;
const session = require('express-session');
const passport = require('passport');


// start express server
const express = require('express');
const App = express();

// app paths
const bodyParser = require('body-parser');
const { log } = require('winston');

App.use( express.json() );
App.use( bodyParser.json() );
App.use( bodyParser.urlencoded({extended: true}) );


/*
Session related configurations for the app
*/
App.use(
    session({
        secret: process.env.bevops_session_secret,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    })
);
App.use(passport.initialize());
App.use(passport.session());
require('./services/passport.js')(passport);

/*
Custom application routes
*/
App.use('/',
    require('./routes/home.js')
);

App.use('/',
    require('./routes/auth.js')
);


/*
Error handling
*/
App.use((err, req, res, next) => {
    logError(`BEVOPS:Error ${ err.message}`);
    res.status(500).send('Internal server error');
});

const server = App.listen(appPort, logProcess('Bevops =>', `Server running: http://localhost:${appPort}`), new Date());

process.on('uncaughtException', (err) => {
    logError(`Uncaught Exception ${err}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError(`Unhandled Rejection at: ${promise} \nreason: ${reason}` );
    process.exit(1);
});

const gracefulShutdown = (signal) => {
    logProcess(`Received ${signal}. Shutting down gracefully...`, null, new Date());
    server.close(() => {
        logProcess('Server terminated gracefully.', null, new Date());
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
} catch(e) {
    debugger
    logError(`BEVOPS:server ${e.message}`);
}