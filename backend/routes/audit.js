const express = require('express');
const { pool } = require('../db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// GET /api/audit — Returns all audit logs, newest first
router.get('/', verifyToken, async (req, res) => {
  try {
    const [logs] = await pool.query(
      `SELECT al.id, al.action, al.candidate_code, al.performed_by, al.timestamp,
              u.email as performed_by_email
       FROM audit_logs al
       LEFT JOIN users u ON al.performed_by = u.id
       ORDER BY al.timestamp DESC`
    );

    res.json(logs);
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
