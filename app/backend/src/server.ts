import express, { Request, Response } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './db/database';
import { scanAudioFiles } from './services/audioScanner';
import { apiLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth';
import filesRoutes from './routes/files';
import marksRoutes from './routes/marks';
import streamRoutes from './routes/stream';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const SESSION_SECRET = process.env.SESSION_SECRET || 'development-secret-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (behind Caddy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for React
}));

// Compression
app.use(compression());

// CORS (allow frontend in development)
if (NODE_ENV === 'development') {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
    },
  })
);

// Health check endpoint (no auth required)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/files', apiLimiter, filesRoutes);
app.use('/api/marks', apiLimiter, marksRoutes);
app.use('/api/stream', streamRoutes); // No rate limit on streaming

// Serve static frontend files in production
if (NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));

  // Serve index.html for all non-API routes (SPA support)
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
async function start() {
  try {
    console.log('Starting Session Audio Player...');

    // Initialize database
    initializeDatabase();
    console.log('✓ Database initialized');

    // Run initial scan
    console.log('Running initial audio scan...');
    const scanResult = await scanAudioFiles();
    console.log(`✓ Initial scan complete: ${scanResult.totalFiles} files found`);

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`  Environment: ${NODE_ENV}`);
      console.log(`  Audio path: ${process.env.AUDIO_PATH || '/audio'}`);
      console.log(`  Database: ${process.env.DB_PATH || '/app/data/sessionaudio.db'}`);
      console.log('');
      console.log('Session Audio Player is ready!');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
