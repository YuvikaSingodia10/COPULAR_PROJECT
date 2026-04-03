const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabase } = require('./db');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/job');
const resumeRoutes = require('./routes/resume');
const candidateRoutes = require('./routes/candidates');
const auditRoutes = require('./routes/audit');
const interviewRoutes = require('./routes/interview');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/interviews', interviewRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Start server
async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`HireBlind backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
