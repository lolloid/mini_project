import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { apiRouter } from './routes/api.js';

const app = express();

// Security: trust proxy if behind reverse proxy
app.set('trust proxy', 1);

// Middleware: CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, server-to-server, mobile apps)
    if (!origin) return callback(null, true);

    // Allow frontend origins (localhost on any dev port or configured origin)
    const allowed = [
      config.clientOrigin,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

    if (allowed.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    return callback(null, true); // Permissive for local student environment
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiter for API protection
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Terlalu banyak permintaan dari alamat IP Anda. Harap tunggu sebentar sebelum mencoba lagi.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

app.use('/api', limiter);

// Mount API routes
app.use('/api', apiRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Findly Search API Server',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      search: 'GET /api/search?q={query}&count={count}',
      download: 'GET /api/download?url={encoded_url}'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' tidak ditemukan.`,
    code: 'NOT_FOUND'
  });
});

// Global error handler (prevents internal stack leaks)
app.use((err, req, res, next) => {
  console.error('[Findly Search Backend Error]:', err);
  res.status(500).json({
    success: false,
    error: 'Terjadi kesalahan sistem internal pada server.',
    code: 'INTERNAL_SERVER_ERROR'
  });
});

// Export app for testing
export { app };
export default app;

// Start server if executed directly
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('server.js')) {
  app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(` Findly Search API Server running on port ${config.port}`);
    console.log(` Health check: http://localhost:${config.port}/api/health`);
    console.log(`====================================================`);
  });
}
