import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Report } from '../types';
import { UploadCloud, FileText, CheckCircle2, ArrowRight, HelpCircle, Activity } from 'lucide-react';

interface DashboardPageProps {
  onNavigateUpload: () => void;
  onNavigateReport: (reportId: string) => void;
  onNavigateCompare: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateUpload,
  onNavigateReport,
  onNavigateCompare
}) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await api.listReports(0, 5);
        setReports(data.items);
      } catch (err) {
        console.error('Failed to load dashboard reports', err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* Header Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Welcome, {user?.display_name || user?.email.split('@')[0]}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
            Review, explain, and compare your laboratory reports in simple language.
          </p>
        </div>

        <button onClick={onNavigateUpload} className="btn-primary" style={{ padding: '0.7rem 1.35rem' }}>
          <UploadCloud size={18} />
          Upload New Report
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Reports</span>
            <FileText size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {reports.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Stored in private encrypted volume
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Health Focus</span>
            <Activity size={18} color="var(--teal-accent)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--teal-accent)' }}>
            Grounded RAG
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            MedlinePlus & CDC Reference standards
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Longitudinal Compare</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Available
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Match normalized tests & units
          </div>
        </div>

      </div>

      {/* Recent Reports Section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Laboratory Reports
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Select a report to view extracted observations and plain language explanations.
            </p>
          </div>
          {reports.length > 1 && (
            <button onClick={onNavigateCompare} className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.825rem' }}>
              Compare Reports
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading your medical reports...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-app)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              No reports uploaded yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              Upload your first lab result (blood test, metabolic panel, lipid profile) to get a clear breakdown.
            </p>
            <button onClick={onNavigateUpload} className="btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              <UploadCloud size={16} />
              Upload Your First Report
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reports.map((r) => (
              <div
                key={r.id}
                onClick={() => onNavigateReport(r.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  backgroundColor: '#FFFFFF',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {r.original_filename}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
                      <span>Date: {r.document_date || 'Not specified'}</span>
                      <span>•</span>
                      <span>{(r.file_size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge badge-${r.processing_status.toLowerCase()}`}>
                    {r.processing_status.replace('_', ' ')}
                  </span>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Education & Guidelines Callout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <HelpCircle size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ fontSize: '0.925rem', color: 'var(--text-primary)' }}>Why Reference Ranges Vary</strong>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Different labs use different instruments, reagent lots, and statistical populations. An 'out of range' marker at one facility may fall within range at another.
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Activity size={20} color="var(--teal-accent)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ fontSize: '0.925rem', color: 'var(--text-primary)' }}>Preparing for Your Doctor's Visit</strong>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Write down any current symptoms, recent dietary or exercise changes, and medications you are taking so your physician has full clinical context.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
