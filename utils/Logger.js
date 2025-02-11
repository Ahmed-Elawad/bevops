/*
A logger utility that allows easy logging to files.
Usage:

-- import
const Logger = require('../util/Logger.js');

-- define
const {logError, logProcess} = Logger('myExampleLogFile', null, true);

-- log
logProcess("code-section-reference", 'log_message', timestamp);
logError('ErrorMessage');

*/
const Winston = require('winston');
const path = require('path');

// logs are added to the directory the logs are imported if they're not provided.
const DEFAULTS = {
  BASE_LOG_DIRECTORY: './logs',
  DEFAULT_LEVEL: 'info'
};

/**
 * Returns an object with logError, logProcess, wrapMethods, etc.
 * The first argument, `serviceName`, becomes the log file name (e.g. "SFDC.log").
 */
function Logger(serviceName, fn, useMethods, returnUnwrappedResult, logFileName) {
  // If no explicit logFileName is provided, we create one from `serviceName`.
  const logFilename = logFileName
    ? logFileName
    : `${serviceName || 'process'}.log`;
    

  // Build the full path to the log file
  const processLogFilePath = path.join(DEFAULTS.BASE_LOG_DIRECTORY, logFilename);
  // Create a Winston logger with separate log files for normal info logs and error logs
  const customLogger = Winston.createLogger({
    level: DEFAULTS.DEFAULT_LEVEL,
    transports: [
      new Winston.transports.File({
        filename: processLogFilePath,
        level: 'info'
      }),
      new Winston.transports.File({
        filename: path.join(DEFAULTS.BASE_LOG_DIRECTORY, 'exceptions.log'),
        level: 'error'
      })
    ],
    exceptionHandlers: [
      new Winston.transports.File({
        filename: path.join(DEFAULTS.BASE_LOG_DIRECTORY, 'exceptions.log'),
        level: 'error'
      })
    ],
    exitOnError: false
  });

  /**
   * Log an error
   */
  function logError(error) {
    try {
      console.error(error);
      // if 'error' is an object with message, etc.
      customLogger.error(error.message ? error.message : error);
    } catch (e) {
      console.error(`Logger error: ${e.message}`);
    }
  }

  /**
   * Log a process / info
   */
  function logProcess(name, user, message) {
    try {
      console.log(`${name}.${user} - ${message}`);
      customLogger.info(`${name}.${user} - ${message}`);
    } catch (e) {
      console.error(`Logger error: ${e.message}`);
    }
  }

  /**
   * Example method that wraps a function in a try/catch and logs
   */
  async function wrapMethods(fnToWrap, callerName) {
    return async function(...args) {
      try {
        customLogger.info(`${callerName}.${fnToWrap.name}...`);
        const result = await fnToWrap.call(this, ...args);
        return { result };
      } catch (e) {
        customLogger.error(`Error: ${e.message}`, e);
        return { errors: [e.message] };
      }
    };
  }

  // If useMethods is false => return an async function that logs calls
  // Otherwise, return an object of logging utilities
  if (!useMethods) {
    return async function(...args) {
      try {
        customLogger.info(`${serviceName}.${fn.name}...`);
        const result = await fn.call(this, ...args);
        if (!result) return {};

        // If you have custom logic for returning unwrapped results:
        if (returnUnwrappedResult) {
          return result.result ? result.result : result;
        }
        return result.result ? { result: result.result } : { result };
      } catch (e) {
        customLogger.error(`Error: ${e.message}`, e);
        return { errors: [e.message] };
      }
    };
  }

  // By default, return the logging utilities
  return {
    logError,
    logProcess,
    wrapMethods
  };
}

module.exports = Logger;
