require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ─── Security Headers ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,          // Netlify production URL (set in Render env vars)
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, mobile, etc.)
    if (!origin) return callback(null, true);
    // Allow any Netlify subdomain
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));

// ─── Database ─────────────────────────────────────────────────────────────────
const isMockMode = process.env.MOCK_DATABASE === 'true';

if (isMockMode) {
  console.log('🏗️  Running in MOCK DATABASE mode (In-Memory)');
} else {
  mongoose.set('bufferCommands', false);
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000
  })
    .then(() => console.log('✅ MongoDB Atlas connected'))
    .catch(err => {
      console.error('❌ MongoDB connection error: ' + err.message);
      console.log('💡 TIP: Whitelist 0.0.0.0/0 on MongoDB Atlas for cloud deployment.');
    });
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/payment',  require('./routes/payment'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'SS Dairy Products API is running 🧈', version: '1.0.0', mode: isMockMode ? 'mock' : 'live' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'SS Dairy Products API is running 🧈', version: '1.0.0', mode: isMockMode ? 'mock' : 'live' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: isProduction ? 'Internal server error' : err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (!isProduction) console.log(`🌐 Open http://localhost:${PORT} in your browser`);
  console.log(`📦 Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} | DB: ${isMockMode ? 'MOCK' : 'ATLAS'}`);
});

