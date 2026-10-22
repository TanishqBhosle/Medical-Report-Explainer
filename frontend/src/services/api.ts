import type {
  AuthResponse,
  User,
  Report,
  JobStatus,
  Observation,
  ExplanationResponse,
  CompareResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private getHeaders(isFormData = false): HeadersInit {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let errPayload: any;
      try {
        errPayload = await res.json();
      } catch {
        errPayload = { error: { message: res.statusText || 'An error occurred' } };
      }
      const message =
        errPayload?.error?.message ||
        errPayload?.detail?.message ||
        errPayload?.detail ||
        'Request failed';
      throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
    }
    return res.json();
  }

  // Auth
  async register(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    return this.handleResponse<AuthResponse>(res);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse<AuthResponse>(res);
  }

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<User>(res);
  }

  // Reports
  async uploadReport(file: File, documentDate?: string): Promise<{ report_id: string; job_id: string; status: string; status_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('consent_to_processing', 'true');
    if (documentDate) {
      formData.append('document_date', documentDate);
    }

    const res = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    return this.handleResponse(res);
  }

  async listReports(skip = 0, limit = 50): Promise<{ total: number; items: Report[] }> {
    const res = await fetch(`${API_BASE_URL}/reports?skip=${skip}&limit=${limit}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  async getReport(reportId: string): Promise<Report> {
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Report>(res);
  }

  async deleteReport(reportId: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  // Jobs
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<JobStatus>(res);
  }

  // Observations
  async getObservations(reportId: string): Promise<{ report_id: string; observations: Observation[] }> {
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}/observations`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  // Explanations
  async generateExplanation(reportId: string, question?: string): Promise<ExplanationResponse> {
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}/explanations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ question }),
    });
    return this.handleResponse<ExplanationResponse>(res);
  }

  async getExplanation(reportId: string, explanationId: string): Promise<ExplanationResponse> {
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}/explanations/${explanationId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<ExplanationResponse>(res);
  }

  // Compare
  async compareReports(reportIdA: string, reportIdB: string): Promise<CompareResponse> {
    const res = await fetch(`${API_BASE_URL}/reports/compare`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ report_id_a: reportIdA, report_id_b: reportIdB }),
    });
    return this.handleResponse<CompareResponse>(res);
  }

  // Health
  async checkHealth(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE_URL}/health/live`);
    return this.handleResponse(res);
  }
}

export const api = new ApiClient();
