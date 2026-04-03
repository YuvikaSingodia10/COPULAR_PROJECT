const express = require('express');
const { Candidate, AuditLog, Application } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');
const requireRecruiter = require('../middleware/requireRecruiter');
const { getOriginalData } = require('../utils/piiStripper');

const router = express.Router();

// In-memory interview schedule store
const interviewSchedules = new Map();

// ─── GET /api/candidates/rank — Get ranked candidates (scoped to workspace) ───
router.get('/rank', verifyToken, requireRecruiter, async (req, res) => {
  try {
    const { job_id } = req.query;
    let whereClause = { workspace_code: req.user.workspace_code };
    if (job_id && job_id !== 'all') {
      whereClause.job_id = parseInt(job_id, 10);
    }

    const candidates = await Candidate.findAll({
      where: whereClause,
      order: [['rank', 'ASC']],
      attributes: ['id', 'candidate_code', 'anonymised_text', 'score', 'rank', 'explanation', 'job_id', 'override_reason', 'created_at']
    });

    const parsed = candidates.map(c => {
      const plain = c.get({ plain: true });
      let explanation = plain.explanation;
      if (typeof explanation === 'string') {
        try { explanation = JSON.parse(explanation); } catch (e) { explanation = []; }
      }
      return {
        ...plain,
        explanation,
        interview: interviewSchedules.get(plain.candidate_code) || null
      };
    });

    res.json(parsed);
  } catch (err) {
    console.error('Rank error:', err);
    res.status(500).json({ error: 'Server error fetching rankings.' });
  }
});

// ─── POST /api/candidates/:code/reveal — Reveal identity (admin only, scoped) ───
router.post('/:code/reveal', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const candidate = await Candidate.findOne({
      where: { candidate_code: code, workspace_code: req.user.workspace_code }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found in your workspace.' });
    }

    const originalData = getOriginalData(code);
    if (!originalData) {
      return res.status(404).json({
        error: 'Original data not available. Data may have been cleared from memory.',
        fallback: { name: 'Data unavailable', email: 'Data unavailable', phone: 'Data unavailable' }
      });
    }

    // Log the reveal action
    await AuditLog.create({
      action: 'IDENTITY_REVEALED',
      candidate_code: code,
      performed_by: req.user.id,
      details: `Identity revealed for candidate ${code}`,
      workspace_code: req.user.workspace_code
    });

    res.json({
      candidate_code: code,
      originalName: originalData.originalName,
      originalEmail: originalData.originalEmail,
      originalPhone: originalData.originalPhone
    });
  } catch (err) {
    console.error('Reveal error:', err);
    res.status(500).json({ error: 'Server error revealing identity.' });
  }
});

// ─── PUT /api/candidates/:code/override — Override rank (admin only, scoped) ───
router.put('/:code/override', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const { new_rank, reason } = req.body;

    if (!new_rank || !reason) {
      return res.status(400).json({ error: 'new_rank and reason are required.' });
    }

    const candidate = await Candidate.findOne({
      where: { candidate_code: code, workspace_code: req.user.workspace_code }
    });
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found in your workspace.' });
    }

    const oldRank = candidate.rank;
    await candidate.update({
      rank: parseInt(new_rank, 10),
      override_reason: reason
    });

    // Log the override
    await AuditLog.create({
      action: 'RANK_OVERRIDDEN',
      candidate_code: code,
      performed_by: req.user.id,
      details: `Rank changed from ${oldRank} to ${new_rank}. Reason: ${reason}`,
      workspace_code: req.user.workspace_code
    });

    res.json({ message: 'Rank overridden successfully.', candidate });
  } catch (err) {
    console.error('Override error:', err);
    res.status(500).json({ error: 'Server error overriding rank.' });
  }
});

// ─── PUT /api/candidates/:code/status — Update candidate status (admin only, scoped) ───
router.put('/:code/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const { status } = req.body;

    const validStatuses = ['under_review', 'shortlisted', 'not_selected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    // Verify candidate belongs to this workspace
    const candidate = await Candidate.findOne({
      where: { candidate_code: code, workspace_code: req.user.workspace_code }
    });
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found in your workspace.' });
    }

    const application = await Application.findOne({ where: { candidate_code: code } });
    if (!application) {
      return res.status(404).json({ error: 'Application not found for this candidate code.' });
    }

    await application.update({ status });

    await AuditLog.create({
      action: 'STATUS_UPDATED',
      candidate_code: code,
      performed_by: req.user.id,
      details: `Application status updated to ${status}`,
      workspace_code: req.user.workspace_code
    });

    if (status === 'shortlisted') {
      await AuditLog.create({
        action: 'EMAIL_DISPATCHED',
        candidate_code: code,
        performed_by: req.user.id,
        details: `Simulated automated interview invitation dispatched securely to [HIDDEN EMAIL]`,
        workspace_code: req.user.workspace_code
      });
    }

    res.json({ message: 'Status updated.', application });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Server error updating status.' });
  }
});

// ─── POST /api/candidates/:code/schedule — Schedule interview (scoped) ───
router.post('/:code/schedule', verifyToken, requireRecruiter, async (req, res) => {
  try {
    const { code } = req.params;
    const { date, time, notes } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required.' });
    }

    const candidate = await Candidate.findOne({
      where: { candidate_code: code, workspace_code: req.user.workspace_code }
    });
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found in your workspace.' });
    }

    interviewSchedules.set(code, { date, time, notes: notes || '', scheduledBy: req.user.name });

    await AuditLog.create({
      action: 'INTERVIEW_SCHEDULED',
      candidate_code: code,
      performed_by: req.user.id,
      details: `Interview scheduled for ${date} at ${time}`,
      workspace_code: req.user.workspace_code
    });

    res.json({ message: 'Interview scheduled.', schedule: interviewSchedules.get(code) });
  } catch (err) {
    console.error('Schedule error:', err);
    res.status(500).json({ error: 'Server error scheduling interview.' });
  }
});

// ─── POST /api/candidates/:code/log-call — Log phone call (admin only, scoped) ───
router.post('/:code/log-call', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;

    // Verify candidate belongs to this workspace
    const candidate = await Candidate.findOne({
      where: { candidate_code: code, workspace_code: req.user.workspace_code }
    });
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found in your workspace.' });
    }

    await AuditLog.create({
      action: 'CANDIDATE_CALLED',
      candidate_code: code,
      performed_by: req.user.id,
      details: `Admin initiated a phone call to candidate ${code}`,
      workspace_code: req.user.workspace_code
    });

    res.json({ message: 'Call logged successfully.' });
  } catch (err) {
    console.error('Call log error:', err);
    res.status(500).json({ error: 'Server error logging call.' });
  }
});

module.exports = router;
