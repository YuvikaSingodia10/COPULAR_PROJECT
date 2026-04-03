import React from 'react';

function RevealModal({ show, onClose, onConfirm, revealedData, candidateCode, onCallInitiated }) {
  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} id="reveal-modal">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-shield-exclamation text-warning me-2"></i>
              Reveal Identity
            </h5>
            <button type="button" className="btn-close" onClick={onClose} id="reveal-modal-close"></button>
          </div>
          <div className="modal-body">
            {!revealedData ? (
              <div>
                <div className="alert alert-warning d-flex align-items-start">
                  <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                  <div>
                    <strong>This action is permanent and logged.</strong>
                    <p className="mb-0 mt-1">
                      You are about to reveal the real identity of <strong>{candidateCode}</strong>.
                      This action will be recorded in the audit log and cannot be undone.
                    </p>
                  </div>
                </div>
                <p className="text-muted">Are you sure you want to proceed?</p>
              </div>
            ) : (
              <div className="fade-in">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-person-check text-success me-2"></i>
                  Identity for {candidateCode}
                </h6>
                <div className="card-custom">
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="text-muted small text-uppercase fw-semibold">Full Name</label>
                      <div className="fw-bold fs-5">{revealedData.originalName}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small text-uppercase fw-semibold">Email</label>
                      <div className="fw-medium">{revealedData.originalEmail}</div>
                    </div>
                    <div>
                      <label className="text-muted small text-uppercase fw-semibold">Phone</label>
                      <div className="fw-medium">{revealedData.originalPhone}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            {!revealedData ? (
              <>
                <button className="btn btn-outline-secondary" onClick={onClose} id="reveal-cancel-btn">
                  Cancel
                </button>
                <button className="btn btn-warning" onClick={onConfirm} id="reveal-confirm-btn">
                  <i className="bi bi-eye me-1"></i>Confirm Reveal
                </button>
              </>
            ) : (
              <>
                <a
                  href={`tel:${revealedData.originalPhone && revealedData.originalPhone.replace(/[^0-9+]/g, '')}`}
                  className={`btn btn-success ${(!revealedData.originalPhone || revealedData.originalPhone === 'Unknown' || revealedData.originalPhone === 'Data unavailable') && 'disabled'}`}
                  onClick={() => {
                    if (onCallInitiated) onCallInitiated(candidateCode);
                  }}
                  id="reveal-call-btn"
                >
                  <i className="bi bi-telephone-fill me-1"></i>Call Candidate
                </a>
                <button className="btn btn-primary ms-2" onClick={onClose} id="reveal-done-btn">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevealModal;
