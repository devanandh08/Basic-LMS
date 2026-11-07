import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowRightIcon } from '../components/Icons';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      loginUser(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '440px', marginTop: '40px' }}>
      <div className="card">
        <h2 style={{ fontSize: '24px', marginBottom: '6px' }}>Create an Account</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '22px' }}>
          Select your access level to begin learning or instructing
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password (Min 6 Characters)</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Select Role</label>
            <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student (Enrol, learn, attempt quizzes)</option>
              <option value="instructor">Instructor (Create courses, publish quizzes)</option>
              <option value="admin">Administrator (System control, user management)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-blue" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Registering...' : 'Register Account'}
            <ArrowRightIcon size={14} />
          </button>
        </form>

        <p style={{ marginTop: '22px', fontSize: '13.5px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--obsidian)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
