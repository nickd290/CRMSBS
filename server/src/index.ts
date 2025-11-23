import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import gmailRoutes from './routes/gmail';
import aiRoutes from './routes/ai';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`📥 [${requestId}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.get('origin') || 'N/A'}`);
  console.log(`   User-Agent: ${req.get('user-agent')?.substring(0, 50) || 'N/A'}...`);

  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`   Query:`, req.query);
  }

  // Capture the original res.json to log responses
  const originalJson = res.json.bind(res);
  res.json = function(data: any) {
    const duration = Date.now() - start;
    console.log(`📤 [${requestId}] ${res.statusCode} ${req.method} ${req.path} (${duration}ms)`);
    if (res.statusCode >= 400) {
      console.log(`   Response:`, data);
    }
    return originalJson(data);
  };

  // Capture the original res.redirect to log redirects
  const originalRedirect = res.redirect.bind(res);
  res.redirect = function(url: string) {
    const duration = Date.now() - start;
    console.log(`🔄 [${requestId}] REDIRECT ${req.method} ${req.path} → ${url} (${duration}ms)`);
    return originalRedirect(url);
  };

  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRMSBS API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Gmail integration ready`);
});
