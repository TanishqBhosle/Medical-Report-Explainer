import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import type { JobStatus } from '../types';
import { UploadCloud, FileText, AlertCircle, X, ArrowRight, Loader2 } from 'lucide-react';

interface UploadPageProps {
  onProcessingComplete: (reportId: string) => void;
  onCancel: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onProcessingComplete, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentDate, setDocumentDate] = useState<string>('');
  const [consent, setConsent] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    setError(null);
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const ext = f.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(ext)) {
      setError('Please upload a PDF document, or PNG/JPG image file.');
      return;
    }

    if (f.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15 MB limit.');
      return;
    }

    setFile(f);
  };

  const handleStartUpload = async () => {
    if (!file) return;
    if (!consent) {
      setError('Please provide processing consent before uploading.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const response = await api.uploadReport(file, documentDate || undefined);
      setJobId(response.job_id);
      setActiveReportId(response.report_id);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please verify file integrity.');
      setUploading(false);
    }
  };

  // Poll job status
  useEffect(() => {
    if (!jobId || !activeReportId) return;

    const interval = setInterval(async () => {
      try {
        const status = await api.getJobStatus(jobId);
        setJobStatus(status);

        if (status.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => {
            onProcessingComplete(activeReportId);
          }, 800);
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setError(status.safe_error_message || 'Processing failed. Please inspect the file.');
          setUploading(false);
        }
      } catch (err: any) {
        console.error('Job polling error', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [jobId, activeReportId, onProcessingComplete]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '680px', margin: '2rem auto', padding: '0 1rem' }}>
      
      <div className="card" style={{ padding: '2rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <UploadCloud size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Upload Medical Report
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Accepts PDF blood tests, metabolic panels, or scanned image reports (Max 15MB)
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '0.5rem', padding: '0.85rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#991B1B', fontSize: '0.85rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Processing State Stepper */}
        {uploading ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', margin: '0 auto 1.25rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Loader2 size={28} className="animate-spin" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              {jobStatus?.stage === 'parsing_document' && 'Reading Text & Tables...'}
              {jobStatus?.stage === 'extracting_observations' && 'Extracting Diagnostic Observations...'}
              {jobStatus?.stage === 'normalizing_and_flagging' && 'Comparing Against Laboratory Ranges...'}
              {jobStatus?.stage === 'done' && 'Report Ready! Loading Explanations...'}
              {!jobStatus?.stage && 'Uploading Securely...'}
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              Deterministic value extraction in progress. This typically takes 3 to 6 seconds.
            </p>

            {/* Progress bar */}
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: 'var(--primary)',
                  width: `${jobStatus?.progress_percent || 15}%`,
                  transition: 'width 0.4s ease'
                }}
              />
            </div>

            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              {jobStatus?.progress_percent || 15}% completed
            </div>
          </div>
        ) : (
          <div>
            
            {/* Drag & Drop Area */}
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-strong)'}`,
                  backgroundColor: dragActive ? 'var(--primary-light)' : 'var(--bg-app)',
                  borderRadius: '0.75rem',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '1.5rem'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FFFFFF', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
                  <UploadCloud size={24} />
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Click to select report or drag and drop here
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  PDF, PNG, JPG up to 15MB
                </div>
              </div>
            ) : (
              /* Selected File Card */
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-app)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFile(null)}
                  style={{ border: 'none', background: 'none', color: 'var(--text-muted)', padding: '0.35rem' }}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Optional Document Date */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Report Date (Optional)
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-strong)',
                  fontSize: '0.875rem'
                }}
              />
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Helpful for tracking longitudinal progress across multiple reports.
              </div>
            </div>

            {/* Mandatory Consent Checkbox */}
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <input
                type="checkbox"
                id="consent-box"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="consent-box" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                I acknowledge that this system is an educational explainer and <strong>does not provide medical diagnoses or alter treatments</strong>. I consent to processing this report text against clinical reference guidelines.
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={onCancel} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleStartUpload}
                disabled={!file || !consent}
                className="btn-primary"
              >
                Start Processing
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
