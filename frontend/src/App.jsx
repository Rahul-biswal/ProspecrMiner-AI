import { useState } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import JobsPage from './pages/JobsPage';
import ProgressPage from './pages/ProgressPage';
import LeadsPage from './pages/LeadsPage';

// Inner app — only rendered when authenticated
function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('search');
  const [activeJobId, setActiveJobId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const goToProgress = (jobId) => { setActiveJobId(jobId); setPage('progress'); };
  const goToLeads = (jobId) => { setActiveJobId(jobId); setPage('leads'); };

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container navbar-inner">
          <a className="logo" onClick={() => setPage('search')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">⛏️</div>
            Prospect<span>Miner</span> AI
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="nav-links">
              <button className={`nav-link ${page === 'search' ? 'active' : ''}`} onClick={() => setPage('search')}>New Search</button>
              <button className={`nav-link ${page === 'jobs' ? 'active' : ''}`} onClick={() => setPage('jobs')}>History</button>
              {activeJobId && (
                <>
                  <button className={`nav-link ${page === 'progress' ? 'active' : ''}`} onClick={() => setPage('progress')}>Progress</button>
                  <button className={`nav-link ${page === 'leads' ? 'active' : ''}`} onClick={() => setPage('leads')}>Leads</button>
                </>
              )}
            </div>

            {/* User menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px', paddingLeft: '16px', borderLeft: '1px solid var(--border)' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: '700', color: 'white',
                flexShrink: 0,
              }}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </span>
              <button
                id="logout-btn"
                onClick={logout}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Pages */}
      <main style={{ flex: 1 }}>
        {page === 'search' && <SearchPage onJobStarted={goToProgress} showToast={showToast} />}
        {page === 'jobs' && <JobsPage onViewProgress={goToProgress} onViewLeads={goToLeads} showToast={showToast} />}
        {page === 'progress' && activeJobId && <ProgressPage jobId={activeJobId} onViewLeads={() => goToLeads(activeJobId)} />}
        {page === 'leads' && activeJobId && <LeadsPage jobId={activeJobId} showToast={showToast} />}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// Auth gate — shown when not logged in
function AuthGate() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage] = useState('login');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '2.5rem' }}>⛏️</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }} className="animate-pulse">Loading ProspectMiner AI...</div>
      </div>
    );
  }

  if (!user) {
    return authPage === 'login'
      ? <LoginPage onGoRegister={() => setAuthPage('register')} />
      : <RegisterPage onGoLogin={() => setAuthPage('login')} />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
