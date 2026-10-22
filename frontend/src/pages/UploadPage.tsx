import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import type { JobStatus } from '../types';
import { 
  UploadCloud, FileText, AlertCircle, X, ArrowRight, Loader2, 
  ShieldCheck, Lock, CheckCircle2, Sparkles, FileCheck
} from 'lucide-react';

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
      setError('Unsupported file type. Please upload a PDF report or PNG/JPG image.');
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
          setUploading(false);
          setError(status.safe_error_message || 'Processing failed. Please inspect your document and re-upload.');
        }
      } catch (err: any) {
        console.error('Job polling error', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [jobId, activeReportId, onProcessingComplete]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '820px', margin: '2.5rem auto 4rem', padding: '0 1.5rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.45rem', 
          backgroundColor: 'var(--primary-light)', 
          color: 'var(--primary)', 
          padding: '0.35rem 0.85rem', 
          borderRadius: '9999px', 
          fontSize: '0.8rem', 
          fontWeight: 700, 
          marginBottom: '0.75rem',
          border: '1px solid #BAE6FD'
        }}>
          <Sparkles size={14} />
          Clinical Pipeline v1.0
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Analyze a Laboratory Report
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '540px', margin: '0.5rem auto 0' }}>
          Upload your blood test, metabolic panel, or diagnostic paper to extract structured parameters and evidence-backed explanations.
        </p>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#FEF2F2', 
          border: '1px solid #FCA5A5', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1rem 1.25rem', 
          marginBottom: '1.75rem', 
          display: 'flex', 
          gap: '0.75rem', 
          alignItems: 'flex-start',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.875rem' }}>
              Upload Notice
            </div>
            <p style={{ fontSize: '0.825rem', color: '#B91C1C', marginTop: '0.2rem', lineHeight: 1.45 }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Main Upload Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        
        {/* Dropzone */}
        {!uploading ? (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
            />

            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: dragActive ? '2px dashed var(--primary)' : '2px dashed #CBD5E1',
                  backgroundColor: dragActive ? 'var(--primary-light)' : 'var(--bg-app)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: dragActive ? '0 0 0 4px var(--primary-glow)' : 'none'
                }}
              >
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '16px', 
                  backgroundColor: '#FFFFFF', 
                  color: 'var(--primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)',
                  border: '1px solid #BAE6FD'
                }}>
                  <UploadCloud size={32} />
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Click to upload or drag & drop
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Supported formats: <strong>PDF, PNG, JPG</strong> (Maximum file size: 15 MB)
                </p>

                <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 600, backgroundColor: '#FFFFFF', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>PDF (Single & Multi-page)</span>
                  <span style={{ fontSize: '0.725rem', fontWeight: 600, backgroundColor: '#FFFFFF', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>PNG / JPG Scans</span>
                </div>
              </div>
            ) : (
              <div style={{ 
                backgroundColor: 'var(--bg-app)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-lg)', 
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setFile(null)}
                  style={{
                    border: 'none',
                    background: '#FFFFFF',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Form Inputs */}
            {file && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    Document Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', maxWidth: '320px' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Helps organize longitudinal timeline comparisons across repeated lab visits.
                  </p>
                </div>

                <div style={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '1rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}>
                  <input
                    type="checkbox"
                    id="consent-check"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{ marginTop: '0.25rem', width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="consent-check" style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.45 }}>
                    <strong>Informed Processing Consent:</strong> I authorize ReportExplainer to extract and summarize the laboratory information in this document for educational purposes. I understand that my uploaded document is never used for model training and can be permanently deleted at any time.
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button onClick={onCancel} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleStartUpload} className="btn-primary" disabled={!consent}>
                    Start Document Analysis
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Multi-Stage Live Processing Animation */
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              border: '2px solid #BAE6FD'
            }}>
              <Loader2 size={30} className="animate-spin" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Analyzing Document & Observations...
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Stage: <strong>{jobStatus?.stage || 'Extracting tables and reference intervals'}</strong> ({jobStatus?.progress_percent || 25}%)
            </p>

            {/* Progress Bar */}
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: 'var(--bg-subtle)', 
              borderRadius: '9999px', 
              overflow: 'hidden', 
              marginBottom: '2rem',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ 
                height: '100%', 
                width: `${jobStatus?.progress_percent || 30}%`, 
                background: 'linear-gradient(90deg, #0284C7 0%, #0D9488 100%)', 
                borderRadius: '9999px',
                transition: 'width 0.4s ease'
              }}></div>
            </div>

            {/* Step Checkpoints */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', textAlign: 'left' }}>
              
              <div style={{ 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: (jobStatus?.progress_percent || 0) >= 25 ? 'var(--teal-light)' : 'var(--bg-app)',
                border: (jobStatus?.progress_percent || 0) >= 25 ? '1px solid #99F6E4' : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: (jobStatus?.progress_percent || 0) >= 25 ? 'var(--teal-accent)' : 'var(--text-muted)'
              }}>
                <CheckCircle2 size={16} />
                <span>Anti-Malware Check</span>
              </div>

              <div style={{ 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: (jobStatus?.progress_percent || 0) >= 50 ? 'var(--teal-light)' : 'var(--bg-app)',
                border: (jobStatus?.progress_percent || 0) >= 50 ? '1px solid #99F6E4' : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: (jobStatus?.progress_percent || 0) >= 50 ? 'var(--teal-accent)' : 'var(--text-muted)'
              }}>
                <CheckCircle2 size={16} />
                <span>Table Extraction</span>
              </div>

              <div style={{ 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: (jobStatus?.progress_percent || 0) >= 75 ? 'var(--teal-light)' : 'var(--bg-app)',
                border: (jobStatus?.progress_percent || 0) >= 75 ? '1px solid #99F6E4' : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: (jobStatus?.progress_percent || 0) >= 75 ? 'var(--teal-accent)' : 'var(--text-muted)'
              }}>
                <CheckCircle2 size={16} />
                <span>Range Flagging</span>
              </div>

              <div style={{ 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: (jobStatus?.progress_percent || 0) >= 100 ? 'var(--teal-light)' : 'var(--bg-app)',
                border: (jobStatus?.progress_percent || 0) >= 100 ? '1px solid #99F6E4' : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: (jobStatus?.progress_percent || 0) >= 100 ? 'var(--teal-accent)' : 'var(--text-muted)'
              }}>
                <CheckCircle2 size={16} />
                <span>Evidence RAG</span>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Security & Privacy Badges */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '2rem', 
        flexWrap: 'wrap',
        fontSize: '0.825rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Lock size={15} color="var(--primary)" />
          <span>Encrypted In Transit & At Rest</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={15} color="var(--teal-accent)" />
          <span>Tenant Isolated & Scoped</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileCheck size={15} color="#4F46E5" />
          <span>Zero External Model Training</span>
        </div>
      </div>

    </div>
  );
};
