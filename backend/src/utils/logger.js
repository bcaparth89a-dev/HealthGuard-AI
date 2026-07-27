const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
};

export const logger = {
  info: (message) => {
    console.log(formatMessage('info', message));
  },
  warn: (message) => {
    console.warn(formatMessage('warn', message));
  },
  error: (message, error) => {
    console.error(formatMessage('error', message));
    if (error && error.stack) {
      console.error(error.stack);
    }
  },
};

export default logger;
