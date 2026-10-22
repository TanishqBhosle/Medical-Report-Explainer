import React from 'react';
import { ShieldCheck, Lock, Trash2, EyeOff, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '2.5rem auto', padding: '0 1.5rem 5rem' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0D9488, #0284C7)',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 4px 16px rgba(13, 148, 136, 0.25)'
        }}>
          <ShieldCheck size={28} />
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Clinical Privacy & Data Architecture
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px', margin: '0.5rem auto 0', lineHeight: 1.6 }}>
          Medical records require ironclad confidentiality. ReportExplainer operates under zero-advertising, non-commercial research models with strict user-controlled data deletion.
        </p>
      </div>

      {/* Core Privacy Pillars Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
        
        <div className="card-glass" style={{ padding: '1.75rem', borderRadius: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <Lock size={20} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.45rem', color: 'var(--text-primary)' }}>
            Isolated Private Storage
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Uploaded laboratory documents are isolated in unexposed local filesystem volumes. Files are accessed strictly via cryptographically-random UUIDs with tenant-bound authentication tokens.
          </p>
        </div>

        <div className="card-glass" style={{ padding: '1.75rem', borderRadius: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--teal-light)',
            color: 'var(--teal-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <EyeOff size={20} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.45rem', color: 'var(--text-primary)' }}>
            Redacted System Logs
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            All diagnostic API payloads and server logs pass through automated regex sanitation filters that redact personal names, telephone numbers, emails, and biometric values before output.
          </p>
        </div>

        <div className="card-glass" style={{ padding: '1.75rem', borderRadius: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <Trash2 size={20} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.45rem', color: 'var(--text-primary)' }}>
            Immediate Client Purge
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            When you delete any document from your dashboard, the source PDF, extracted OCR texts, numerical observations, and LLM explanations are completely wiped from disk and database immediately.
          </p>
        </div>

      </div>

      {/* Security Architecture Checklist */}
      <div className="card" style={{ padding: '2rem', marginBottom: '3.5rem', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          Technical Security Commitments
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="var(--teal-accent)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>No Model Retraining on User Data</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                Your personal laboratory inputs are never contributed to foundation model training corpora.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="var(--teal-accent)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Strict IDOR Multi-Tenant Isolation</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                Every database query binds strictly to authenticated session user IDs, preventing cross-tenant leakage.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="var(--teal-accent)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Accredited Medical Citations Only</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                Knowledge graphs are populated exclusively with peer-reviewed or public health references (MedlinePlus, CDC, WHO).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="var(--teal-accent)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Zero Third-Party Trackers</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                No advertising pixels, analytics trackers, or social SDKs are embedded into the client code.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What We Store Table */}
      <div className="card" style={{ padding: '2rem', borderRadius: '16px', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Data Retention Matrix
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Complete transparency over what is recorded, why it is needed, and when it is eliminated.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data Type</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Purpose</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Retention & Control</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Account Credentials</td>
                <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>Authentication and tenant session control</td>
                <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>Bcrypt password hashes; retained until account deletion</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Uploaded Documents</td>
                <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>OCR parsing and analyte extraction</td>
                <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>Stored in private storage; removed on report deletion</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Extracted Observations</td>
                <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>Displaying values, intervals, flags, and deltas</td>
                <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>Permanently deleted when the parent report is deleted</td>
              </tr>
              <tr>
                <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Curated Clinical Knowledge</td>
                <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>MedlinePlus, CDC, and WHO reference texts</td>
                <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>Public clinical domain guides; contains zero patient data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
