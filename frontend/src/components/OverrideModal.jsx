import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

function OverrideModal({ show, onClose, onConfirm, candidate }) {
  const [justification, setJustification] = useState('');
  const [newRank, setNewRank] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!justification || justification.trim().length < 10) {
      setError('Please provide a detailed justification (at least 10 characters). This is required for compliance.');
      return;
    }
    if (!newRank || isNaN(parseInt(newRank))) {
      setError('Please specify a valid new rank position.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onConfirm({
        candidate_code: candidate?.candidate_code,
        original_rank: candidate?.rank,
        new_rank: parseInt(newRank),
        justification: justification.trim(),
      });
      setJustification('');
      setNewRank('');
    } catch (err) {
      setError(err.message || 'Failed to submit override.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setJustification('');
    setNewRank('');
    setError('');
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered className="modal-dark">
      <Modal.Header closeButton>
        <Modal.Title>🚩 Override Ranking</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
            Bias Detection Override
          </h5>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            You are overriding the AI ranking for{' '}
            <strong style={{ color: 'var(--warning)' }}>
              {candidate?.candidate_code}
            </strong>{' '}
            (currently ranked #{candidate?.rank}).
          </p>
        </div>

        <div className="alert-custom alert-danger-custom mb-3" style={{ textAlign: 'left' }}>
          <strong>⚠️ Accountability Notice:</strong> This override will be permanently
          logged in the audit trail with your identity, timestamp, and justification.
          Patterns of overrides may be reviewed for bias compliance.
        </div>

        {error && (
          <div className="alert-custom alert-danger-custom mb-3" style={{ fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label-dark" htmlFor="override-new-rank">
            New Rank Position
          </label>
          <input
            id="override-new-rank"
            type="number"
            className="form-control form-control-dark"
            placeholder="e.g. 1"
            value={newRank}
            onChange={(e) => setNewRank(e.target.value)}
            min="1"
          />
        </div>

        <div className="mb-3">
          <label className="form-label-dark" htmlFor="override-justification">
            Written Justification <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <textarea
            id="override-justification"
            className="form-control form-control-dark"
            rows="4"
            placeholder="Explain why this candidate's ranking should be changed. Be specific about skills, qualifications, or factors that justify this override..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            style={{ resize: 'vertical', minHeight: '100px' }}
          />
          <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Minimum 10 characters. This justification is permanently recorded.
          </small>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={submitting}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontWeight: 600,
          }}
        >
          {submitting ? (
            <span className="d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm" />
              Submitting...
            </span>
          ) : (
            '🚩 Confirm Override'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default OverrideModal;
