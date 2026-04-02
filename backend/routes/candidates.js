const express = require('express');
const { pool } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');
const { getOriginalPii } = require('../utils/piiStripper');

const router = express.Router();

// GET /api/candidates/rank — Returns all candidates sorted by score descending
router.get('/rank', verifyToken, async (req, res) => {
  try {
    const [candidates] = await pool.query(
      'SELECT id, candidate_code, score, explanation, created_at FROM candidates ORDER BY score DESC'
    );

    // Assign dynamic ranks
    const ranked = candidates.map((c, index) => ({
      ...c,
      rank: index + 1,
      explanation: typeof c.explanation === 'string' ? JSON.parse(c.explanation) : c.explanation,
    }));

    res.json(ranked);
  } catch (err) {
    console.error('Ranking error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/candidates/:code/reveal — Admin only: reveal candidate identity
router.post('/:code/reveal', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;

    // Get original PII from in-memory store
    const pii = getOriginalPii(code);

    if (!pii) {
      return res.status(404).json({
        error: 'Original identity data not available. It may have been cleared from server memory.',
      });
    }

    // Log the reveal action
    await pool.query(
      'INSERT INTO audit_logs (action, candidate_code, performed_by) VALUES (?, ?, ?)',
      ['IDENTITY_REVEALED', code, req.user.id]
    );

    res.json({
      candidateCode: code,
      name: pii.name || 'Not detected',
      email: pii.email || 'Not detected',
      phone: pii.phone || 'Not detected',
    });
  } catch (err) {
    console.error('Reveal error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
