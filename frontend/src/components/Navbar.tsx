import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, History, GitCompare, ShieldCheck, LogOut, LogIn, Activity } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  return (
    <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Activity size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Report<span style={{ color: 'var(--primary)' }}>Explainer</span>
            </span>
            <div style={{ fontSize: '0.675rem', color: 'var(--teal-accent)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Patient Clarity
            </div>
          </div>
        </div>

        {/* Navigation items */}
        {user ? (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentTab('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.375rem',
                border: 'none',
                background: currentTab === 'dashboard' ? 'var(--primary-light)' : 'transparent',
                color: currentTab === 'dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'dashboard' ? 600 : 500,
                fontSize: '0.875rem'
              }}
            >
              <Activity size={16} />
              Overview
            </button>

            <button
              onClick={() => setCurrentTab('upload')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.375rem',
                border: 'none',
                background: currentTab === 'upload' ? 'var(--primary-light)' : 'transparent',
                color: currentTab === 'upload' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'upload' ? 600 : 500,
                fontSize: '0.875rem'
              }}
            >
              <UploadCloud size={16} />
              Upload Report
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.375rem',
                border: 'none',
                background: currentTab === 'history' ? 'var(--primary-light)' : 'transparent',
                color: currentTab === 'history' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'history' ? 600 : 500,
                fontSize: '0.875rem'
              }}
            >
              <History size={16} />
              My Reports
            </button>

            <button
              onClick={() => setCurrentTab('compare')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.375rem',
                border: 'none',
                background: currentTab === 'compare' ? 'var(--primary-light)' : 'transparent',
                color: currentTab === 'compare' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'compare' ? 600 : 500,
                fontSize: '0.875rem'
              }}
            >
              <GitCompare size={16} />
              Compare
            </button>

            <button
              onClick={() => setCurrentTab('privacy')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.375rem',
                border: 'none',
                background: currentTab === 'privacy' ? 'var(--primary-light)' : 'transparent',
                color: currentTab === 'privacy' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'privacy' ? 600 : 500,
                fontSize: '0.875rem'
              }}
            >
              <ShieldCheck size={16} />
              Privacy
            </button>
          </nav>
        ) : (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setCurrentTab('privacy')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Privacy & Security
            </button>
            <button
              onClick={() => setCurrentTab('login')}
              className="btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}
            >
              <LogIn size={15} />
              Sign In
            </button>
            <button
              onClick={() => setCurrentTab('register')}
              className="btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}
            >
              Get Started
            </button>
          </nav>
        )}

        {/* User profile / Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.display_name || user.email.split('@')[0]}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                setCurrentTab('landing');
              }}
              title="Sign Out"
              style={{
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-app)',
                color: 'var(--text-secondary)',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
