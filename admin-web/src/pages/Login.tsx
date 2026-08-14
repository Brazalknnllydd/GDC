import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { Lock } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      // We must use fetch directly here because apiClient expects a token to already exist? 
      // Actually apiClient just sends what it has. Let's use fetch to be safe or just use apiClient.
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user?.role?.toLowerCase() !== 'admin') {
        throw new Error('Only admins can access the web dashboard');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      window.location.href = '/'; // hard reload to reset states
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', marginBottom: '1rem' }}>
            <Lock size={24} />
          </div>
          <h2 style={{ margin: 0 }}>GDC Admin</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>Sign in to continue</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>USERNAME</label>
            <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PASSWORD</label>
            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
