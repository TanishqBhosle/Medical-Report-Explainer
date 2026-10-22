import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Report } from '../types';
import { 
  UploadCloud, FileText, CheckCircle2, ArrowRight, Activity, 
  GitCompare, Calendar, ChevronRight, Sparkles
} from 'lucide-react';

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
    <div className="animate-fade-in" style={{ maxWidth: '1180px', margin: '2rem auto 4rem', padding: '0 1.5rem' }}>
      
      {/* Top Greeting Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2.25rem', 
        flexWrap: 'wrap', 
        gap: '1rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="status-dot status-dot-green"></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Patient Workspace Active
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Welcome back, {user?.display_name || user?.email.split('@')[0]}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
            Translate, track, and monitor your clinical diagnostic documents with evidence traceability.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={onNavigateCompare}
            className="btn-secondary"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <GitCompare size={17} color="var(--primary)" />
            Compare Trends
          </button>
          
          <button 
            onClick={onNavigateUpload} 
            className="btn-primary" 
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <UploadCloud size={18} />
            Analyze New Report
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Archived Reports</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={17} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {reports.length}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Encrypted storage & zero PHI leaks
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--teal-accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Flagging Engine</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={17} color="var(--teal-accent)" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--teal-accent)' }}>
            Deterministic
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Non-LLM mathematical verification
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Evidence Sources</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={17} color="#8B5CF6" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6D28D9' }}>
            CDC & NIH
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Validated clinical knowledge base
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Longitudinal Delta</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={17} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Unit Guarded
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Incompatible units rejected
          </div>
        </div>

      </div>

      {/* Recent Reports Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        
        <div style={{ 
          padding: '1.25rem 1.75rem', 
          borderBottom: '1px solid var(--border-subtle)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Diagnostic Documents
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Click any report to view extracted observations, plain explanations, and provenance
            </p>
          </div>

          <button onClick={onNavigateUpload} className="btn-ghost" style={{ fontSize: '0.825rem' }}>
            + Upload New
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading your diagnostic records...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <UploadCloud size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              No laboratory reports yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              Upload your first blood test, lipid panel, metabolic panel, or pathology report to receive calm plain-language explanations.
            </p>
            <button onClick={onNavigateUpload} className="btn-primary" style={{ padding: '0.7rem 1.75rem' }}>
              Upload Your First Report
              <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600 }}>Document Name</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Report Date</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Pages</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr 
                    key={r.id} 
                    onClick={() => onNavigateReport(r.id)}
                    style={{ 
                      borderBottom: '1px solid var(--border-subtle)', 
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <FileText size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {r.original_filename}
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {(r.file_size_bytes / 1024).toFixed(1)} KB • {r.media_type}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        {r.document_date || 'Not specified'}
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)' }}>
                      {r.page_count || 1} page{r.page_count && r.page_count > 1 ? 's' : ''}
                    </td>

                    <td style={{ padding: '1rem 1rem' }}>
                      <span className={`badge badge-${r.processing_status.toLowerCase()}`}>
                        {r.processing_status.replace('_', ' ')}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        className="btn-ghost"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}
                      >
                        Inspect
                        <ChevronRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
