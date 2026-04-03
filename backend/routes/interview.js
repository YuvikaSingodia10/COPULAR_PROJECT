const express = require('express');
const { pool } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// POST /api/interviews — Schedule an interview
router.post('/', verifyToken, async (req, res) => {
  try {
    const { candidate_code, interview_date, interview_time, notes } = req.body;

    if (!candidate_code || !interview_date || !interview_time) {
      return res.status(400).json({ error: 'candidate_code, interview_date, and interview_time are required.' });
    }

    // Verify candidate exists and is shortlisted
    const [candidates] = await pool.query(
      'SELECT id, status FROM candidates WHERE candidate_code = ?',
      [candidate_code]
    );

    if (candidates.length === 0) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    if (candidates[0].status !== 'shortlisted' && candidates[0].status !== 'accepted') {
      return res.status(400).json({
        error: 'Only shortlisted or accepted candidates can be scheduled for interviews.',
      });
    }

    // Check for conflicting interviews
    const [conflicts] = await pool.query(
      'SELECT id FROM interviews WHERE interview_date = ? AND interview_time = ? AND status != ?',
      [interview_date, interview_time, 'cancelled']
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'This time slot already has a scheduled interview.' });
    }

    await pool.query(
      'INSERT INTO interviews (candidate_code, interview_date, interview_time, notes, created_by) VALUES (?, ?, ?, ?, ?)',
      [candidate_code, interview_date, interview_time, notes || null, req.user.id]
    );

    // Log the scheduling
    await pool.query(
      'INSERT INTO audit_logs (action, candidate_code, performed_by, details) VALUES (?, ?, ?, ?)',
      [
        'INTERVIEW_SCHEDULED',
        candidate_code,
        req.user.id,
        JSON.stringify({ date: interview_date, time: interview_time }),
      ]
    );

    res.status(201).json({ message: `Interview scheduled for ${candidate_code}.` });
  } catch (err) {
    console.error('Interview scheduling error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/interviews — List all interviews
router.get('/', verifyToken, async (req, res) => {
  try {
    const [interviews] = await pool.query(
      `SELECT i.*, c.score, c.confidence_score, c.status as candidate_status
       FROM interviews i
       LEFT JOIN candidates c ON i.candidate_code = c.candidate_code
       ORDER BY i.interview_date ASC, i.interview_time ASC`
    );

    res.json(interviews);
  } catch (err) {
    console.error('Interview list error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/interviews/:id — Update interview status/notes
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const [existing] = await pool.query('SELECT * FROM interviews WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const updates = [];
    const values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided.' });
    }

    values.push(id);
    await pool.query(`UPDATE interviews SET ${updates.join(', ')} WHERE id = ?`, values);

    // Log the update
    await pool.query(
      'INSERT INTO audit_logs (action, candidate_code, performed_by, details) VALUES (?, ?, ?, ?)',
      [
        'INTERVIEW_UPDATED',
        existing[0].candidate_code,
        req.user.id,
        JSON.stringify({ status, notes: notes ? 'updated' : undefined }),
      ]
    );

    res.json({ message: 'Interview updated successfully.' });
  } catch (err) {
    console.error('Interview update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/interviews/:id — Cancel an interview
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM interviews WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    await pool.query('UPDATE interviews SET status = ? WHERE id = ?', ['cancelled', id]);

    await pool.query(
      'INSERT INTO audit_logs (action, candidate_code, performed_by, details) VALUES (?, ?, ?, ?)',
      ['INTERVIEW_CANCELLED', existing[0].candidate_code, req.user.id, 'Interview cancelled']
    );

    res.json({ message: 'Interview cancelled.' });
  } catch (err) {
    console.error('Interview cancel error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
