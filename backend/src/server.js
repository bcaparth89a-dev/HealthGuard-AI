import app from './app.js';
import config from './config/index.js';
import logger from './utils/logger.js';

// Render provides the PORT environment variable.
// Use 5000 locally if PORT is not defined.
const PORT = process.env.PORT || config.port || 5000;

// Bind to 0.0.0.0 so the server is accessible on Render.
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(
    `HealthGuard AI server successfully initialized in [${config.nodeEnv}] mode`
  );

  logger.info(
    `Server listening for HTTP requests on address http://${HOST}:${PORT}`
  );
});

// Capture uncaught exceptions and shutdown cleanly
process.on('uncaughtException', (error) => {
  logger.error(
    'CRITICAL: Uncaught Exception detected! Initiating shutdown...',
    error
  );

  process.exit(1);
});

// Capture unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    'CRITICAL: Unhandled Promise Rejection detected!',
    reason
  );

  server.close(() => {
    process.exit(1);
  });
});