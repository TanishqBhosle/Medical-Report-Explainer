import React from 'react';
import { AlertCircle, Shield, FileCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', marginTop: '4rem', padding: '2.5rem 1.5rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Important Clinical Disclaimer Alert */}
        <div style={{ 
          backgroundColor: '#FFFBEB', 
          border: '1px solid #FDE68A', 
          borderRadius: '0.75rem', 
          padding: '1.25rem', 
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <div style={{ color: '#D97706', marginTop: '0.1rem' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#92400E', fontSize: '0.925rem', marginBottom: '0.25rem' }}>
              Important Health & Clinical Disclaimer
            </div>
            <p style={{ fontSize: '0.825rem', color: '#B45309', lineHeight: 1.5 }}>
              The Medical Report Explainer is an educational translation and readability tool. It does <strong>not</strong> provide medical diagnoses, treatment decisions, or emergency clinical triage. Laboratory reference intervals reflect printed laboratory norms and can vary by age, sex, and testing methodology. If you have concerning symptoms or medical questions, consult a qualified physician or local emergency services immediately.
            </p>
          </div>
        </div>

        {/* Footer info & links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>ReportExplainer</span>
            <span>•</span>
            <span>Zero PHI in Logs</span>
            <span>•</span>
            <span>Client-Controlled Deletion</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={14} color="var(--teal-accent)" />
              Encrypted Local Storage
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileCheck size={14} color="var(--primary)" />
              Clinical Evidence Provenance
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
