// load env variables
const dot_env_path = './env/server.env';
require('dotenv').config({path: dot_env_path});
const appPort = process.env.server_app_port;

// start express server
const express = require('express');
const App = express();

// app paths
const path = require('path');
const bodyParser = require('body-parser');

App.use( express.json() );
App.use( bodyParser.json() );
App.use( bodyParser.urlencoded({extended: true}) );

App.listen(appPort, () => console.log(`Server running: http://localhost:${appPort}`));