import React from 'react';
import { Upload, FileCheck, Shield, BookOpen, ArrowRight, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onExplorePrivacy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onExplorePrivacy }) => {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Hero Section */}
      <section style={{ maxWidth: '1000px', margin: '3rem auto 4rem', textAlign: 'center', padding: '0 1rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          backgroundColor: 'var(--teal-light)', 
          color: 'var(--teal-accent)', 
          padding: '0.35rem 0.85rem', 
          borderRadius: '9999px', 
          fontSize: '0.825rem', 
          fontWeight: 600, 
          marginBottom: '1.25rem',
          border: '1px solid #99F6E4'
        }}>
          <Sparkles size={14} />
          Safety-First Patient Medical Explainer
        </div>

        <h1 style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: '1.25rem' }}>
          Understand your medical report,<br />
          <span style={{ color: 'var(--primary)' }}>in clear, plain language.</span>
        </h1>

        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Transform complex laboratory acronyms, reference intervals, and test numbers into calm, easy-to-digest explanations grounded directly in reputable health sources.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={onGetStarted}
            className="btn-primary" 
            style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}
          >
            Explain a Report
            <ArrowRight size={18} />
          </button>
          <button 
            onClick={onExplorePrivacy}
            className="btn-secondary" 
            style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}
          >
            <Shield size={18} />
            Privacy & Trust
          </button>
        </div>
      </section>

      {/* 3-Step Workflow */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 4rem', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            How ReportExplainer Works
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            A rigorous 3-stage process prioritizing clinical traceability and user calm.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1.75rem', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Upload size={20} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Step 1</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Secure Upload</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Upload your PDF or image report. Files are checked for integrity, encrypted in private object storage, and scoped exclusively to your account.
            </p>
          </div>

          <div className="card" style={{ padding: '1.75rem', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--teal-light)', color: 'var(--teal-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <FileCheck size={20} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal-accent)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Step 2</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Deterministic Extraction</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Test names, units, and ranges are extracted with page-number provenance. Flags (low/normal/high) are calculated mathematically—never guessed by AI.
            </p>
          </div>

          <div className="card" style={{ padding: '1.75rem', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <BookOpen size={20} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Step 3</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Grounded Understanding</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Receive plain-language summaries backed by MedlinePlus & NIH clinical evidence, plus thoughtful questions to ask your doctor.
            </p>
          </div>

        </div>
      </section>

      {/* Safety & What We Don't Do Callout */}
      <section style={{ maxWidth: '1000px', margin: '0 auto 4rem', padding: '0 1.5rem' }}>
        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: '1rem', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', textAlign: 'center' }}>
            Our Medical Safety Commitments
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={20} color="var(--teal-accent)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Always Grounded in Laboratory Ranges</strong>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  We evaluate results strictly against the reference interval printed on your specific laboratory document.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={20} color="#EA580C" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Never Claims Disease Diagnosis</strong>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  An abnormal marker is not a diagnosis. We never predict illness, estimate disease probability, or substitute for a clinician.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={20} color="var(--teal-accent)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Questions for Your Clinician</strong>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  We prepare you for constructive conversations with your doctor, framing results in relation to symptoms and lifestyle.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={20} color="#EA580C" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Zero Prescription or Dosing Advice</strong>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  We will never recommend starting, stopping, or altering prescribed medications or supplements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive CTA */}
      <section style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center', padding: '2.5rem 1.5rem', backgroundColor: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Ready to review your lab results?
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
          Upload any digital PDF, scan, or photo of your medical report to gain immediate clarity.
        </p>
        <button 
          onClick={onGetStarted}
          className="btn-primary" 
          style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
        >
          Start Explaining
          <ArrowRight size={18} />
        </button>
      </section>

    </div>
  );
};
