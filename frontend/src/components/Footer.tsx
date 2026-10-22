import React from 'react';
import { AlertCircle, ShieldCheck, FileCheck, Lock, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid var(--border-subtle)',
      marginTop: '5rem',
      padding: '3rem 1.5rem 2.5rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Important Clinical Disclaimer Alert Box */}
        <div style={{ 
          backgroundColor: '#FFFBEB', 
          border: '1px solid #FDE68A', 
          borderRadius: '16px', 
          padding: '1.5rem', 
          marginBottom: '2.5rem',
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'flex-start',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
              Important Health & Clinical Safety Notice
            </div>
            <p style={{ fontSize: '0.825rem', color: '#B45309', lineHeight: 1.6 }}>
              The Medical Report Explainer is an educational translation and readability intelligence platform. It does <strong>not</strong> provide medical diagnoses, treatment decisions, or emergency clinical triage. Laboratory reference intervals reflect printed laboratory norms and can vary by age, sex, and testing methodology. If you have concerning symptoms or medical questions, consult a qualified physician or local emergency medical services immediately.
            </p>
          </div>
        </div>

        {/* Footer info & links */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #0284C7, #0D9488)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <Activity size={12} />
              </div>
              ReportExplainer
            </div>
            <span>•</span>
            <span>Zero PHI in Logs</span>
            <span>•</span>
            <span>Client-Controlled Deletion</span>
            <span>•</span>
            <span>Educational Research Platform</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} color="var(--primary)" />
              AES-256 Bit Encryption
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} color="var(--teal-accent)" />
              HIPAA & GDPR Principles
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileCheck size={14} color="var(--primary)" />
              MedlinePlus & CDC Citations
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
