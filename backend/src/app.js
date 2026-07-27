import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS with dynamic client url mapping
app.use(cors({
  origin: config.clientUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// Base Health Check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'HealthGuard AI API',
  });
});

// Capture unhandled API routes (404 handler)
app.use((req, res, next) => {
  const error = new Error(`Cannot handle path ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Configure Global Error handler middleware
app.use(errorHandler);

export default app;
