import React, { useState } from 'react';
import { 
  Upload, FileCheck, Shield, BookOpen, ArrowRight, 
  Sparkles, FileText
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onExplorePrivacy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onExplorePrivacy }) => {
  const [activeDemoTab, setActiveDemoTab] = useState<'hgb' | 'fbg' | 'chol'>('hgb');

  const demoData = {
    hgb: {
      test: 'Hemoglobin (Hgb)',
      raw: '10.8 g/dL (Ref: 12.0 - 15.5 g/dL) [L]',
      flag: 'low',
      flagLabel: 'Mildly Low',
      flagBorder: 'var(--flag-low-border)',
      flagBg: 'var(--flag-low-bg)',
      flagText: 'var(--flag-low-text)',
      summary: 'Your hemoglobin is 10.8 g/dL, which is slightly below the laboratory reference interval of 12.0 to 15.5 g/dL. Hemoglobin carries oxygen to your body tissues.',
      mayMean: 'Mildly low hemoglobin can be related to low iron stores, vitamin B12 or folate deficiency, blood loss, or hydration status.',
      nextStep: 'Ask your ordering doctor if an iron panel or complete blood count follow-up is appropriate.',
      citation: 'CDC National Center for Health Statistics (2024)'
    },
    fbg: {
      test: 'Fasting Blood Glucose',
      raw: '108 mg/dL (Ref: 70 - 99 mg/dL) [H]',
      flag: 'high',
      flagLabel: 'Elevated',
      flagBorder: 'var(--flag-high-border)',
      flagBg: 'var(--flag-high-bg)',
      flagText: 'var(--flag-high-text)',
      summary: 'Your fasting blood glucose is 108 mg/dL, which is above the standard fasting reference interval of 70 to 99 mg/dL.',
      mayMean: 'Elevated fasting glucose indicates impaired fasting regulation. A single test does not diagnose prediabetes or diabetes and requires clinical confirmation.',
      nextStep: 'Discuss whether an HbA1c test or repeat fasting check is recommended with your physician.',
      citation: 'American Diabetes Association (ADA Guidelines)'
    },
    chol: {
      test: 'Total Cholesterol',
      raw: '185 mg/dL (Ref: < 200 mg/dL) [Normal]',
      flag: 'normal',
      flagLabel: 'Desirable',
      flagBorder: 'var(--flag-normal-border)',
      flagBg: 'var(--flag-normal-bg)',
      flagText: 'var(--flag-normal-text)',
      summary: 'Your total cholesterol is 185 mg/dL, safely within the laboratory recommended threshold of below 200 mg/dL.',
      mayMean: 'Within the recommended cardiovascular lipid range. Best interpreted in combination with HDL, LDL, and triglyceride fractions.',
      nextStep: 'Maintain balanced dietary habits and review your lipid subfractions during your routine checkup.',
      citation: 'National Heart, Lung, and Blood Institute (NHLBI)'
    }
  };

  const currentDemo = demoData[activeDemoTab];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Hero Section */}
      <section style={{ 
        maxWidth: '1160px', 
        margin: '2.5rem auto 3.5rem', 
        textAlign: 'center', 
        padding: '0 1.5rem',
        position: 'relative'
      }}>
        
        {/* Glow badge pill */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          backgroundColor: '#FFFFFF', 
          color: 'var(--primary)', 
          padding: '0.4rem 1rem', 
          borderRadius: '9999px', 
          fontSize: '0.825rem', 
          fontWeight: 700, 
          marginBottom: '1.5rem',
          border: '1px solid rgba(2, 132, 199, 0.25)',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)'
        }}>
          <Sparkles size={15} color="var(--primary)" />
          <span>Next-Gen Clinical Translation • 100% Deterministic Flagging</span>
        </div>

        <h1 style={{ 
          fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', 
          fontWeight: 800, 
          lineHeight: 1.15, 
          marginBottom: '1.25rem',
          letterSpacing: '-0.035em'
        }}>
          Understand your medical report,<br />
          <span className="text-gradient">in clear, calm, plain language.</span>
        </h1>

        <p style={{ 
          fontSize: 'clamp(1rem, 2vw, 1.2rem)', 
          color: 'var(--text-secondary)', 
          maxWidth: '720px', 
          margin: '0 auto 2.25rem', 
          lineHeight: 1.6,
          fontWeight: 400
        }}>
          Transform confusing laboratory acronyms, reference numbers, and panic flags into calm, easy-to-digest clinical education—grounded directly in CDC, WHO, and peer-reviewed medical guidance.
        </p>

        {/* CTA Button Group */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          <button 
            onClick={onGetStarted}
            className="btn-primary" 
            style={{ padding: '0.85rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius-xl)' }}
          >
            Explain My Report
            <ArrowRight size={18} />
          </button>
          
          <button 
            onClick={onExplorePrivacy}
            className="btn-secondary" 
            style={{ padding: '0.85rem 1.85rem', fontSize: '1rem', borderRadius: 'var(--radius-xl)' }}
          >
            <Shield size={18} color="var(--teal-accent)" />
            Privacy Architecture
          </button>
        </div>

        {/* Interactive Live Explainer Demonstration Card */}
        <div className="card" style={{ 
          maxWidth: '920px', 
          margin: '0 auto', 
          padding: '2rem', 
          textAlign: 'left',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0,0,0,0.02)'
        }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="status-dot status-dot-green"></span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Live Interactive Demonstration
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem' }}>
                See how ReportExplainer works in practice
              </h3>
            </div>

            {/* Test Selector Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'var(--bg-subtle)', padding: '0.3rem', borderRadius: 'var(--radius-md)' }}>
              <button
                onClick={() => setActiveDemoTab('hgb')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: activeDemoTab === 'hgb' ? '#FFFFFF' : 'transparent',
                  color: activeDemoTab === 'hgb' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: activeDemoTab === 'hgb' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Hemoglobin
              </button>
              <button
                onClick={() => setActiveDemoTab('fbg')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: activeDemoTab === 'fbg' ? '#FFFFFF' : 'transparent',
                  color: activeDemoTab === 'fbg' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: activeDemoTab === 'fbg' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Blood Glucose
              </button>
              <button
                onClick={() => setActiveDemoTab('chol')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: activeDemoTab === 'chol' ? '#FFFFFF' : 'transparent',
                  color: activeDemoTab === 'chol' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: activeDemoTab === 'chol' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Cholesterol
              </button>
            </div>
          </div>

          {/* Side by side comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Raw Paper View */}
            <div style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #E2E8F0', 
              borderRadius: 'var(--radius-lg)', 
              padding: '1.25rem',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={14} />
                Raw Laboratory Document Output
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-app)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
                {currentDemo.raw}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Often induces unnecessary patient anxiety due to missing context, complex units, and ambiguous flags.
              </p>
            </div>

            {/* CliniScribe Explainer View */}
            <div style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #BAE6FD', 
              borderRadius: 'var(--radius-lg)', 
              padding: '1.25rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} />
                  Calm 5-Point Plain Explanation
                </div>
                <span style={{ 
                  backgroundColor: currentDemo.flagBg, 
                  color: currentDemo.flagText, 
                  border: `1px solid ${currentDemo.flagBorder}`,
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px'
                }}>
                  {currentDemo.flagLabel}
                </span>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem' }}>
                {currentDemo.summary}
              </div>

              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.65rem' }}>
                <strong>What it may mean:</strong> {currentDemo.mayMean}
              </p>

              <div style={{ fontSize: '0.775rem', color: 'var(--teal-accent)', backgroundColor: 'var(--teal-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #CCFBF1' }}>
                <strong>Evidence Citation:</strong> {currentDemo.citation}
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* Trust & Proof Metrics */}
      <section style={{ maxWidth: '1160px', margin: '0 auto 4.5rem', padding: '0 1.5rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '1.25rem',
          backgroundColor: '#FFFFFF',
          padding: '2rem',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)', padding: '0.5rem 1rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.03em' }}>100%</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>Deterministic Flags</div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Never guessed or hallucinated by AI</p>
          </div>

          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)', padding: '0.5rem 1rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--teal-accent)', letterSpacing: '-0.03em' }}>27+</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>Safety Rules & Tests</div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Emergency, diagnosis, & dosing refusal</p>
          </div>

          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-subtle)', padding: '0.5rem 1rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Zero</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>Data Training</div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Reports are never used for model training</p>
          </div>

          <div style={{ textAlign: 'center', padding: '0.5rem 1rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.03em' }}>&lt; 2s</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>Analysis Latency</div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Instant table extraction & citations</p>
          </div>

        </div>
      </section>

      {/* 3-Step Workflow */}
      <section style={{ maxWidth: '1160px', margin: '0 auto 4.5rem', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Workflow Architecture
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem', letterSpacing: '-0.03em' }}>
            How ReportExplainer Protects You
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px', margin: '0.5rem auto 0' }}>
            A rigorous multi-stage pipeline designed by clinical and AI safety engineers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card card-interactive" style={{ padding: '2rem', position: 'relative' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '1.25rem',
              border: '1px solid #BAE6FD'
            }}>
              <Upload size={22} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Step 01</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.65rem' }}>Private File Ingestion</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Upload lab PDFs or camera photos. Magic bytes are verified, path traversal is sanitized, and files are stored privately using anonymous identifiers.
            </p>
          </div>

          <div className="card card-interactive" style={{ padding: '2rem', position: 'relative' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              backgroundColor: 'var(--teal-light)', 
              color: 'var(--teal-accent)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '1.25rem',
              border: '1px solid #99F6E4'
            }}>
              <FileCheck size={22} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal-accent)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Step 02</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.65rem' }}>Deterministic Extraction</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Analyte names, values, units, and reference intervals are extracted with page provenance. Values like <code>8.0 vs 80</code> are checked for magnitude anomalies.
            </p>
          </div>

          <div className="card card-interactive" style={{ padding: '2rem', position: 'relative' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              backgroundColor: '#FEF3C7', 
              color: '#D97706', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '1.25rem',
              border: '1px solid #FDE68A'
            }}>
              <BookOpen size={22} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Step 03</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.65rem' }}>Clinical Evidence RAG</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Explanations cite reputable clinical evidence from the CDC, WHO, and NIH. Prohibits diagnostic claims and gives you prepared questions for your physician.
            </p>
          </div>

        </div>
      </section>

      {/* Bottom CTA Card */}
      <section style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
          borderRadius: 'var(--radius-2xl)', 
          padding: '3rem 2rem', 
          textAlign: 'center', 
          color: '#FFFFFF',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
            Ready to decipher your laboratory report?
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94A3B8', maxWidth: '620px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Upload your laboratory paperwork securely. Receive a patient-friendly summary with exact citations in seconds.
          </p>
          <button 
            onClick={onGetStarted}
            className="btn-primary" 
            style={{ 
              padding: '0.85rem 2.25rem', 
              fontSize: '1rem', 
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #0284C7 0%, #0D9488 100%)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            Start Your Free Explanation
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

    </div>
  );
};
