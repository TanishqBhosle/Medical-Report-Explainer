import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Report } from '../types';
import { FileText, ArrowRight, Trash2, GitCompare, UploadCloud, Search, Calendar, FolderArchive } from 'lucide-react';

interface HistoryPageProps {
  onSelectReport: (reportId: string) => void;
  onNavigateUpload: () => void;
  onNavigateCompare: (reportIdA?: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onSelectReport,
  onNavigateUpload,
  onNavigateCompare
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.listReports(0, 100);
      setReports(data.items);
    } catch (err) {
      console.error('Failed to fetch reports history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? All associated extractions and private files will be removed immediately.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = reports.filter((r) =>
    r.original_filename.toLowerCase().includes(search.toLowerCase()) ||
    (r.document_date && r.document_date.includes(search))
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1060px', margin: '2rem auto', padding: '0 1.5rem 4rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284C7, #0D9488)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FolderArchive size={20} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              Medical Records Archive
            </h1>
            <span style={{
              fontSize: '0.75rem',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontWeight: 700,
              color: 'var(--text-secondary)'
            }}>
              {reports.length} records
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Search and manage your encrypted laboratory analyses, extracted observations, and clinical trends.
          </p>
        </div>

        <button onClick={onNavigateUpload} className="btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
          <UploadCloud size={16} />
          Upload New Report
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter records by filename, test panel, or document date..."
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.9rem',
            backgroundColor: '#FFFFFF',
            boxShadow: 'var(--shadow-subtle)',
            outline: 'none'
          }}
        />
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      {/* Reports List */}
      <div className="card" style={{ overflow: 'hidden', borderRadius: '16px' }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading your medical records...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
            <FileText size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              {search ? 'No matching reports found' : 'Your medical archive is empty'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {search ? 'Try adjusting your search criteria.' : 'Upload a PDF or image of your laboratory test panel to begin.'}
            </p>
            {!search && (
              <button onClick={onNavigateUpload} className="btn-primary" style={{ margin: '0 auto' }}>
                <UploadCloud size={16} />
                Upload First Report
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.15s ease',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '260px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div
                      onClick={() => onSelectReport(r.id)}
                      style={{
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontSize: '0.975rem',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    >
                      {r.original_filename}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={13} />
                        {r.document_date || 'Undated'}
                      </span>
                      <span>•</span>
                      <span>{(r.file_size_bytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{r.page_count || 1} pg</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${r.processing_status.toLowerCase()}`}>
                    <span className="status-dot"></span>
                    {r.processing_status.replace('_', ' ')}
                  </span>

                  <button
                    onClick={() => onSelectReport(r.id)}
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.825rem' }}
                  >
                    View Analysis
                    <ArrowRight size={14} />
                  </button>

                  <button
                    onClick={() => onNavigateCompare(r.id)}
                    className="btn-secondary"
                    title="Compare this report with another"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
                  >
                    <GitCompare size={14} />
                  </button>

                  <button
                    onClick={() => handleDelete(r.id, r.original_filename)}
                    disabled={deletingId === r.id}
                    title="Delete permanently"
                    style={{
                      border: '1px solid #FECACA',
                      backgroundColor: '#FFFFFF',
                      color: '#DC2626',
                      borderRadius: '8px',
                      padding: '0.45rem 0.65rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
