import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Report, CompareResponse } from '../types';
import { GitCompare, CheckCircle2, Info, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from 'lucide-react';

interface ComparePageProps {
  initialReportIdA?: string;
}

export const ComparePage: React.FC<ComparePageProps> = ({ initialReportIdA }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportIdA, setReportIdA] = useState<string>(initialReportIdA || '');
  const [reportIdB, setReportIdB] = useState<string>('');
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await api.listReports(0, 100);
        setReports(res.items);
        if (!reportIdA && res.items.length > 0) {
          setReportIdA(res.items[0].id);
        }
        if (res.items.length > 1 && !reportIdB) {
          setReportIdB(res.items[1].id);
        }
      } catch (err) {
        console.error('Failed to load reports for comparison', err);
      }
    };
    loadReports();
  }, []);

  const handleCompare = async () => {
    if (!reportIdA || !reportIdB) return;
    if (reportIdA === reportIdB) {
      setError('Please select two different reports to compare.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await api.compareReports(reportIdA, reportIdB);
      setComparison(data);
    } catch (err: any) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportIdA && reportIdB && reportIdA !== reportIdB) {
      handleCompare();
    }
  }, [reportIdA, reportIdB]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitCompare size={18} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Longitudinal Report Comparison
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Compare matching diagnostic parameters over time across two of your laboratory records.
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '0.5rem', padding: '0.85rem', marginBottom: '1.5rem', color: '#991B1B', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Selectors Bar */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Baseline Report (Report A)
            </label>
            <select
              value={reportIdA}
              onChange={(e) => setReportIdA(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-strong)',
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF'
              }}
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.original_filename} ({r.document_date || 'No Date'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Follow-Up Report (Report B)
            </label>
            <select
              value={reportIdB}
              onChange={(e) => setReportIdB(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-strong)',
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF'
              }}
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.original_filename} ({r.document_date || 'No Date'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={handleCompare}
              disabled={loading || !reportIdA || !reportIdB || reportIdA === reportIdB}
              className="btn-primary"
              style={{ width: '100%', padding: '0.65rem' }}
            >
              {loading ? 'Comparing...' : 'Refresh Comparison'}
            </button>
          </div>

        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div>
          
          {/* Matched Parameters Table */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Matched Laboratory Parameters ({comparison.matched_parameters.length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Comparing values with verified units and standardized analyte identities
                </p>
              </div>
            </div>

            {comparison.matched_parameters.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No matching test names were detected across these two reports.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Test Parameter</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Report A Value</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Report B Value</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Change (Delta)</th>
                      <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Compatibility Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.matched_parameters.map((p, idx) => {
                      const deltaDisplay = p.numeric_delta !== null && p.numeric_delta !== undefined
                        ? (p.numeric_delta > 0 ? `+${p.numeric_delta}` : `${p.numeric_delta}`)
                        : null;

                      return (
                        <tr
                          key={idx}
                          style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                        >
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {p.test_name}
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {p.value_text_a} {p.unit_a}
                            </div>
                            {p.flag_a && (
                              <span className={`badge badge-${p.flag_a.toLowerCase()}`} style={{ marginTop: '0.2rem' }}>
                                {p.flag_a}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {p.value_text_b} {p.unit_b}
                            </div>
                            {p.flag_b && (
                              <span className={`badge badge-${p.flag_b.toLowerCase()}`} style={{ marginTop: '0.2rem' }}>
                                {p.flag_b}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.85rem 1rem' }}>
                            {p.is_comparable && deltaDisplay ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: p.numeric_delta! > 0 ? '#C2410C' : p.numeric_delta! < 0 ? '#2563EB' : 'var(--text-muted)' }}>
                                {p.numeric_delta! > 0 ? (
                                  <ArrowUpRight size={16} />
                                ) : p.numeric_delta! < 0 ? (
                                  <ArrowDownRight size={16} />
                                ) : (
                                  <Minus size={16} />
                                )}
                                <span>{deltaDisplay} {p.unit_b}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                Not computed
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            {p.is_comparable ? (
                              <span style={{ color: 'var(--teal-accent)', fontSize: '0.775rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <CheckCircle2 size={14} />
                                Comparable
                              </span>
                            ) : (
                              <div style={{ color: '#B45309', fontSize: '0.775rem', lineHeight: 1.3 }}>
                                <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <AlertTriangle size={13} />
                                  Not Comparable
                                </span>
                                {p.incompatibility_reason && (
                                  <div style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                                    {p.incompatibility_reason}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Unmatched Parameters Cards */}
          {(comparison.unmatched_parameters_a.length > 0 || comparison.unmatched_parameters_b.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Only in Report A ({comparison.unmatched_parameters_a.length})
                </div>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {comparison.unmatched_parameters_a.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Only in Report B ({comparison.unmatched_parameters_b.length})
                </div>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {comparison.unmatched_parameters_b.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {/* Comparison Notes & Ethical Framing */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong>Clinical Context Note:</strong> Deltas represent raw numeric differences between document dates. Value changes do not automatically indicate improvement or deterioration; factors such as fasting state, time of collection, and inter-laboratory variances must be evaluated by your physician.
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
