const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/job');
const resumeRoutes = require('./routes/resume');
const candidatesRoutes = require('./routes/candidates');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/audit', auditRoutes);

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handling Middleware ───
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }
  if (err.message === 'Only PDF and DOCX files are allowed.') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start Server ───
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Disable FK checks for SQLite ALTER TABLE compatibility
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    await sequelize.sync({ alter: true });
    await sequelize.query('PRAGMA foreign_keys = ON;');
    console.log('✅ Database tables synced.');

    app.listen(PORT, () => {
      console.log(`🚀 HireBlind server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Unable to start server:', err);
    process.exit(1);
  }
}

startServer();
