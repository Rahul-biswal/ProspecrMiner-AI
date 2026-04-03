import { useEffect, useState } from 'react';
import { api } from '../api';

export default function JobsPage({ onViewProgress, onViewLeads, showToast }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await api.listJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch { setJobs([]); }
    setLoading(false);
  };

  const handleDelete = async (jobId) => {
    await api.deleteJob(jobId);
    showToast('Job deleted');
    loadJobs();
  };

  const statusColor = { completed: 'var(--success)', running: 'var(--accent)', failed: 'var(--danger)', queued: 'var(--warning)' };

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>📋 Job History</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Your recent mining jobs</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadJobs}>🔄 Refresh</button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="animate-pulse" style={{ fontSize: '2rem' }}>⏳</div></div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No jobs yet</div>
          <div className="empty-text">Start a new search to mine leads.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {jobs.map((job) => (
            <div key={job.jobId} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontWeight: '700', fontSize: '1rem' }}>
                      "{job.query}" in {job.location}
                    </h3>
                    <span style={{
                      padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '700',
                      background: `color-mix(in srgb, ${statusColor[job.status] || '#fff'} 15%, transparent)`,
                      color: statusColor[job.status] || 'var(--text-muted)',
                      border: `1px solid color-mix(in srgb, ${statusColor[job.status] || '#fff'} 30%, transparent)`,
                    }}>
                      {job.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>✅ {job.processedLeads} processed</span>
                    <span>📋 {job.totalLeads} total</span>
                    {job.failedLeads > 0 && <span style={{ color: 'var(--danger)' }}>❌ {job.failedLeads} failed</span>}
                    <span>🕐 {new Date(job.createdAt).toLocaleString()}</span>
                  </div>

                  {/* Mini progress bar */}
                  {job.totalLeads > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div className="progress-container" style={{ height: '4px' }}>
                        <div className="progress-bar" style={{
                          width: `${Math.round(((job.processedLeads + job.failedLeads) / job.totalLeads) * 100)}%`,
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {['running', 'queued'].includes(job.status) && (
                    <button className="btn btn-secondary btn-sm" onClick={() => onViewProgress(job.jobId)}>Live View</button>
                  )}
                  {job.status === 'completed' && (
                    <button className="btn btn-primary btn-sm" onClick={() => onViewLeads(job.jobId)}>View Leads</button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(job.jobId)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
