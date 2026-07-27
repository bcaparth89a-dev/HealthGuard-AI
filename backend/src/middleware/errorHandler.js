import config from '../config/index.js';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'An internal server error occurred.';

  // Log error with details
  logger.error(`${req.method} ${req.url} - Status ${status} - Error: ${message}`, err);

  const errorResponse = {
    status: 'error',
    message,
  };

  // Add error stack detail only in non-production environments
  if (config.nodeEnv !== 'production') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || null;
  }

  res.status(status).json(errorResponse);
};

export default errorHandler;
