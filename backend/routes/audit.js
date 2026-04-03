const express = require('express');
const { AuditLog, User } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// ─── GET /api/audit — Get audit logs (scoped to workspace) ───
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      where: { workspace_code: req.user.workspace_code },
      order: [['timestamp', 'DESC']],
      include: [{
        model: User,
        as: 'performer',
        attributes: ['name', 'email', 'role']
      }]
    });

    const formatted = logs.map(log => {
      const plain = log.get({ plain: true });
      return {
        id: plain.id,
        action: plain.action,
        candidate_code: plain.candidate_code,
        performed_by: plain.performer ? plain.performer.name : 'System',
        performer_role: plain.performer ? plain.performer.role : 'system',
        details: plain.details,
        timestamp: plain.timestamp
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ error: 'Server error fetching audit logs.' });
  }
});

// ─── GET /api/audit/stats — Aggregate analytics (scoped to workspace) ───
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const wsFilter = { workspace_code: req.user.workspace_code };

    const totalUploads = await AuditLog.count({ where: { ...wsFilter, action: 'RESUME_UPLOADED' } });
    const totalPIIRemoved = await AuditLog.count({ where: { ...wsFilter, action: 'PII_REMOVED' } });
    const totalReveals = await AuditLog.count({ where: { ...wsFilter, action: 'IDENTITY_REVEALED' } });
    const totalCalls = await AuditLog.count({ where: { ...wsFilter, action: 'CANDIDATE_CALLED' } });
    const totalEmails = await AuditLog.count({ where: { ...wsFilter, action: 'EMAIL_DISPATCHED' } });

    res.json({
      totalUploads,
      totalPIIRemoved,
      totalReveals,
      totalCalls,
      totalEmails
    });
  } catch (err) {
    console.error('Audit stats error:', err);
    res.status(500).json({ error: 'Server error fetching stats.' });
  }
});

module.exports = router;
