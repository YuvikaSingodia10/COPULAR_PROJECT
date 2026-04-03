const express = require('express');
const { JobDescription, AuditLog } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// ─── POST /api/job — Create job description (admin only) ───
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, skills, min_experience } = req.body;

    if (!title || !skills || min_experience === undefined) {
      return res.status(400).json({ error: 'Title, skills, and min_experience are required.' });
    }

    const job = await JobDescription.create({
      title,
      skills,
      min_experience: parseInt(min_experience, 10),
      is_active: true,
      created_by: req.user.id,
      workspace_code: req.user.workspace_code
    });

    await AuditLog.create({
      action: 'JOB_CREATED',
      performed_by: req.user.id,
      details: `Job "${title}" created with skills: ${skills}, min exp: ${min_experience} years`,
      workspace_code: req.user.workspace_code
    });

    res.status(201).json({ message: 'Job description created.', job });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Server error creating job.' });
  }
});

// ─── GET /api/job — Get latest active job (scoped to workspace) ───
router.get('/', verifyToken, async (req, res) => {
  try {
    const job = await JobDescription.findOne({
      where: { is_active: true, workspace_code: req.user.workspace_code },
      order: [['created_at', 'DESC']]
    });

    if (!job) {
      return res.status(404).json({ error: 'No active job found.' });
    }

    res.json(job);
  } catch (err) {
    console.error('Get job error:', err);
    res.status(500).json({ error: 'Server error fetching job.' });
  }
});

// ─── GET /api/job/all — Get all active jobs (scoped to workspace) ───
router.get('/all', verifyToken, async (req, res) => {
  try {
    const jobs = await JobDescription.findAll({
      where: { is_active: true, workspace_code: req.user.workspace_code },
      order: [['created_at', 'DESC']]
    });
    res.json(jobs);
  } catch (err) {
    console.error('Get all jobs error:', err);
    res.status(500).json({ error: 'Server error fetching jobs.' });
  }
});

// ─── PUT /api/job/:id — Update job description (admin only, scoped to workspace) ───
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, skills, min_experience, is_active } = req.body;
    const job = await JobDescription.findOne({
      where: { id: req.params.id, workspace_code: req.user.workspace_code }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    await job.update({
      title: title || job.title,
      skills: skills || job.skills,
      min_experience: min_experience !== undefined ? parseInt(min_experience, 10) : job.min_experience,
      is_active: is_active !== undefined ? is_active : job.is_active
    });

    res.json({ message: 'Job updated.', job });
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ error: 'Server error updating job.' });
  }
});

module.exports = router;
