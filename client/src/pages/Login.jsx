import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  ShieldCheckIcon,
  AwardIcon,
  GraduationCapIcon,
  ArrowRightIcon,
  LockIcon,
  UserIcon
} from '../components/Icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLoginSubmit = async (loginEmail, loginPass) => {
    setError('');
    setLoading(true);

    try {
      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });
      let data = await res.json();

      if (!res.ok && loginEmail.includes('@lms.com')) {
        const role = loginEmail.includes('admin') ? 'admin' : (loginEmail.includes('instructor') ? 'instructor' : 'student');
        const name = role.charAt(0).toUpperCase() + role.slice(1) + ' User';
        
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email: loginEmail, password: loginPass, role })
        });
        const regData = await regRes.json();
        if (regRes.ok) {
          loginUser(regData.token, regData.user);
          navigate('/');
          return;
        }
      }

      if (!res.ok) throw new Error(data.message || 'Login failed');

      loginUser(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginSubmit(email, password);
  };

  const handleQuickDemo = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('password123');
    handleLoginSubmit(demoEmail, 'password123');
  };

  return (
    <div className="container" style={{ maxWidth: '440px', marginTop: '40px' }}>
      <div className="card">
        <h2 style={{ fontSize: '24px', marginBottom: '6px' }}>Sign In</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '22px' }}>
          Access your courses, quizzes, and learning dashboard
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@lms.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-blue" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRightIcon size={14} />
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Instant Evaluation Demo Accounts:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@lms.com', 'admin')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', padding: '7px 4px' }}
            >
              <ShieldCheckIcon size={13} color="var(--blue)" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('instructor@lms.com', 'instructor')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', padding: '7px 4px' }}
            >
              <AwardIcon size={13} color="var(--red)" />
              Instructor
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('student@lms.com', 'student')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', padding: '7px 4px' }}
            >
              <GraduationCapIcon size={13} color="var(--jade)" />
              Student
            </button>
          </div>
        </div>

        <p style={{ marginTop: '22px', fontSize: '13.5px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--obsidian)', fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
