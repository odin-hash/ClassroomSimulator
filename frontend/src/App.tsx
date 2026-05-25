import { useState } from 'react';
import { TRANSLATIONS } from './localization';
import type { Language } from './localization';
import { ThemeToggle } from './components/ThemeToggle';
import { Dashboard } from './pages/Dashboard';
import { Classroom } from './pages/Classroom';
import { Analytics } from './pages/Analytics';
import { API_BASE_URL } from './config';

function App() {
  const [language, setLanguage] = useState<Language>('English');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'classroom' | 'analytics'>('dashboard');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const t = TRANSLATIONS[language];

  // Callback to start a new classroom simulation
  const handleStartSession = async (sessionData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) throw new Error('Failed to create session');
      
      const data = await response.json();
      setCurrentSessionId(data.id);
      setCurrentPage('classroom');
    } catch (err) {
      console.error('Error starting session:', err);
      alert('Could not start simulation. Is the Python backend server running?');
    }
  };

  // Callback to view analytical scorecard of a past session
  const handleSelectPastSession = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setCurrentPage('analytics');
  };

  // Callback to complete session and view scores
  const handleEndSession = (sessionId: number) => {
    console.log("Session completed:", sessionId);
    setCurrentPage('analytics');
  };

  // Callback to exit simulator back to dashboard
  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit the simulation? Active progress will be evaluated.')) {
      setCurrentPage('analytics');
    }
  };

  const handleBackToDashboard = () => {
    setCurrentSessionId(null);
    setCurrentPage('dashboard');
  };

  return (
    <div className="app-container">
      {currentPage === 'classroom' ? (
        currentSessionId !== null && (
          <Classroom
            sessionId={currentSessionId}
            language={language}
            onEndSession={handleEndSession}
            onExit={handleExit}
          />
        )
      ) : (
        <>
          {/* Navbar Header */}
          <header className="navbar">
            <div className="nav-logo" onClick={handleBackToDashboard} style={{ cursor: 'pointer' }}>
              <span style={{ fontSize: '1.75rem' }}>🏫</span>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.1 }}>
                  {t.title}
                </h1>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {t.subtitle}
                </p>
              </div>
            </div>

            <div className="nav-actions">
              {/* Language selector */}
              <select 
                className="lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                id="nav-lang-select"
              >
                <option value="English">English</option>
                <option value="Hindi">हिंदी (Hindi)</option>
                <option value="Bengali">বাংলা (Bengali)</option>
              </select>

              {/* Theme switcher */}
              <ThemeToggle />
            </div>
          </header>

          {/* Page Routing Container */}
          <main className="main-content">
            {currentPage === 'dashboard' && (
              <Dashboard
                language={language}
                onStartSession={handleStartSession}
                onSelectPastSession={handleSelectPastSession}
              />
            )}

            {currentPage === 'analytics' && currentSessionId !== null && (
              <Analytics
                sessionId={currentSessionId}
                language={language}
                onBackToDashboard={handleBackToDashboard}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
