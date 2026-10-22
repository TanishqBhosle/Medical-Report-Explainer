export interface User {
  id: string;
  email: string;
  display_name?: string | null;
  status: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Report {
  id: string;
  owner_user_id: string;
  original_filename: string;
  media_type: string;
  file_size_bytes: number;
  page_count?: number | null;
  document_date?: string | null;
  laboratory_name?: string | null;
  processing_status: 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'NEEDS_REVIEW' | 'FAILED';
  language?: string;
  created_at: string;
}

export interface JobStatus {
  job_id: string;
  report_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  stage?: string | null;
  progress_percent: number;
  safe_error_code?: string | null;
  safe_error_message?: string | null;
}

export interface ReferenceRange {
  low?: number | null;
  high?: number | null;
  text?: string | null;
}

export interface SourceProvenance {
  page?: number | null;
  snippet?: string | null;
}

export interface Observation {
  id: string;
  report_id: string;
  test_name: string;
  test_name_original: string;
  value_text: string;
  value_numeric?: number | null;
  comparator?: string | null;
  unit?: string | null;
  reference_range: ReferenceRange;
  reported_flag: 'low' | 'normal' | 'high' | 'critical' | 'unknown';
  validation_status: 'verified' | 'needs_review' | 'invalid';
  extraction_confidence: number;
  source: SourceProvenance;
}

export interface CitationItem {
  source_id: string;
  chunk_id: string;
  title: string;
  publisher: string;
  source_url: string;
  relevant_snippet: string;
}

export interface PerObservationExplanation {
  observation_id: string;
  test_name: string;
  reported_value: string;
  reported_flag: string;
  plain_language_explanation: string;
  evidence_ids: string[];
  uncertainty_note?: string | null;
}

export interface ExplanationResponse {
  explanation_id: string;
  report_id: string;
  question?: string | null;
  summary: string;
  observations: PerObservationExplanation[];
  questions_for_clinician: string[];
  citations: CitationItem[];
  limitations: string[];
  safety_status: string;
  created_at: string;
}

export interface ParameterMatch {
  test_name: string;
  is_comparable: boolean;
  incompatibility_reason?: string | null;
  unit_a?: string | null;
  unit_b?: string | null;
  value_text_a?: string | null;
  value_text_b?: string | null;
  value_numeric_a?: number | null;
  value_numeric_b?: number | null;
  numeric_delta?: number | null;
  flag_a?: string | null;
  flag_b?: string | null;
  reference_a?: string | null;
  reference_b?: string | null;
}

export interface CompareResponse {
  report_id_a: string;
  report_id_b: string;
  document_date_a?: string | null;
  document_date_b?: string | null;
  matched_parameters: ParameterMatch[];
  unmatched_parameters_a: string[];
  unmatched_parameters_b: string[];
  notes: string[];
}
