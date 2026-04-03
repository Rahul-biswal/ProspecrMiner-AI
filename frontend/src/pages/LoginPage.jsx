import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onGoRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>⛏️</div>
          <span style={styles.logoText}>Prospect<span style={{ color: 'var(--accent-light)' }}>Miner</span> AI</span>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your account to continue mining leads</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button id="login-btn" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? <><span className="animate-pulse">⏳</span> Signing in...</> : '→ Sign In'}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{' '}
          <button onClick={onGoRegister} style={styles.switchLink}>Create one free</button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 60%)',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '28px',
  },
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
    background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-sm)', padding: '12px 16px',
    color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '4px',
  },
  switchText: {
    textAlign: 'center', marginTop: '24px',
    fontSize: '0.875rem', color: 'var(--text-muted)',
  },
  switchLink: {
    background: 'none', border: 'none', color: 'var(--accent-light)',
    cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', padding: 0,
  },
};
