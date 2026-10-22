import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import type { Report, Observation, ExplanationResponse, CitationItem } from '../types';
import {
  ArrowLeft, Trash2, AlertCircle, BookOpen,
  HelpCircle, Send, ExternalLink, ShieldAlert, Sparkles, Eye, Edit2, AlertTriangle,
  Search, CheckCircle2, Copy, Check, Activity, ShieldCheck
} from 'lucide-react';

interface ReportDetailsPageProps {
  reportId: string;
  onBack: () => void;
  onDeleted: () => void;
  onNavigateCompare?: (reportId: string) => void;
}

export const ReportDetailsPage: React.FC<ReportDetailsPageProps> = ({ reportId, onBack, onDeleted, onNavigateCompare }) => {
  const [report, setReport] = useState<Report | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'flagged' | 'normal'>('all');

  // Q&A state
  const [question, setQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string; safety?: string; citations?: CitationItem[] }[]>([]);
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<number | null>(null);

  // Provenance snippet modal
  const [activeSnippet, setActiveSnippet] = useState<{ test: string; page?: number | null; snippet?: string | null } | null>(null);

  // Observation Correction state
  const [editingObs, setEditingObs] = useState<Observation | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rep, obsList] = await Promise.all([
          api.getReport(reportId),
          api.getObservations(reportId)
        ]);
        setReport(rep);
        setObservations(obsList.observations);

        // Fetch or generate plain-language explanation
        const expl = await api.generateExplanation(reportId);
        setExplanation(expl);
      } catch (err: any) {
        console.error('Error fetching report details', err);
        setError(err.message || 'Failed to load report data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reportId]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report? This will permanently remove the original file, observations, and derived explanations.')) {
      return;
    }
    try {
      await api.deleteReport(reportId);
      onDeleted();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleAskQuestion = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const queryText = (customQ || question).trim();
    if (!queryText || qaLoading) return;

    setQaLoading(true);
    try {
      const res = await api.generateExplanation(reportId, queryText);
      setQaHistory((prev) => [
        ...prev,
        {
          q: queryText,
          a: res.summary,
          safety: res.safety_status,
          citations: res.citations
        }
      ]);
      setQuestion('');
    } catch (err: any) {
      alert(`Error answering question: ${err.message}`);
    } finally {
      setQaLoading(false);
    }
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingObs || !editVal.trim()) return;
    setSavingEdit(true);
    try {
      const updated = await api.updateObservation(reportId, editingObs.id, {
        value_text: editVal.trim(),
        unit: editUnit.trim() || undefined,
        correction_notes: editNotes.trim() || undefined,
      });
      setObservations((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setEditingObs(null);
    } catch (err: any) {
      alert(`Correction failed: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(idx);
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  // Filtered observations
  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      const matchesSearch =
        obs.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obs.value_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obs.test_name_original && obs.test_name_original.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const isNormal = obs.reported_flag.toUpperCase() === 'NORMAL';
      if (activeTab === 'flagged') return !isNormal;
      if (activeTab === 'normal') return isNormal;
      return true;
    });
  }, [observations, searchQuery, activeTab]);

  const flaggedCount = useMemo(() => {
    return observations.filter((o) => o.reported_flag.toUpperCase() !== 'NORMAL').length;
  }, [observations]);

  const normalCount = useMemo(() => {
    return observations.filter((o) => o.reported_flag.toUpperCase() === 'NORMAL').length;
  }, [observations]);

  const reviewNeeded = observations.some((o) => o.validation_status === 'needs_review');
  const hasConflicts = observations.some((o) => o.flag_conflict);

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '5rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.1), rgba(13, 148, 136, 0.15))',
          color: 'var(--primary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          animation: 'pulseGlow 2s infinite'
        }}>
          <Activity size={28} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Analyzing Diagnostic Laboratory Report
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Extracting biometric observations, cross-referencing published reference intervals, and generating plain-language guidance...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ maxWidth: '540px', margin: '5rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <div className="card-glass" style={{ padding: '2.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Unable to Load Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {error || 'This report may have been deleted or is inaccessible.'}
          </p>
          <button onClick={onBack} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            <ArrowLeft size={16} />
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1160px', margin: '2rem auto', padding: '0 1.5rem 4rem' }}>
      
      {/* Top Header & Breadcrumb Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={onBack}
          className="btn-ghost"
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
          Back to Reports
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {onNavigateCompare && (
            <button
              onClick={() => onNavigateCompare(report.id)}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
            >
              <Activity size={14} color="var(--primary)" />
              Compare with Another Report
            </button>
          )}

          <button
            onClick={handleDelete}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Main Report Overview Banner */}
      <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                {report.original_filename}
              </h1>
              <span className={`badge badge-${report.processing_status.toLowerCase()}`}>
                <span className="status-dot"></span>
                {report.processing_status.replace('_', ' ')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.825rem', flexWrap: 'wrap' }}>
              <span>Document Date: <strong style={{ color: 'var(--text-primary)' }}>{report.document_date || 'Undated'}</strong></span>
              <span>Pages: <strong style={{ color: 'var(--text-primary)' }}>{report.page_count || 1}</strong></span>
              <span>Total Tests: <strong style={{ color: 'var(--text-primary)' }}>{observations.length}</strong></span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>ID: {report.id.substring(0, 8)}</span>
            </div>
          </div>

          {/* Quick Biometric Snapshot Pill Group */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '0.65rem 1rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-subtle)'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {observations.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginTop: '0.2rem' }}>
                Analyzed
              </div>
            </div>

            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(13, 148, 136, 0.25)',
              borderRadius: '12px',
              padding: '0.65rem 1rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-subtle)'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0D9488', lineHeight: 1.1 }}>
                {normalCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#0D9488', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginTop: '0.2rem' }}>
                In Range
              </div>
            </div>

            <div style={{
              backgroundColor: flaggedCount > 0 ? '#FFFBEB' : '#FFFFFF',
              border: flaggedCount > 0 ? '1px solid #FCD34D' : '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '0.65rem 1rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-subtle)'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: flaggedCount > 0 ? '#D97706' : 'var(--text-muted)', lineHeight: 1.1 }}>
                {flaggedCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: flaggedCount > 0 ? '#B45309' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginTop: '0.2rem' }}>
                Flagged
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edge-Case / Discrepancy Alert Banners */}
      {report.unreadable_pages && report.unreadable_pages > 0 ? (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.9rem' }}>
              Partial Scan Legibility ({report.unreadable_pages} unreadable page{report.unreadable_pages > 1 ? 's' : ''})
            </div>
            <p style={{ fontSize: '0.825rem', color: '#B91C1C', marginTop: '0.25rem', lineHeight: 1.45 }}>
              One or more scanned pages had faint ink, skewed alignment, or low optical contrast. Only parameters from high-confidence readable sections are listed below. Please cross-check unreadable pages on your paper copy.
            </p>
          </div>
        </div>
      ) : null}

      {hasConflicts && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start'
        }}>
          <ShieldAlert size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem' }}>
              Laboratory Flag vs. Published Range Conflict
            </div>
            <p style={{ fontSize: '0.825rem', color: '#B45309', marginTop: '0.25rem', lineHeight: 1.45 }}>
              A discrepancy was detected where the printed lab flag (e.g. HIGH/LOW) differs from the explicit printed numerical interval. ReportExplainer preserves the printed lab flag verbatim to ensure clinical audit fidelity.
            </p>
          </div>
        </div>
      )}

      {reviewNeeded && !hasConflicts && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem' }}>
              Verification Advisory
            </div>
            <p style={{ fontSize: '0.825rem', color: '#B45309', marginTop: '0.25rem', lineHeight: 1.45 }}>
              Certain extracted tests had ambiguous printed units or non-standard intervals. You can click the "Edit" button next to any row to supply manual corrections if needed.
            </p>
          </div>
        </div>
      )}

      {/* Plain-Language Clinical Synthesis Card */}
      {explanation && (
        <div className="card" style={{
          padding: '2rem',
          marginBottom: '2rem',
          borderRadius: '16px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284C7, #0D9488)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={17} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Plain-Language Clinical Overview
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Calm educational explanation grounded in verified laboratory data
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', backgroundColor: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 600 }}>
              <ShieldCheck size={14} />
              AI Deterministically Verified
            </div>
          </div>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.65, marginBottom: '1.5rem', fontWeight: 450 }}>
            {explanation.summary}
          </p>

          {/* Clinician Questions Interactive Block */}
          {explanation.questions_for_clinician.length > 0 && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-subtle)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem'
              }}>
                <HelpCircle size={16} color="var(--primary)" />
                Recommended Questions for Your Healthcare Provider
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {explanation.questions_for_clinician.map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-app)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      gap: '0.75rem'
                    }}
                  >
                    <span>{q}</span>
                    <button
                      onClick={() => handleCopyQuestion(q, idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedQuestionIndex === idx ? 'var(--teal-accent)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0
                      }}
                      title="Copy question text"
                    >
                      {copiedQuestionIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structured Biometric Table Container */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: '2.5rem', borderRadius: '16px' }}>
        
        {/* Table Top Filter & Search Bar */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Extracted Parameters & Reference Ranges
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Preserved with verbatim laboratory units and exact printed intervals
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Filter Pills */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-app)',
              padding: '0.2rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  background: activeTab === 'all' ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.775rem',
                  fontWeight: activeTab === 'all' ? 700 : 500,
                  color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'all' ? 'var(--shadow-subtle)' : 'none'
                }}
              >
                All ({observations.length})
              </button>
              <button
                onClick={() => setActiveTab('flagged')}
                style={{
                  background: activeTab === 'flagged' ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.775rem',
                  fontWeight: activeTab === 'flagged' ? 700 : 500,
                  color: activeTab === 'flagged' ? '#D97706' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'flagged' ? 'var(--shadow-subtle)' : 'none'
                }}
              >
                Out of Range ({flaggedCount})
              </button>
              <button
                onClick={() => setActiveTab('normal')}
                style={{
                  background: activeTab === 'normal' ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.775rem',
                  fontWeight: activeTab === 'normal' ? 700 : 500,
                  color: activeTab === 'normal' ? '#0D9488' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'normal' ? 'var(--shadow-subtle)' : 'none'
                }}
              >
                In Range ({normalCount})
              </button>
            </div>

            {/* Quick Search Field */}
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                placeholder="Search parameter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: '#FFFFFF',
                  outline: 'none'
                }}
              />
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
        </div>

        {filteredObservations.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>No parameters matched your filter</div>
            <p style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>Try clearing the search query or changing the filter tab.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Test Parameter
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Reported Value
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Reference Range
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Clinical Status
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    Audit & Provenance
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredObservations.map((obs) => {
                  const rangeText =
                    obs.reference_range.text ||
                    (obs.reference_range.low !== undefined && obs.reference_range.high !== undefined
                      ? `${obs.reference_range.low} – ${obs.reference_range.high}`
                      : 'None printed');

                  const isHigh = obs.reported_flag.toUpperCase() === 'HIGH';
                  const isLow = obs.reported_flag.toUpperCase() === 'LOW';
                  const isCritical = obs.reported_flag.toUpperCase() === 'CRITICAL';

                  return (
                    <tr
                      key={obs.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                            {obs.test_name}
                          </span>
                          {obs.is_user_corrected && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--teal-accent)', backgroundColor: 'var(--teal-light)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                              User Corrected
                            </span>
                          )}
                        </div>
                        {obs.test_name_original && obs.test_name_original !== obs.test_name && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Printed: {obs.test_name_original}
                          </div>
                        )}
                        {obs.flag_conflict && obs.discrepancy_note && (
                          <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '0.25rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertCircle size={13} />
                            {obs.discrepancy_note}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.35rem' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: isCritical ? '#DC2626' : (isHigh || isLow) ? '#D97706' : 'var(--text-primary)'
                          }}>
                            {obs.value_text}
                          </span>
                          {obs.unit && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                              {obs.unit}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                        {rangeText} {obs.unit && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{obs.unit}</span>}
                      </td>

                      <td style={{ padding: '1rem 1rem' }}>
                        <span className={`badge badge-${obs.reported_flag.toLowerCase()}`}>
                          <span className="status-dot"></span>
                          {obs.reported_flag}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setEditingObs(obs);
                              setEditVal(obs.value_text);
                              setEditUnit(obs.unit || '');
                              setEditNotes('');
                            }}
                            title="Correct OCR misread"
                            style={{
                              border: '1px solid var(--border-subtle)',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '6px',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              color: 'var(--primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              boxShadow: 'var(--shadow-subtle)'
                            }}
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>

                          <button
                            onClick={() => setActiveSnippet({ test: obs.test_name, page: obs.source.page, snippet: obs.source.snippet })}
                            title="View source snippet"
                            style={{
                              border: '1px solid var(--border-subtle)',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '6px',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              cursor: 'pointer',
                              fontWeight: 500,
                              boxShadow: 'var(--shadow-subtle)'
                            }}
                          >
                            <Eye size={12} />
                            Pg {obs.source.page || 1}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-Observation Parameter Explanations Grid */}
      {explanation && explanation.observations.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={16} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Individual Parameter Guides
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {explanation.observations.map((item) => (
              <div key={item.observation_id} className="card-glass" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {item.test_name}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                      Reported: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{item.reported_value}</strong>
                    </div>
                  </div>
                  <span className={`badge badge-${item.reported_flag.toLowerCase()}`}>
                    {item.reported_flag}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, flex: 1, marginTop: '0.5rem' }}>
                  {item.plain_language_explanation}
                </p>

                {item.uncertainty_note && (
                  <div style={{
                    marginTop: '0.75rem',
                    fontSize: '0.75rem',
                    color: '#92400E',
                    backgroundColor: '#FEF3C7',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #FDE68A'
                  }}>
                    {item.uncertainty_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Clinical Q&A Console */}
      <div className="card-glass" style={{ padding: '2rem', marginBottom: '2.5rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284C7, #0D9488)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Ask Clinical Questions About This Report
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Responses are anchored solely in your document parameters and accredited reference sources (MedlinePlus, CDC, WHO).
            </p>
          </div>
        </div>

        {/* Suggested Prompt Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1.25rem 0' }}>
          {[
            'What do these test results measure?',
            'What does my Hemoglobin result mean in plain English?',
            'How are reference intervals determined?',
            'What lifestyle factors can influence these markers?'
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAskQuestion(undefined, prompt)}
              style={{
                fontSize: '0.775rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: '9999px',
                padding: '0.35rem 0.85rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-subtle)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Q&A Chat History List */}
        {qaHistory.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '1.5rem',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '0.5rem'
          }}>
            {qaHistory.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1.15rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Q:</span> {item.q}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {item.a}
                </div>
                {item.safety && item.safety !== 'PASSED' && (
                  <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                    <ShieldAlert size={14} />
                    Clinical Safety Notice: {item.safety.replace('_', ' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleAskQuestion} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a clarifying question about an analyte, unit, or range..."
            disabled={qaLoading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-strong)',
              fontSize: '0.9rem',
              backgroundColor: '#FFFFFF',
              boxShadow: 'var(--shadow-subtle)'
            }}
          />
          <button
            type="submit"
            disabled={qaLoading || !question.trim()}
            className="btn-primary"
            style={{ padding: '0.75rem 1.35rem', borderRadius: '10px' }}
          >
            {qaLoading ? 'Analyzing...' : 'Ask'}
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Vetted Clinical Evidence Sources & Citations */}
      {explanation && explanation.citations.length > 0 && (
        <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={18} color="var(--teal-accent)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Accredited Clinical Sources & Citations
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {explanation.citations.map((c) => (
              <div
                key={c.chunk_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Publisher: {c.publisher}
                  </div>
                </div>

                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.75rem',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    padding: '0.35rem 0.55rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary-light)'
                  }}
                >
                  Source
                  <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snippet Provenance Modal */}
      {activeSnippet && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div className="card-glass" style={{ maxWidth: '540px', width: '100%', padding: '2rem', position: 'relative', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              Document Source Provenance
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Original optical snippet parsed for <strong>{activeSnippet.test}</strong> (Page {activeSnippet.page || 1})
            </p>

            <div style={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              padding: '1.15rem',
              borderRadius: '10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.825rem',
              color: '#38BDF8',
              whiteSpace: 'pre-wrap',
              marginBottom: '1.5rem',
              lineHeight: 1.55
            }}>
              {activeSnippet.snippet || 'No raw line snippet captured during optical extraction.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveSnippet(null)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                Close Provenance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Observation Correction Modal */}
      {editingObs && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          padding: '1rem'
        }}>
          <div className="card-glass" style={{ maxWidth: '480px', width: '100%', padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              Correct Extracted Value
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Update OCR misreads for <strong>{editingObs.test_name}</strong>. The original printed text ({editingObs.test_name_original}: {editingObs.value_text}) is safely preserved in the audit log.
            </p>

            <form onSubmit={handleSaveCorrection}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Value Text
                </label>
                <input
                  type="text"
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Unit
                </label>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Correction Notes (Immutable Audit Trail)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scanned numeral 8 misread as 3"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingObs(null)}
                  className="btn-secondary"
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Updating...' : 'Save Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
