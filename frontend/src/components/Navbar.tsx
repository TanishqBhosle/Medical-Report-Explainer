import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, History, GitCompare, ShieldCheck, LogOut, LogIn, Activity, LayoutDashboard, ChevronRight } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'PT';
  };

  return (
    <header style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 50, 
      backgroundColor: 'rgba(255, 255, 255, 0.88)', 
      backdropFilter: 'blur(16px)', 
      WebkitBackdropFilter: 'blur(16px)', 
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab(user ? 'dashboard' : 'landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ 
            width: '38px', 
            height: '38px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #0284C7 0%, #0D9488 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#FFFFFF',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                Report<span style={{ color: 'var(--primary)' }}>Explainer</span>
              </span>
              <span style={{ 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                backgroundColor: 'var(--teal-light)', 
                color: 'var(--teal-accent)', 
                padding: '0.1rem 0.45rem', 
                borderRadius: '4px',
                border: '1px solid #99F6E4',
                letterSpacing: '0.04em'
              }}>
                PRO
              </span>
            </div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
              Clinical Intelligence & Traceability
            </div>
          </div>
        </div>

        {/* Navigation items */}
        {user ? (
          <nav style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            backgroundColor: 'rgba(241, 245, 249, 0.7)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <button
              onClick={() => setCurrentTab('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: currentTab === 'dashboard' ? '#FFFFFF' : 'transparent',
                color: currentTab === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'dashboard' ? 600 : 500,
                fontSize: '0.85rem',
                boxShadow: currentTab === 'dashboard' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <LayoutDashboard size={15} color={currentTab === 'dashboard' ? 'var(--primary)' : 'currentColor'} />
              Dashboard
            </button>

            <button
              onClick={() => setCurrentTab('upload')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: currentTab === 'upload' ? '#FFFFFF' : 'transparent',
                color: currentTab === 'upload' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'upload' ? 600 : 500,
                fontSize: '0.85rem',
                boxShadow: currentTab === 'upload' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <UploadCloud size={15} color={currentTab === 'upload' ? 'var(--primary)' : 'currentColor'} />
              Analyze Report
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: currentTab === 'history' ? '#FFFFFF' : 'transparent',
                color: currentTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'history' ? 600 : 500,
                fontSize: '0.85rem',
                boxShadow: currentTab === 'history' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <History size={15} color={currentTab === 'history' ? 'var(--primary)' : 'currentColor'} />
              Records
            </button>

            <button
              onClick={() => setCurrentTab('compare')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: currentTab === 'compare' ? '#FFFFFF' : 'transparent',
                color: currentTab === 'compare' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'compare' ? 600 : 500,
                fontSize: '0.85rem',
                boxShadow: currentTab === 'compare' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <GitCompare size={15} color={currentTab === 'compare' ? 'var(--primary)' : 'currentColor'} />
              Compare
            </button>

            <button
              onClick={() => setCurrentTab('privacy')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: currentTab === 'privacy' ? '#FFFFFF' : 'transparent',
                color: currentTab === 'privacy' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: currentTab === 'privacy' ? 600 : 500,
                fontSize: '0.85rem',
                boxShadow: currentTab === 'privacy' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none'
              }}
            >
              <ShieldCheck size={15} color={currentTab === 'privacy' ? 'var(--primary)' : 'currentColor'} />
              Privacy
            </button>
          </nav>
        ) : (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => setCurrentTab('privacy')}
              className="btn-ghost"
              style={{ fontSize: '0.875rem' }}
            >
              Clinical Trust
            </button>
            <button
              onClick={() => setCurrentTab('login')}
              className="btn-secondary"
              style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem' }}
            >
              <LogIn size={15} />
              Sign In
            </button>
            <button
              onClick={() => setCurrentTab('register')}
              className="btn-primary"
              style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem' }}
            >
              Get Started
              <ChevronRight size={15} />
            </button>
          </nav>
        )}

        {/* User profile / Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.65rem',
              backgroundColor: 'var(--bg-subtle)',
              padding: '0.3rem 0.65rem 0.3rem 0.35rem',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)', 
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.725rem',
                fontWeight: 700
              }}>
                {getInitials(user.display_name, user.email)}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.display_name || user.email.split('@')[0]}
                </div>
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
                background: '#FFFFFF',
                color: 'var(--text-secondary)',
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-xs)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#DC2626';
                e.currentTarget.style.borderColor = '#FCA5A5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
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
