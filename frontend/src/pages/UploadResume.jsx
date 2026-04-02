import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import FileUploader from '../components/FileUploader';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function UploadResume({ user }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const headers = { Authorization: `Bearer ${user.token}` };

  const addFiles = useCallback((newFiles) => {
    const validFiles = Array.from(newFiles).filter((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx'].includes(ext)) return false;
      if (file.size > 5 * 1024 * 1024) return false;
      return true;
    });
    setFiles((prev) => [...prev, ...validFiles]);
    setError('');
    setResults(null);
  }, []);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length < 1) {
      setError('Please add at least 1 resume file.');
      return;
    }

    setUploading(true);
    setError('');
    setResults(null);
    setProgress(0);

    const formData = new FormData();
    files.forEach((file) => formData.append('resumes', file));

    try {
      const res = await axios.post(`${API}/resume/upload`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(pct);
        },
      });

      setResults(res.data);
      setFiles([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="gradient-text">Upload Resumes</span>
        </h1>
        <p className="page-subtitle">
          Upload PDF or DOCX resumes for bias-free screening
        </p>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <FileUploader
            files={files}
            onAddFiles={addFiles}
            onRemoveFile={removeFile}
            fileInputRef={fileInputRef}
            uploading={uploading}
            progress={progress}
            onUpload={handleUpload}
          />

          {error && (
            <div className="alert-custom alert-danger-custom mt-3">
              {error}
            </div>
          )}

          {results && (
            <div className="glass-card mt-3" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>
                ✅ Upload Results
              </h5>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {results.message}
              </p>

              {results.results && results.results.length > 0 && (
                <div className="mb-3">
                  {results.results.map((r, i) => (
                    <div key={i} className="file-item" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                      <div className="file-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                        ✓
                      </div>
                      <div className="file-name">{r.file}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.candidateCode}</span>
                        <span className="explanation-tag matched" style={{ margin: 0 }}>
                          Score: {r.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.errors && results.errors.length > 0 && (
                <div>
                  <h6 style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
                    Failed Files:
                  </h6>
                  {results.errors.map((e, i) => (
                    <div key={i} className="file-item" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                      <div className="file-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
                        ✗
                      </div>
                      <div className="file-name">{e.file}</div>
                      <div style={{ color: '#f87171', fontSize: '0.8rem' }}>{e.error}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="glass-card">
            <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>
              📌 Upload Guidelines
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { icon: '📄', text: 'Accepted formats: PDF, DOCX' },
                { icon: '📏', text: 'Max file size: 5MB per file' },
                { icon: '📊', text: 'Upload multiple files at once' },
                { icon: '🔒', text: 'PII is automatically stripped' },
                { icon: '🏆', text: 'Files are scored instantly' },
              ].map((item, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 0',
                  borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card mt-3">
            <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>
              🛡️ Privacy Guarantee
            </h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              All personally identifiable information (PII) including names, emails, 
              phone numbers, addresses, and social media links are automatically 
              removed before scoring. Recruiters never see the original data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadResume;
