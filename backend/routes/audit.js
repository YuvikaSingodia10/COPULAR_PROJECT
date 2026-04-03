const express = require('express');
const { pool } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// GET /api/audit — Returns all audit logs, newest first
router.get('/', verifyToken, async (req, res) => {
  try {
    const [logs] = await pool.query(
      `SELECT al.id, al.action, al.candidate_code, al.details, al.performed_by, al.timestamp,
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

// GET /api/audit/compliance-report — Generate EU AI Act transparency report
router.get('/compliance-report', verifyToken, requireAdmin, async (req, res) => {
  try {
    // 1. PII Removal Summary
    const [piiLogs] = await pool.query(
      `SELECT candidate_code, action, timestamp 
       FROM audit_logs 
       WHERE action LIKE 'PII_REMOVED%' 
       ORDER BY timestamp ASC`
    );

    // Group PII removals by candidate
    const piiByCandidate = {};
    for (const log of piiLogs) {
      if (!piiByCandidate[log.candidate_code]) {
        piiByCandidate[log.candidate_code] = [];
      }
      piiByCandidate[log.candidate_code].push({
        field: log.action.replace('PII_REMOVED: ', ''),
        timestamp: log.timestamp,
      });
    }

    // 2. Scoring Criteria
    const [jobRows] = await pool.query(
      'SELECT * FROM job_descriptions ORDER BY created_at DESC LIMIT 1'
    );

    // 3. All candidates with scores and confidence
    const [candidates] = await pool.query(
      'SELECT candidate_code, score, confidence_score, status, created_at FROM candidates ORDER BY score DESC'
    );

    // 4. All overrides
    const [overrides] = await pool.query(
      `SELECT o.*, u.email as performed_by_email 
       FROM overrides o 
       LEFT JOIN users u ON o.performed_by = u.id 
       ORDER BY o.created_at DESC`
    );

    // 5. Identity reveals
    const [reveals] = await pool.query(
      `SELECT al.candidate_code, al.timestamp, u.email as performed_by_email
       FROM audit_logs al
       LEFT JOIN users u ON al.performed_by = u.id
       WHERE al.action = 'IDENTITY_REVEALED'
       ORDER BY al.timestamp DESC`
    );

    // 6. Status changes
    const [statusChanges] = await pool.query(
      `SELECT al.candidate_code, al.details, al.timestamp, u.email as performed_by_email
       FROM audit_logs al
       LEFT JOIN users u ON al.performed_by = u.id
       WHERE al.action = 'STATUS_CHANGED'
       ORDER BY al.timestamp DESC`
    );

    // 7. Total audit event count
    const [totalEvents] = await pool.query('SELECT COUNT(*) as count FROM audit_logs');

    const report = {
      report_title: 'EU AI Act Transparency Report — HireBlind Screening Session',
      generated_at: new Date().toISOString(),
      system_info: {
        system_name: 'HireBlind — Bias-Free Resume Screening',
        ai_act_classification: 'High-Risk AI System (Annex III — Employment & HR)',
        compliance_articles: ['Article 13 — Transparency', 'Article 14 — Human Oversight', 'Article 22 — No Automated Decisions'],
        pii_protection: 'All PII stripped before recruiter access per GDPR & EU Anti-Discrimination Law',
        human_in_the_loop: 'All decisions require explicit human action — no automated accept/reject',
      },
      scoring_criteria: jobRows.length > 0 ? {
        job_title: jobRows[0].title || 'Untitled Position',
        required_skills: jobRows[0].skills,
        minimum_experience: `${jobRows[0].min_experience} years`,
        role_keywords: jobRows[0].role_keywords || 'Auto-detected from job title',
        scoring_methodology: {
          skills_match: 'Each required skill found in resume = +2 points',
          experience: `Meeting ${jobRows[0].min_experience}+ years = +3 points`,
          role_relevance: 'Career trajectory alignment with role = up to +5 points',
          bonus_skills: 'Additional relevant skills = +1 point each (max 5)',
          confidence_score: 'Weighted average: Skills 50% + Experience 20% + Role Relevance 30%',
        },
      } : null,
      pii_removal_summary: {
        total_candidates_processed: Object.keys(piiByCandidate).length,
        total_fields_removed: piiLogs.length,
        by_candidate: piiByCandidate,
      },
      ranking_results: candidates.map((c, i) => ({
        rank: i + 1,
        candidate_code: c.candidate_code,
        score: c.score,
        confidence_score: c.confidence_score,
        status: c.status,
        processed_at: c.created_at,
      })),
      overrides: {
        total: overrides.length,
        records: overrides.map(o => ({
          candidate_code: o.candidate_code,
          original_rank: o.original_rank,
          new_rank: o.new_rank,
          justification: o.justification,
          performed_by: o.performed_by_email,
          timestamp: o.created_at,
        })),
      },
      identity_reveals: {
        total: reveals.length,
        records: reveals,
      },
      status_decisions: {
        total: statusChanges.length,
        records: statusChanges.map(sc => ({
          candidate_code: sc.candidate_code,
          details: sc.details ? JSON.parse(sc.details) : null,
          performed_by: sc.performed_by_email,
          timestamp: sc.timestamp,
        })),
      },
      total_audit_events: totalEvents[0].count,
    };

    res.json(report);
  } catch (err) {
    console.error('Compliance report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
