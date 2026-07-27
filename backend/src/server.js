import app from './app.js';
import config from './config/index.js';
import logger from './utils/logger.js';

const server = app.listen(config.port, () => {
  logger.info(`HealthGuard AI server successfully initialized in [${config.nodeEnv}] mode`);
  logger.info(`Server listening for HTTP requests on address http://localhost:${config.port}`);
});

// Capture uncaught exceptions and shutdown cleanly
process.on('uncaughtException', (error) => {
  logger.error('CRITICAL: Uncaught Exception detected! Initiating shutdown...', error);
  process.exit(1);
});

// Capture unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('CRITICAL: Unhandled Promise Rejection detected!', reason);
  server.close(() => {
    process.exit(1);
  });
});
