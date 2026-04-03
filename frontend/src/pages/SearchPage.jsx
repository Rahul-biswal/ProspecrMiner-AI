import { useState } from 'react';
import { api } from '../api';

export default function SearchPage({ onJobStarted, showToast }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [loading, setLoading] = useState(false);

  const examples = [
    { query: 'Dentists', location: 'Chicago, IL' },
    { query: 'Personal Injury Lawyers', location: 'New York, NY' },
    { query: 'HVAC Companies', location: 'Houston, TX' },
    { query: 'Gyms & Fitness Centers', location: 'Los Angeles, CA' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !location.trim()) return;
    setLoading(true);
    try {
      const data = await api.startJob(query.trim(), location.trim(), maxResults);
      if (data.jobId) {
        showToast(`Job started! Mining "${query}" in ${location}...`);
        onJobStarted(data.jobId);
      } else {
        showToast(data.error || 'Failed to start job', 'error');
      }
    } catch (err) {
      showToast('Could not connect to backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section" style={{ paddingTop: '60px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px', borderRadius: '100px',
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
          fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-light)',
          marginBottom: '24px',
        }}>
          ⚡ AI-Powered Lead Intelligence
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '16px' }}>
          Mine qualified leads<br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            not just contacts
          </span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '520px', margin: '0 auto' }}>
          Search Google Maps + Google Search, visit every website with AI, and get enriched leads scored High / Medium / Low.
        </p>
      </div>

      {/* Search Form */}
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Business Type</label>
                <input
                  id="query-input"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Dentists, HVAC, Lawyers"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  id="location-input"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Chicago, IL"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Max Results
                <span style={{ color: 'var(--accent-light)', fontWeight: '700' }}>{maxResults} leads</span>
              </label>
              <input
                id="max-results-slider"
                type="range" min={5} max={100} step={5}
                className="form-range"
                value={maxResults}
                onChange={e => setMaxResults(parseInt(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>5</span><span>100</span>
              </div>
            </div>

            <button id="start-mining-btn" type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
              {loading ? (
                <><span className="animate-pulse">⏳</span> Starting Job...</>
              ) : (
                <><span>⛏️</span> Start Mining Leads</>
              )}
            </button>
          </form>
        </div>

        {/* Example Searches */}
        <div style={{ marginTop: '32px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'center' }}>Try an example:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {examples.map((ex, i) => (
              <button
                key={i}
                className="btn btn-secondary btn-sm"
                onClick={() => { setQuery(ex.query); setLocation(ex.location); }}
              >
                {ex.query} in {ex.location}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Pills */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '40px', flexWrap: 'wrap' }}>
          {[
            { icon: '🥷', label: 'Stealth Scraping' },
            { icon: '🤖', label: 'GPT-4o Enrichment' },
            { icon: '🎯', label: 'AI Lead Scoring' },
            { icon: '📧', label: 'Email Intelligence' },
            { icon: '📊', label: 'CSV / XLSX Export' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '100px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              fontSize: '0.8rem', color: 'var(--text-secondary)',
            }}>
              <span>{f.icon}</span> {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
