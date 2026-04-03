import React from 'react';
import { useDropzone } from 'react-dropzone';

function FileUploader({ onFilesAccepted, multiple = true, accept }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFilesAccepted,
    accept: accept || {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: multiple,
    maxSize: 5 * 1024 * 1024
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone-area ${isDragActive ? 'active' : ''}`}
      id="file-dropzone"
    >
      <input {...getInputProps()} />
      <div className="upload-icon">
        <i className="bi bi-cloud-arrow-up"></i>
      </div>
      {isDragActive ? (
        <div>
          <h5 className="fw-bold text-primary">Drop files here...</h5>
          <p className="text-muted mb-0">Release to upload</p>
        </div>
      ) : (
        <div>
          <h5 className="fw-bold">Drag & drop resumes here</h5>
          <p className="text-muted mb-1">
            or <span className="text-primary fw-medium" style={{ cursor: 'pointer' }}>browse files</span>
          </p>
          <p className="text-muted small mb-0">
            <i className="bi bi-info-circle me-1"></i>
            PDF and DOCX only • Max 5MB per file
            {multiple && ' • Upload multiple files at once'}
          </p>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
