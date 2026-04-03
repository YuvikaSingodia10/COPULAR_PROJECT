import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FileUploader from '../components/FileUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

function UploadResume() {
  const { token, workspaceCode } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/job/all`, config);
      setJobs(response.data);
      if (response.data.length > 0) {
        setSelectedJobId(response.data[0].id.toString());
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No active job description found. An administrator must create one first.');
      } else {
        setError('Failed to fetch active job details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilesAccepted = (acceptedFiles) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    setResults(null); 
    setError(null);
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (files.length < 5) {
      setError('Minimum 5 files are required for upload to ensure fair screening.');
      return;
    }
    if (!selectedJobId) {
      setError('Please select a target job position first.');
      return;
    }

    setUploading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('resumes', file);
    });
    formData.append('job_id', selectedJobId);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/resume/upload`, formData, config);
      setResults(response.data);
      setFiles([]); 
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(workspaceCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard-wrapper">
      <div className="page-header">
        <h1>Upload Resumes</h1>
        <p>Batch upload candidate resumes for automated PII stripping and context-aware scoring.</p>
      </div>

      {/* Workspace Code Card for Recruiter */}
      {workspaceCode && (
        <div className="card-custom mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
          <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between p-4">
            <div className="text-white mb-3 mb-md-0">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-key-fill" style={{ fontSize: '1.3rem' }}></i>
                <h5 className="fw-bold mb-0">Your Workspace Code</h5>
              </div>
              <p className="mb-0 opacity-75" style={{ fontSize: '0.9rem' }}>
                Share this code with your administrator so they can view and manage your candidates.
              </p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <span
                className="px-4 py-2 rounded-3 fw-bold"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: '1.5rem',
                  letterSpacing: '3px',
                  border: '2px dashed rgba(255,255,255,0.4)'
                }}
              >
                {workspaceCode}
              </span>
              <button
                className="btn btn-light fw-bold px-3"
                onClick={handleCopyCode}
                style={{ minWidth: '100px' }}
              >
                {copied ? (
                  <><i className="bi bi-check-lg text-success me-1"></i>Copied!</>
                ) : (
                  <><i className="bi bi-clipboard me-1"></i>Copy</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="alert alert-warning py-3">
          <h5 className="alert-heading fw-bold mb-2"><i className="bi bi-exclamation-triangle-fill me-2"></i>No Active Job Found</h5>
          <p className="mb-0">{error || 'Ask your admin to create a job requisition first.'}</p>
        </div>
      ) : (
        <div className="row">
          <div className="col-lg-8 mb-4">
            <div className="card-custom mb-4">
              <div className="card-body">
                <FileUploader 
                  onFilesAccepted={handleFilesAccepted} 
                  multiple={true}
                />

                {files.length > 0 && (
                  <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">Files to Upload ({files.length})</h5>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setFiles([])}>Clear All</button>
                    </div>
                    
                    <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {files.map((file, idx) => (
                        <div key={idx} className="file-progress-item">
                          <div className="d-flex align-items-center gap-2" style={{ width: '40px' }}>
                            <i className={`bi fs-4 text-primary ${file.name.endsWith('.pdf') ? 'bi-file-earmark-pdf' : 'bi-file-earmark-word'}`}></i>
                          </div>
                          <div className="flex-grow-1 text-truncate pe-3">
                            <div className="fw-medium text-truncate">{file.name}</div>
                            <div className="text-muted small">{(file.size / 1024).toFixed(1)} KB</div>
                          </div>
                          <button className="btn btn-sm btn-light text-danger" onClick={() => removeFile(idx)}>
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ))}
                    </div>

                    {error && files.length < 5 && <div className="text-danger small mb-3"><i className="bi bi-exclamation-circle me-1"></i>{error}</div>}

                    <button 
                      className="btn btn-primary w-100 py-2 fw-bold" 
                      onClick={handleUpload}
                      disabled={uploading || files.length === 0}
                    >
                      {uploading ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>Processing & Anonymising...</>
                      ) : (
                        <><i className="bi bi-cloud-arrow-up-fill me-2"></i>Upload {files.length} Files</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && !files.length && (
              <div className="alert alert-danger py-2 mb-4">{error}</div>
            )}

            {results && (
              <div className="card-custom bg-success-subtle border border-success-subtle fade-in">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <div>
                      <h4 className="fw-bold text-success-emphasis mb-1">Upload Complete</h4>
                      <p className="text-success-emphasis mb-0">{results.message}</p>
                    </div>
                  </div>
                  
                  <div className="d-grid mt-4">
                    <Link to="/ranking" className="btn btn-success fw-bold py-2">
                       View Rankings Dashboard <i className="bi bi-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-4 mb-4">
            <div className="card-custom h-100">
              <div className="card-body">
                <h5 className="fw-bold mb-3"><i className="bi bi-briefcase-fill text-primary me-2"></i>Target Job Filter</h5>
                
                <div className="mb-4">
                  <label className="form-label fw-bold">Select Requisition to Score Against:</label>
                  <select 
                    className="form-select bg-light" 
                    value={selectedJobId} 
                    onChange={(e) => setSelectedJobId(e.target.value)}
                  >
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>

                {selectedJobId && jobs.find(j => j.id.toString() === selectedJobId) && (() => {
                  const job = jobs.find(j => j.id.toString() === selectedJobId);
                  return (
                    <div className="bg-light p-3 rounded-3 mb-4 border fade-in">
                      <h5 className="fw-bold text-dark mb-1">{job.title}</h5>
                      <p className="text-muted small mb-3">Min Experience: {job.min_experience} years</p>
                      
                      <h6 className="fw-semibold small text-uppercase text-muted mb-2">Required Skills</h6>
                      <div className="d-flex flex-wrap gap-1">
                        {job.skills.split(',').map((skill, idx) => (
                          <span key={idx} className="badge bg-primary text-white fw-normal">{skill.trim()}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                <h5 className="fw-bold mb-3"><i className="bi bi-shield-check text-success me-2"></i>Anonymisation Process</h5>
                <ul className="text-muted small ps-3 mb-0" style={{ lineHeight: '1.8' }}>
                  <li>Extracts raw text securely</li>
                  <li>Strips all PII (names, emails, phones, links)</li>
                  <li>Redacts university / college names</li>
                  <li>Removes location data and personal identifiers</li>
                  <li>Scores against target job automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadResume;
