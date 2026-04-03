export default function LeadModal({ lead, onClose, showToast }) {
  const scoreColor = { High: 'var(--success)', Medium: 'var(--warning)', Low: 'var(--danger)' };
  const bd = lead.scoreBreakdown || {};

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const scoreDimensions = [
    { label: 'Website Quality', value: bd.websiteQuality || 0, max: 30 },
    { label: 'Keyword Density', value: bd.keywordDensity || 0, max: 25 },
    { label: 'Query Match (AI)', value: bd.queryMatchScore || 0, max: 30 },
    { label: 'Business Signals', value: bd.businessSignals || 0, max: 15 },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>{lead.businessName}</h2>
              <span className={`badge badge-${lead.qualificationScore?.toLowerCase() || 'pending'}`}>
                {lead.qualificationScore || 'Unscored'}
              </span>
            </div>
            {lead.address && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>📍 {lead.address}</p>}
            {lead.phoneNumber && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>📞 {lead.phoneNumber}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Score Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '24px' }}>
            {/* Score Ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={scoreColor[lead.qualificationScore] || 'var(--text-muted)'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(bd.overallScore / 100) * 264} 264`}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: scoreColor[lead.qualificationScore] || 'var(--text-primary)' }}>{bd.overallScore || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 100</div>
                </div>
              </div>
              <div style={{ marginTop: '8px', fontWeight: '700', fontSize: '0.875rem', color: scoreColor[lead.qualificationScore] || 'var(--text-muted)' }}>
                {lead.qualificationScore || 'Unscored'}
              </div>
            </div>

            {/* Score Bars */}
            <div className="score-bars">
              {scoreDimensions.map((dim) => (
                <div key={dim.label} className="score-bar-row">
                  <div className="score-bar-label">
                    <span>{dim.label}</span>
                    <span>{dim.value} / {dim.max}</span>
                  </div>
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${(dim.value / dim.max) * 100}%`,
                        background: `linear-gradient(90deg, var(--accent), var(--accent-light))`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          {lead.aiSummary && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-light)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🤖 AI Summary</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{lead.aiSummary}</p>
            </div>
          )}

          {/* Services & Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Services Offered</div>
              {lead.servicesOffered?.length ? (
                <div className="tags">{lead.servicesOffered.map((s, i) => <span key={i} className="tag">{s}</span>)}</div>
              ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>—</p>}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Key Insights</div>
              {lead.keyInsights?.length ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {lead.keyInsights.map((ins, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                      <span style={{ color: 'var(--success)' }}>✓</span> {ins}
                    </li>
                  ))}
                </ul>
              ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>—</p>}
            </div>
          </div>

          {/* Certifications */}
          {lead.certifications?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>🏆 Certifications</div>
              <div className="tags">{lead.certifications.map((c, i) => <span key={i} className="tag" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.2)' }}>{c}</span>)}</div>
            </div>
          )}

          {/* Email Intelligence */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📧 Email Formats</div>
              <span style={{
                padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem',
                background: lead.mxRecordValid ? 'var(--success-light)' : 'var(--danger-light)',
                color: lead.mxRecordValid ? 'var(--success)' : 'var(--danger)',
              }}>
                MX {lead.mxRecordValid ? '✓ Valid' : '✗ Invalid'}
              </span>
            </div>
            {lead.emailFormats?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {lead.emailFormats.slice(0, 6).map((email, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <code style={{ fontSize: '0.85rem', color: 'var(--accent-light)' }}>{email}</code>
                    <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(email)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Copy</button>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No email formats generated</p>}
          </div>

          {/* External Links */}
          {lead.websiteUrl && (
            <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              🔗 Visit Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
