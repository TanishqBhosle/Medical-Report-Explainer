import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Report } from '../types';
import { FileText, ArrowRight, Trash2, GitCompare, UploadCloud, Search, Calendar } from 'lucide-react';

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
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? All associated extractions and private files will be removed.`)) {
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
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            My Medical Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Historical record of your uploaded laboratory tests and diagnostic explanations.
          </p>
        </div>

        <button onClick={onNavigateUpload} className="btn-primary">
          <UploadCloud size={16} />
          Upload Report
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by report name or date..."
          style={{
            width: '100%',
            padding: '0.65rem 0.75rem 0.65rem 2.25rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-strong)',
            fontSize: '0.9rem',
            backgroundColor: '#FFFFFF'
          }}
        />
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      {/* Reports List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading your reports...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {search ? 'No reports matched your search' : 'No reports found'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {search ? 'Try clearing your filter.' : 'Upload a PDF or image of your lab results to start.'}
            </p>
            {!search && (
              <button onClick={onNavigateUpload} className="btn-primary">
                <UploadCloud size={16} />
                Upload Report
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
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.15s ease',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div
                      onClick={() => onSelectReport(r.id)}
                      style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', cursor: 'pointer' }}
                    >
                      {r.original_filename}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        {r.document_date || 'Date not recorded'}
                      </span>
                      <span>•</span>
                      <span>{(r.file_size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge badge-${r.processing_status.toLowerCase()}`}>
                    {r.processing_status.replace('_', ' ')}
                  </span>

                  <button
                    onClick={() => onSelectReport(r.id)}
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
                  >
                    View Details
                    <ArrowRight size={14} />
                  </button>

                  <button
                    onClick={() => onNavigateCompare(r.id)}
                    className="btn-secondary"
                    title="Compare this report with another"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
                  >
                    <GitCompare size={14} />
                  </button>

                  <button
                    onClick={() => handleDelete(r.id, r.original_filename)}
                    disabled={deletingId === r.id}
                    title="Delete permanently"
                    style={{
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: '#FFFFFF',
                      color: '#DC2626',
                      borderRadius: '0.375rem',
                      padding: '0.45rem 0.65rem'
                    }}
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
