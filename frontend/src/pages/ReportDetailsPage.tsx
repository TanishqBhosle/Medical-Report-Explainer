import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Report, Observation, ExplanationResponse, CitationItem } from '../types';
import {
  ArrowLeft, Trash2, AlertCircle, BookOpen,
  HelpCircle, Send, ExternalLink, ShieldAlert, Sparkles, Eye
} from 'lucide-react';

interface ReportDetailsPageProps {
  reportId: string;
  onBack: () => void;
  onDeleted: () => void;
}

export const ReportDetailsPage: React.FC<ReportDetailsPageProps> = ({ reportId, onBack, onDeleted }) => {
  const [report, setReport] = useState<Report | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string; safety?: string; citations?: CitationItem[] }[]>([]);

  // Provenance snippet modal
  const [activeSnippet, setActiveSnippet] = useState<{ test: string; page?: number | null; snippet?: string | null } | null>(null);

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

        // Fetch or generate initial plain-language explanation
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

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '4rem auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Loading your report analysis...
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Retrieving extracted observations and clinical citations.
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <AlertCircle size={36} color="#DC2626" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Unable to load report</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {error || 'Report was not found.'}
          </p>
          <button onClick={onBack} className="btn-secondary">
            <ArrowLeft size={16} />
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const reviewNeeded = observations.some((o) => o.validation_status === 'needs_review');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* Top action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} />
          Back to Reports
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge badge-${report.processing_status.toLowerCase()}`}>
            {report.processing_status.replace('_', ' ')}
          </span>
          <button
            onClick={handleDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FCA5A5',
              color: '#DC2626',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.375rem',
              fontSize: '0.825rem',
              fontWeight: 500
            }}
          >
            <Trash2 size={14} />
            Delete Report
          </button>
        </div>
      </div>

      {/* Report Info Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              {report.original_filename}
            </h1>
            <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.825rem', flexWrap: 'wrap' }}>
              <span>Report Date: <strong>{report.document_date || 'Not specified'}</strong></span>
              <span>Pages: <strong>{report.page_count || 1}</strong></span>
              <span>Total Extracted Parameters: <strong>{observations.length}</strong></span>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)', padding: '0.4rem 0.75rem', borderRadius: '0.375rem' }}>
            ID: {report.id.substring(0, 8)}...
          </div>
        </div>
      </div>

      {/* Uncertain Extraction Banner */}
      {reviewNeeded && (
        <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#92400E', fontSize: '0.875rem' }}>
              Verification Notice
            </div>
            <p style={{ fontSize: '0.825rem', color: '#B45309', marginTop: '0.2rem' }}>
              One or more extracted fields did not have an unambiguous printed reference interval or had ambiguous OCR text. Please inspect your original laboratory paper for those parameters.
            </p>
          </div>
        </div>
      )}

      {/* AI Plain-Language Summary Card */}
      {explanation && (
        <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--teal-light)', color: 'var(--teal-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Plain-Language Clinical Overview
            </h2>
            <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
              AI-GENERATED EXPLANATION
            </span>
          </div>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {explanation.summary}
          </p>

          {/* Clinician questions */}
          {explanation.questions_for_clinician.length > 0 && (
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '1rem 1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <HelpCircle size={15} color="var(--primary)" />
                Suggested Questions to Ask Your Clinician:
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {explanation.questions_for_clinician.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Structured Observations Table */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Extracted Test Results & Ranges
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Values and reference intervals preserved verbatim from the report
            </p>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            Total: <strong>{observations.length}</strong>
          </div>
        </div>

        {observations.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No structured test parameters were detected in this document.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Test Parameter</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Reported Value</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Reference Range</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Flag</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Provenance</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((obs) => {
                  const rangeText =
                    obs.reference_range.text ||
                    (obs.reference_range.low !== undefined && obs.reference_range.high !== undefined
                      ? `${obs.reference_range.low} - ${obs.reference_range.high}`
                      : 'None printed');

                  return (
                    <tr
                      key={obs.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {obs.test_name}
                        </div>
                        {obs.test_name_original !== obs.test_name && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            Printed: {obs.test_name_original}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {obs.value_text} {obs.unit && <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{obs.unit}</span>}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                        {rangeText}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge badge-${obs.reported_flag.toLowerCase()}`}>
                          {obs.reported_flag}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: obs.validation_status === 'verified' ? 'var(--teal-accent)' : '#B45309', fontWeight: 600 }}>
                          {obs.validation_status === 'verified' ? 'Verified' : 'Needs Review'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setActiveSnippet({ test: obs.test_name, page: obs.source.page, snippet: obs.source.snippet })}
                          title="View source snippet in document"
                          style={{
                            border: '1px solid var(--border-strong)',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Eye size={13} />
                          Page {obs.source.page || 1}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-Observation Plain-Language Breakdown */}
      {explanation && explanation.observations.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Detailed Parameter Explanations
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {explanation.observations.map((item) => (
              <div key={item.observation_id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.975rem', color: 'var(--text-primary)' }}>
                    {item.test_name}
                  </div>
                  <span className={`badge badge-${item.reported_flag.toLowerCase()}`}>
                    {item.reported_flag}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Reported: <strong>{item.reported_value}</strong>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  {item.plain_language_explanation}
                </p>

                {item.uncertainty_note && (
                  <div style={{ fontSize: '0.775rem', color: '#B45309', backgroundColor: '#FEF3C7', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    {item.uncertainty_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Report Q&A Assistant */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <BookOpen size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Ask About This Report
          </h3>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Ask educational questions grounded strictly in this report and vetted medical reference sources.
        </p>

        {/* Quick Question Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            'What do these test results measure?',
            'What is the meaning of my Hemoglobin result?',
            'Explain the reference range concept.'
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAskQuestion(undefined, prompt)}
              style={{
                fontSize: '0.775rem',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '9999px',
                padding: '0.35rem 0.75rem',
                color: 'var(--text-secondary)'
              }}
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Q&A Chat History */}
        {qaHistory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '380px', overflowY: 'auto' }}>
            {qaHistory.map((item, idx) => (
              <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                  Q: {item.q}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.a}
                </div>
                {item.safety && item.safety !== 'PASSED' && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                    <ShieldAlert size={14} />
                    Clinical Safety Notice: {item.safety.replace('_', ' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input box */}
        <form onSubmit={handleAskQuestion} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about a specific test term or reference interval..."
            disabled={qaLoading}
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-strong)',
              fontSize: '0.9rem'
            }}
          />
          <button
            type="submit"
            disabled={qaLoading || !question.trim()}
            className="btn-primary"
            style={{ padding: '0.7rem 1.25rem' }}
          >
            {qaLoading ? 'Thinking...' : 'Ask'}
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Citations & Reference Sources */}
      {explanation && explanation.citations.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Vetted Clinical Evidence Sources & Citations
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {explanation.citations.map((c) => (
              <div key={c.chunk_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-subtle)', borderRadius: '0.375rem', backgroundColor: '#FFFFFF' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Publisher: {c.publisher}
                  </div>
                </div>

                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.75rem',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Verify Source
                  <ExternalLink size={13} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snippet Provenance Modal */}
      {activeSnippet && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '1.75rem', position: 'relative' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Document Source Provenance
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Original snippet parsed for <strong>{activeSnippet.test}</strong> (Page {activeSnippet.page || 1})
            </p>

            <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-strong)', padding: '1rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {activeSnippet.snippet || 'No line snippet captured during extraction.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveSnippet(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
