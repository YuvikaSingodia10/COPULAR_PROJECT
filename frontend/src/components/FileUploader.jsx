import React, { useState, useCallback } from 'react';

function FileUploader({ files, onAddFiles, onRemoveFile, fileInputRef, uploading, progress, onUpload }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      onAddFiles(e.dataTransfer.files);
    }
  }, [onAddFiles]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      onAddFiles(e.target.files);
    }
    e.target.value = '';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExt = (name) => {
    return name.split('.').pop().toUpperCase();
  };

  return (
    <div>
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon">📁</div>
        <h5>Drop resumes here or click to browse</h5>
        <p>Supports PDF and DOCX files up to 5MB each</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          {files.map((file, index) => (
            <div key={index} className="file-item">
              <div className={`file-icon ${getFileExt(file.name).toLowerCase()}`}>
                {getFileExt(file.name)}
              </div>
              <div className="file-name">{file.name}</div>
              <div className="file-size">{formatSize(file.size)}</div>
              {!uploading && (
                <button
                  className="remove-btn"
                  onClick={(e) => { e.stopPropagation(); onRemoveFile(index); }}
                  title="Remove file"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {uploading && (
            <div className="progress-custom mt-2">
              <div className="progress-bar-custom" style={{ width: `${progress}%` }} />
            </div>
          )}

          <button
            className="btn btn-primary-custom mt-3 w-100"
            onClick={onUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" />
                Uploading & Processing... {progress}%
              </span>
            ) : (
              `🚀 Upload & Process ${files.length} Resume${files.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
