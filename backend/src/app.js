import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import errorHandler from './middleware/errorHandler.js';
import dashboardRouter from './routes/dashboard.routes.js';
import aiRouter from './routes/ai.routes.js';
import recordsRouter from './routes/records.routes.js';
import healthRouter from './routes/health.routes.js';
import symptomsRouter from './routes/symptoms.routes.js';
import reportsRouter from './routes/reports.routes.js';
import familyRouter from './routes/family.routes.js';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS with dynamic client url mapping
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];
if (config.clientUrl) {
  config.clientUrl.split(',').forEach(url => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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

// Production Uptime Health Check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Register Dashboard Routes under standard and versioned paths
app.use('/dashboard', dashboardRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/ai', aiRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/records', recordsRouter);
app.use('/api/v1/records', recordsRouter);
app.use('/api/predict', healthRouter);
app.use('/api/v1/predict', healthRouter);
app.use('/api/symptoms', symptomsRouter);
app.use('/api/v1/symptoms', symptomsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/family-members', familyRouter);
app.use('/api/v1/family-members', familyRouter);

// Capture unhandled API routes (404 handler)
app.use((req, res, next) => {
  const error = new Error(`Cannot handle path ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Configure Global Error handler middleware
app.use(errorHandler);

export default app;
