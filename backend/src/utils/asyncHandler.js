/**
 * Wraps an async controller so rejected promises reach Express'
 * central error handler instead of crashing the process.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;