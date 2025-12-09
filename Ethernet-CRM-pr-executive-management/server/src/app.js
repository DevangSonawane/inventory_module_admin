import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
// Import models to ensure associations are loaded before routes
import './models/index.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { metricsCollector } from './middleware/metrics.js';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase limit for file uploads

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}
// Lightweight structured-ish logger for all requests (method, path, status, duration)
app.use(requestLogger('api'));
// In-process metrics (counts/durations). Not suitable for multi-instance without shared store.
app.use(metricsCollector('api'));

// API routes
app.use('/api/v1', routes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Express + Sequelize API',
    version: '1.0.0'
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;