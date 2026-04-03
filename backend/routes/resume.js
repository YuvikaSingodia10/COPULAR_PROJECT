const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { pool } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { stripPii, getNextCandidateCode, resetCounters } = require('../utils/piiStripper');
const { scoreResume } = require('../utils/scoringEngine');

const router = express.Router();

// Configure multer: memory storage, 5MB max, PDF/DOCX only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format: ${file.originalname}. Only PDF and DOCX are accepted.`));
    }
  },
});

// POST /api/resume/upload — Recruiter uploads resumes
router.post('/upload', verifyToken, (req, res) => {
  const uploadMultiple = upload.array('resumes', 50);

  uploadMultiple(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 5MB limit.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const files = req.files;

    if (!files || files.length < 1) {
      return res.status(400).json({ error: 'Please upload at least 1 resume file.' });
    }

    try {
      // Fetch latest job description for scoring
      const [jobRows] = await pool.query(
        'SELECT * FROM job_descriptions ORDER BY created_at DESC LIMIT 1'
      );

      if (jobRows.length === 0) {
        return res.status(400).json({
          error: 'No job description found. Admin must create one before uploading resumes.',
        });
      }

      const jobDesc = jobRows[0];
      const results = [];
      const errors = [];

      // Reset PII counters for this batch
      resetCounters();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          let extractedText = '';

          // Parse based on file type
          if (file.mimetype === 'application/pdf') {
            const pdfData = await pdfParse(file.buffer);
            extractedText = pdfData.text;
          } else {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            extractedText = result.value;
          }

          if (!extractedText || extractedText.trim().length === 0) {
            errors.push({
              file: file.originalname,
              error: 'Could not extract text from file. It may be empty or corrupt.',
            });
            continue;
          }

          // Generate candidate code
          const candidateCode = getNextCandidateCode();

          // Strip PII
          const { anonymisedText } = await stripPii(
            extractedText,
            candidateCode,
            req.user.id
          );

          // Score the anonymised resume (now returns confidence too)
          const { score, confidence, explanation } = scoreResume(anonymisedText, jobDesc);

          // Store ONLY anonymised text in DB (never raw PII)
          await pool.query(
            'INSERT INTO candidates (candidate_code, resume_text, score, confidence_score, explanation) VALUES (?, ?, ?, ?, ?)',
            [candidateCode, anonymisedText, score, confidence, JSON.stringify(explanation)]
          );

          // Log the upload
          await pool.query(
            'INSERT INTO audit_logs (action, candidate_code, performed_by, details) VALUES (?, ?, ?, ?)',
            ['RESUME_UPLOADED', candidateCode, req.user.id, `File: ${file.originalname}`]
          );

          // Log ranking generated
          await pool.query(
            'INSERT INTO audit_logs (action, candidate_code, performed_by, details) VALUES (?, ?, ?, ?)',
            [
              'RANKING_GENERATED',
              candidateCode,
              req.user.id,
              JSON.stringify({ score, confidence, skills_in_jd: jobDesc.skills }),
            ]
          );

          results.push({
            file: file.originalname,
            candidateCode,
            score,
            confidence,
            status: 'success',
          });
        } catch (fileErr) {
          console.error(`Error processing ${file.originalname}:`, fileErr);
          errors.push({
            file: file.originalname,
            error: 'Failed to process this file. It may be corrupt or in an unexpected format.',
          });
        }
      }

      res.json({
        message: `Processed ${results.length} resume(s) successfully.`,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (err) {
      console.error('Resume upload error:', err);
      res.status(500).json({ error: 'Internal server error during resume processing.' });
    }
  });
});

module.exports = router;
