import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';

interface RegisterPageProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consent) {
      setError('Please acknowledge the clinical disclaimer and consent to educational processing.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, displayName || undefined);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '440px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--teal-light)', color: 'var(--teal-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <UserPlus size={22} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Create Patient Account</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Begin understanding your diagnostic reports securely
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#991B1B', fontSize: '0.85rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Full Name (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-strong)',
                  fontSize: '0.9rem'
                }}
              />
              <UserIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

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
              Password (Min 8 characters)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                minLength={8}
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

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="consent" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              I understand this tool provides educational explanations and does not diagnose disease or prescribe medications. I consent to report text processing.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600 }}
          >
            Sign in
          </button>
        </div>

      </div>
    </div>
  );
};
