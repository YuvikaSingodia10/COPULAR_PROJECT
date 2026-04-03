const express = require('express');
const { pool } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// POST /api/job — Admin only: Create a new job description
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, skills, min_experience, role_keywords } = req.body;

    if (!skills || min_experience === undefined || min_experience === null) {
      return res.status(400).json({ error: 'Skills and min_experience are required.' });
    }

    const minExp = parseInt(min_experience, 10);
    if (isNaN(minExp) || minExp < 0) {
      return res.status(400).json({ error: 'min_experience must be a non-negative integer.' });
    }

    await pool.query(
      'INSERT INTO job_descriptions (title, skills, min_experience, role_keywords) VALUES (?, ?, ?, ?)',
      [title || 'Untitled Position', skills, minExp, role_keywords || null]
    );

    res.status(201).json({ message: 'Job description created successfully.' });
  } catch (err) {
    console.error('Job creation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/job — Returns the latest (active) job description
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM job_descriptions ORDER BY created_at DESC LIMIT 1'
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No job description found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch job error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
