import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DemoPassword123!');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '420px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <LogIn size={22} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Welcome Back</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Sign in to access your secure medical reports
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#991B1B', fontSize: '0.85rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-strong)',
                  fontSize: '0.9rem'
                }}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-strong)',
                  fontSize: '0.9rem'
                }}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Accounts Quick-fill */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Quick fill testing credentials:
          </div>
          <button
            type="button"
            onClick={() => fillDemo('patient.demo@example.com')}
            style={{
              background: 'var(--bg-app)',
              border: '1px dashed var(--border-strong)',
              borderRadius: '0.375rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.775rem',
              color: 'var(--text-secondary)'
            }}
          >
            Fill: patient.demo@example.com
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600 }}
          >
            Create account
          </button>
        </div>

      </div>
    </div>
  );
};
