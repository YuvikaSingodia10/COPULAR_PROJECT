import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function RevealModal({ show, onClose, onConfirm, candidate }) {
  return (
    <Modal show={show} onHide={onClose} centered className="modal-dark">
      <Modal.Header closeButton>
        <Modal.Title>⚠️ Reveal Identity</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔓</div>
          <h5 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>
            This will expose candidate identity
          </h5>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            You are about to reveal the real identity of{' '}
            <strong style={{ color: 'var(--warning)' }}>
              {candidate?.candidate_code}
            </strong>.
            This action will be logged in the audit trail and cannot be undone.
          </p>
          <div className="alert-custom alert-warning-custom mt-3" style={{ textAlign: 'left' }}>
            <strong>⚠️ Warning:</strong> Revealing identity may introduce bias into the 
            screening process. Only proceed if absolutely necessary.
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          Cancel
        </Button>
        <Button
          variant="warning"
          onClick={onConfirm}
          style={{
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: 'var(--warning)',
            fontWeight: 600,
          }}
        >
          👁️ Confirm Reveal
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RevealModal;
