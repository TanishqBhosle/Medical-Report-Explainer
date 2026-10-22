import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { ReportDetailsPage } from './pages/ReportDetailsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ComparePage } from './pages/ComparePage';
import { PrivacyPage } from './pages/PrivacyPage';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [initialCompareId, setInitialCompareId] = useState<string | undefined>(undefined);

  // If authenticated and on landing page initially, switch to dashboard
  React.useEffect(() => {
    if (user && (currentTab === 'landing' || currentTab === 'login' || currentTab === 'register')) {
      setCurrentTab('dashboard');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
        Loading ReportExplainer workspace...
      </div>
    );
  }

  const navigateToReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentTab('report-detail');
  };

  const navigateToCompare = (reportIdA?: string) => {
    setInitialCompareId(reportIdA);
    setCurrentTab('compare');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main style={{ flex: 1 }}>
        {currentTab === 'landing' && (
          <LandingPage
            onGetStarted={() => setCurrentTab(user ? 'upload' : 'login')}
            onExplorePrivacy={() => setCurrentTab('privacy')}
          />
        )}

        {currentTab === 'login' && (
          <LoginPage
            onSuccess={() => setCurrentTab('dashboard')}
            onSwitchToRegister={() => setCurrentTab('register')}
          />
        )}

        {currentTab === 'register' && (
          <RegisterPage
            onSuccess={() => setCurrentTab('dashboard')}
            onSwitchToLogin={() => setCurrentTab('login')}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            onNavigateUpload={() => setCurrentTab('upload')}
            onNavigateReport={navigateToReport}
            onNavigateCompare={() => navigateToCompare()}
          />
        )}

        {currentTab === 'upload' && (
          <UploadPage
            onProcessingComplete={(repId) => navigateToReport(repId)}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'report-detail' && selectedReportId && (
          <ReportDetailsPage
            reportId={selectedReportId}
            onBack={() => setCurrentTab('history')}
            onDeleted={() => setCurrentTab('history')}
          />
        )}

        {currentTab === 'history' && (
          <HistoryPage
            onSelectReport={navigateToReport}
            onNavigateUpload={() => setCurrentTab('upload')}
            onNavigateCompare={navigateToCompare}
          />
        )}

        {currentTab === 'compare' && (
          <ComparePage initialReportIdA={initialCompareId} />
        )}

        {currentTab === 'privacy' && (
          <PrivacyPage />
        )}
      </main>

      <Footer />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
