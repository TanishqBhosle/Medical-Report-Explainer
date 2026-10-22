import React from 'react';
import { ShieldCheck, Lock, Trash2, EyeOff } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--teal-light)', color: 'var(--teal-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <ShieldCheck size={26} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Privacy, Security & Medical Integrity
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px', margin: '0.35rem auto 0', lineHeight: 1.5 }}>
          Your health records are sensitive. ReportExplainer is architected with strict confidentiality, zero external advertising, and user-directed data deletion.
        </p>
      </div>

      {/* Commitments Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
            <Lock size={22} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Private File Isolation</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Uploaded PDF and image files are stored in private, unexposed filesystem volumes using random UUID keys. No public URLs exist.
          </p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--teal-accent)', marginBottom: '0.75rem' }}>
            <EyeOff size={22} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Redacted Logging</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Application logs pass through automated regex filters that purge emails, telephone numbers, and diagnostic values before recording.
          </p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: '#DC2626', marginBottom: '0.75rem' }}>
            <Trash2 size={22} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Instant Deletion</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            When you delete a report from your history, its original file, extracted observations, derived summaries, and Q&A entries are wiped immediately.
          </p>
        </div>

      </div>

      {/* What We Store Table */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Data Retention Matrix
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Data Type</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Purpose</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Retention & Control</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Account Credentials</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Authentication and secure access control</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Bcrypt password hashes; retained until account deletion</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Uploaded Documents</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Document parsing and table extraction</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Stored in private storage; removed on report deletion</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Extracted Observations</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Showing values, reference intervals, and flags</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Permanently deleted when the parent report is deleted</td>
              </tr>
              <tr>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Curated Clinical Knowledge</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>MedlinePlus, CDC, and WHO reference texts</td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>Public clinical domain guides; contains zero patient data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
