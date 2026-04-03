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
      'SELECT id, candidate_code, score, confidence_score, status, explanation, created_at FROM candidates ORDER BY score DESC'
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

// PATCH /api/candidates/:code/status — Update candidate status (shortlist/accept/reject)
router.patch('/:code/status', verifyToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'shortlisted', 'accepted', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    // Check candidate exists
    const [existing] = await pool.query('SELECT id, status FROM candidates WHERE candidate_code = ?', [code]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const previousStatus = existing[0].status;

    await pool.query('UPDATE candidates SET status = ? WHERE candidate_code = ?', [status, code]);

    // Log the status change
    await pool.query(
      'INSERT INTO audit_logs (action, candidate_code, performed_by, details) VALUES (?, ?, ?, ?)',
      [
        `STATUS_CHANGED`,
        code,
        req.user.id,
        JSON.stringify({ from: previousStatus, to: status }),
      ]
    );

    res.json({ message: `Candidate ${code} status updated to ${status}.`, status });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/candidates/:code/override — Submit ranking override with justification
router.post('/:code/override', verifyToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { original_rank, new_rank, justification } = req.body;

    if (!justification || justification.trim().length < 10) {
      return res.status(400).json({
        error: 'A written justification of at least 10 characters is required for any ranking override.',
      });
    }

    if (!original_rank || !new_rank) {
      return res.status(400).json({ error: 'original_rank and new_rank are required.' });
    }

    // Check candidate exists
    const [existing] = await pool.query('SELECT id FROM candidates WHERE candidate_code = ?', [code]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    // Store the override
    await pool.query(
      'INSERT INTO overrides (candidate_code, original_rank, new_rank, justification, performed_by) VALUES (?, ?, ?, ?, ?)',
      [code, original_rank, new_rank, justification.trim(), req.user.id]
    );

    // Log to audit trail
    await pool.query(
      'INSERT INTO audit_logs (action, candidate_code, performed_by, details) VALUES (?, ?, ?, ?)',
      [
        'RANKING_OVERRIDE',
        code,
        req.user.id,
        JSON.stringify({
          original_rank,
          new_rank,
          justification: justification.trim(),
        }),
      ]
    );

    res.json({
      message: 'Override recorded. This action has been logged in the audit trail.',
      override: { candidate_code: code, original_rank, new_rank },
    });
  } catch (err) {
    console.error('Override error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/candidates/overrides — Get all overrides (admin only)
router.get('/overrides/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [overrides] = await pool.query(
      `SELECT o.*, u.email as performed_by_email 
       FROM overrides o 
       LEFT JOIN users u ON o.performed_by = u.id 
       ORDER BY o.created_at DESC`
    );
    res.json(overrides);
  } catch (err) {
    console.error('Overrides fetch error:', err);
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
      'INSERT INTO audit_logs (action, candidate_code, performed_by, details) VALUES (?, ?, ?, ?)',
      ['IDENTITY_REVEALED', code, req.user.id, 'Identity revealed by admin']
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
