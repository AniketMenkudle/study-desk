// Express 4 doesn't automatically catch rejected promises from async route
// handlers. Wrapping a handler in this wipes out repetitive try/catch blocks:
// a rejected promise (e.g. a bad Mongo query) gets forwarded to next(err),
// which lands in the error-handling middleware in server.js instead of
// crashing the process.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
