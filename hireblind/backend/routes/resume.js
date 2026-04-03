const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { Candidate, JobDescription, AuditLog } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requireRecruiter = require('../middleware/requireRecruiter');
const { stripPII, resetLetterCounters } = require('../utils/piiStripper');
const { scoreResume, assignRanks } = require('../utils/scoringEngine');

const router = express.Router();

// Multer memory storage config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed.'), false);
    }
  }
});

// ─── Helper: extract text from file buffer ───
async function extractText(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  } else {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}

// ─── Helper: generate unique candidate code ───
function generateCandidateCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randLetter = letters[Math.floor(Math.random() * 26)];
  const randNum = Math.floor(100 + Math.random() * 900);
  return `${randLetter}${randNum}`;
}

// ─── POST /api/resume/upload — Bulk upload resumes (recruiter/admin, scoped to workspace) ───
router.post('/upload', verifyToken, requireRecruiter, upload.array('resumes', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const { job_id } = req.body;
    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required for uploading.' });
    }

    // Verify the job belongs to this workspace
    const targetJob = await JobDescription.findOne({
      where: { id: job_id, workspace_code: req.user.workspace_code }
    });
    if (!targetJob) {
      return res.status(404).json({ error: 'Selected job description not found in your workspace.' });
    }

    const results = [];
    const candidateUpdates = [];

    for (const file of req.files) {
      try {
        // Extract text from file
        const rawText = await extractText(file.buffer, file.mimetype);

        // Generate unique candidate code
        let candidateCode;
        let isUnique = false;
        while (!isUnique) {
          candidateCode = generateCandidateCode();
          const existing = await Candidate.findOne({ where: { candidate_code: candidateCode } });
          if (!existing) isUnique = true;
        }

        // Strip PII
        const { anonymisedText, removedFields } = stripPII(rawText, candidateCode);

        // Log upload
        await AuditLog.create({
          action: 'RESUME_UPLOADED',
          candidate_code: candidateCode,
          performed_by: req.user.id,
          details: `File: ${file.originalname}, Size: ${file.size} bytes`,
          workspace_code: req.user.workspace_code
        });

        // Log PII removal
        for (const field of removedFields) {
          await AuditLog.create({
            action: 'PII_REMOVED',
            candidate_code: candidateCode,
            performed_by: req.user.id,
            details: `${field.field_type}: ${field.count} instance(s) removed`,
            workspace_code: req.user.workspace_code
          });
        }

        // Score the resume
        const { score, explanation } = scoreResume(anonymisedText, targetJob);

        // Create candidate record tagged with workspace
        const candidate = await Candidate.create({
          candidate_code: candidateCode,
          anonymised_text: anonymisedText,
          score,
          explanation: JSON.stringify(explanation),
          job_id: targetJob.id,
          workspace_code: req.user.workspace_code
        });

        candidateUpdates.push({
          id: candidate.id,
          candidate_code: candidateCode,
          score
        });

        results.push({
          filename: file.originalname,
          candidate_code: candidateCode,
          score,
          status: 'success',
          removedFields
        });
      } catch (fileErr) {
        console.error(`Error processing file ${file.originalname}:`, fileErr);
        results.push({
          filename: file.originalname,
          status: 'error',
          error: fileErr.message || 'Failed to process file'
        });
      }
    }

    // Assign ranks to all candidates for this job within this workspace
    const allCandidates = await Candidate.findAll({
      where: { job_id: targetJob.id, workspace_code: req.user.workspace_code },
      order: [['score', 'DESC']]
    });

    for (let i = 0; i < allCandidates.length; i++) {
      await allCandidates[i].update({ rank: i + 1 });
    }

    // Log ranking generation
    await AuditLog.create({
      action: 'RANKING_GENERATED',
      performed_by: req.user.id,
      details: `Ranked ${allCandidates.length} candidates for job: ${targetJob.title}`,
      workspace_code: req.user.workspace_code
    });

    res.json({
      message: `${results.filter(r => r.status === 'success').length} of ${req.files.length} resumes processed successfully.`,
      results
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error during upload.' });
  }
});

module.exports = router;
