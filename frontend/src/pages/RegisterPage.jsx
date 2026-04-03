import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage({ onGoLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    const result = await register(name, email, password, inviteCode);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : password.length < 16 ? 3 : 4;
  const strengthLabel = ['', 'Too short', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'var(--danger)', 'var(--warning)', '#60a5fa', 'var(--success)'];

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>⛏️</div>
          <span style={styles.logoText}>Prospect<span style={{ color: 'var(--accent-light)' }}>Miner</span> AI</span>
        </div>

        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>Start mining AI-powered leads in minutes</p>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="register-name" type="text" className="form-input" placeholder="John Smith"
              value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="register-email" type="email" className="form-input" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="register-password" type="password" className="form-input" placeholder="At least 8 characters"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            {password.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '3px', borderRadius: '2px',
                      background: strength >= i ? strengthColor[strength] : 'var(--border)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: strengthColor[strength], marginTop: '4px', display: 'block' }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Invite Code — shows always, backend only enforces if INVITE_CODE is set */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Invite Code
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '400' }}>(optional)</span>
            </label>
            <input id="register-invite" type="text" className="form-input" placeholder="Enter invite code if required"
              value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
          </div>

          <button id="register-btn" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '4px' }} disabled={loading}>
            {loading ? <><span className="animate-pulse">⏳</span> Creating account...</> : '⛏️ Get Started Free'}
          </button>
        </form>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['Google Maps + Search scraping', 'GPT-4o AI enrichment', 'Lead scoring & email intelligence'].map(f => (
            <div key={f} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--success)' }}>✓</span> {f}
            </div>
          ))}
        </div>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <button onClick={onGoLogin} style={styles.switchLink}>Sign in</button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 60%)',
  },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
    padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' },
  logoIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', boxShadow: '0 0 20px var(--accent-glow)',
  },
  logoText: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' },
  title: { fontSize: '1.75rem', fontWeight: '800', marginBottom: '6px' },
  subtitle: { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  errorBox: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-sm)', padding: '12px 16px',
    color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '4px',
  },
  switchText: { textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' },
  switchLink: {
    background: 'none', border: 'none', color: 'var(--accent-light)',
    cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', padding: 0,
  },
};
