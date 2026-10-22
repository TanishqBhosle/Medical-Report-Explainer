import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import type { Report, CompareResponse } from '../types';
import {
  GitCompare, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Minus, AlertTriangle, Calendar, FileText, ShieldCheck, Activity, RefreshCw
} from 'lucide-react';

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
      setError('Please select two distinct reports to compute longitudinal deltas.');
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

  const reportAObj = useMemo(() => reports.find((r) => r.id === reportIdA), [reports, reportIdA]);
  const reportBObj = useMemo(() => reports.find((r) => r.id === reportIdB), [reports, reportIdB]);

  const swapReports = () => {
    const temp = reportIdA;
    setReportIdA(reportIdB);
    setReportIdB(temp);
  };

  const deltaStats = useMemo(() => {
    if (!comparison) return { increased: 0, decreased: 0, unchanged: 0 };
    let increased = 0;
    let decreased = 0;
    let unchanged = 0;
    comparison.matched_parameters.forEach((p) => {
      if (p.is_comparable && p.numeric_delta !== null && p.numeric_delta !== undefined) {
        if (p.numeric_delta > 0) increased++;
        else if (p.numeric_delta < 0) decreased++;
        else unchanged++;
      }
    });
    return { increased, decreased, unchanged };
  }, [comparison]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1160px', margin: '2rem auto', padding: '0 1.5rem 4rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
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
            <GitCompare size={20} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            Longitudinal Report Comparison
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '750px' }}>
          Compare matching diagnostic analytes across different laboratory dates to track progression, observe changes, and verify reference unit consistency.
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#991B1B',
          fontSize: '0.875rem'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Selectors Card */}
      <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '2rem', borderRadius: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.25rem', alignItems: 'center' }}>
          
          {/* Baseline Report Selection */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                Baseline
              </span>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Report A
              </label>
            </div>
            
            <select
              value={reportIdA}
              onChange={(e) => setReportIdA(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-primary)',
                fontWeight: 500,
                outline: 'none'
              }}
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.original_filename} ({r.document_date || 'No Date'})
                </option>
              ))}
            </select>

            {reportAObj && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} /> {reportAObj.document_date || 'Undated'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FileText size={13} /> {reportAObj.page_count || 1} pages
                </span>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={swapReports}
              title="Swap Baseline and Follow-up"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <GitCompare size={18} />
            </button>
          </div>

          {/* Follow-Up Report Selection */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--teal-accent)', backgroundColor: 'var(--teal-light)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                Follow-Up
              </span>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Report B
              </label>
            </div>

            <select
              value={reportIdB}
              onChange={(e) => setReportIdB(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-primary)',
                fontWeight: 500,
                outline: 'none'
              }}
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.original_filename} ({r.document_date || 'No Date'})
                </option>
              ))}
            </select>

            {reportBObj && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} /> {reportBObj.document_date || 'Undated'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FileText size={13} /> {reportBObj.page_count || 1} pages
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 0.75rem', color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>Comparing Diagnostic Analytes...</div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Aligning standard units and computing numeric deltas</p>
        </div>
      )}

      {/* Comparison Results */}
      {!loading && comparison && (
        <div>
          {/* Longitudinal Snapshot Pills */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {comparison.matched_parameters.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Matched Analytes
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                color: '#C2410C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowUpRight size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#C2410C' }}>
                  {deltaStats.increased}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Values Elevated
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowDownRight size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563EB' }}>
                  {deltaStats.decreased}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Values Decreased
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                color: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0D9488' }}>
                  {comparison.matched_parameters.filter((p) => p.is_comparable).length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Directly Comparable
                </div>
              </div>
            </div>
          </div>

          {/* Matched Parameters Table */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: '2.5rem', borderRadius: '16px' }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Matched Diagnostic Parameters ({comparison.matched_parameters.length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Comparing longitudinal biometric trajectories with strict unit standardization
                </p>
              </div>
            </div>

            {comparison.matched_parameters.length === 0 ? (
              <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No matching analyte names detected between these two reports.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Analyte
                      </th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Report A Value
                      </th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Report B Value
                      </th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Longitudinal Delta
                      </th>
                      <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Compatibility Audit
                      </th>
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
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {p.test_name}
                          </td>

                          <td style={{ padding: '1rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                              {p.value_text_a} <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.unit_a}</span>
                            </div>
                            {p.flag_a && (
                              <span className={`badge badge-${p.flag_a.toLowerCase()}`} style={{ marginTop: '0.25rem' }}>
                                <span className="status-dot"></span>
                                {p.flag_a}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '1rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                              {p.value_text_b} <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.unit_b}</span>
                            </div>
                            {p.flag_b && (
                              <span className={`badge badge-${p.flag_b.toLowerCase()}`} style={{ marginTop: '0.25rem' }}>
                                <span className="status-dot"></span>
                                {p.flag_b}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '1rem 1rem' }}>
                            {p.is_comparable && deltaDisplay ? (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                color: p.numeric_delta! > 0 ? '#C2410C' : p.numeric_delta! < 0 ? '#2563EB' : 'var(--text-muted)',
                                backgroundColor: p.numeric_delta! > 0 ? '#FFF7ED' : p.numeric_delta! < 0 ? '#EFF6FF' : 'var(--bg-app)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px'
                              }}>
                                {p.numeric_delta! > 0 ? (
                                  <ArrowUpRight size={15} />
                                ) : p.numeric_delta! < 0 ? (
                                  <ArrowDownRight size={15} />
                                ) : (
                                  <Minus size={15} />
                                )}
                                <span>{deltaDisplay} {p.unit_b}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                Not computed
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '1rem 1.25rem' }}>
                            {p.is_comparable ? (
                              <span style={{ color: '#0D9488', fontSize: '0.775rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#F0FDFA', padding: '0.25rem 0.55rem', borderRadius: '6px' }}>
                                <CheckCircle2 size={13} />
                                Standardized & Comparable
                              </span>
                            ) : (
                              <div style={{ color: '#92400E', fontSize: '0.75rem', lineHeight: 1.35, backgroundColor: '#FEF3C7', padding: '0.35rem 0.65rem', borderRadius: '6px' }}>
                                <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <AlertTriangle size={13} />
                                  Not Directly Comparable
                                </span>
                                {p.incompatibility_reason && (
                                  <div style={{ marginTop: '0.15rem', color: '#B45309' }}>
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

          {/* Unmatched Tests Comparison Blocks */}
          {(comparison.unmatched_parameters_a.length > 0 || comparison.unmatched_parameters_b.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              
              <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
                  Exclusive to Report A ({comparison.unmatched_parameters_a.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {comparison.unmatched_parameters_a.map((t, idx) => (
                    <span key={idx} style={{ fontSize: '0.775rem', backgroundColor: '#FFFFFF', border: '1px solid var(--border-subtle)', padding: '0.25rem 0.6rem', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--teal-accent)' }}></span>
                  Exclusive to Report B ({comparison.unmatched_parameters_b.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {comparison.unmatched_parameters_b.map((t, idx) => (
                    <span key={idx} style={{ fontSize: '0.775rem', backgroundColor: '#FFFFFF', border: '1px solid var(--border-subtle)', padding: '0.25rem 0.6rem', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Clinical Context & Ethical Guardrail Notice */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'flex-start',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Clinical Context Guidance:</strong> Longitudinal changes reflect mathematical differences between reported points in time. Biometric variations can stem from diurnal rhythms, fasting status, acute hydration levels, or alternate laboratory assay reagents. Always consult your attending clinician before interpreting trends as clinical progression or remission.
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
