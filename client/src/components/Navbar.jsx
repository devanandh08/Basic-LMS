import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  KeyIcon,
  ShieldCheckIcon,
  AwardIcon,
  GraduationCapIcon,
  PlusIcon,
  CheckCircleIcon,
  LockIcon
} from './Icons';

export default function Navbar() {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [accessCode, setAccessCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [bannerNotice, setBannerNotice] = useState(null);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleUnlockCode = async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setVerifying(true);
    setBannerNotice(null);

    try {
      const res = await fetch('/api/courses/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const courseId = data.data._id;
        const saved = JSON.parse(localStorage.getItem('unlocked_course_ids') || '[]');
        const updated = Array.from(new Set([...saved, courseId]));
        localStorage.setItem('unlocked_course_ids', JSON.stringify(updated));

        setBannerNotice({
          type: 'success',
          text: `Access Granted to "${data.data.title}". Opening course...`
        });
        setAccessCode('');

        setTimeout(() => {
          navigate(`/courses/${courseId}`);
          setBannerNotice(null);
        }, 1200);
      } else {
        setBannerNotice({
          type: 'error',
          text: data.message || 'Invalid course access code. Please verify with your instructor.'
        });
      }
    } catch {
      setBannerNotice({
        type: 'error',
        text: 'Network error verifying access code.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-brand">
          <div className="brand-crest">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <span>Basic LMS</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
            <span>Courses</span>
          </Link>

          {user ? (
            <>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                    <ShieldCheckIcon size={15} />
                    <span>Admin Control</span>
                  </Link>
                  <Link to="/instructor/create-course" className={`nav-link ${isActive('/instructor/create-course') ? 'active' : ''}`}>
                    <PlusIcon size={15} />
                    <span>Create Course</span>
                  </Link>
                </>
              )}

              {user.role === 'instructor' && (
                <Link to="/instructor/create-course" className={`nav-link ${isActive('/instructor/create-course') ? 'active' : ''}`}>
                  <PlusIcon size={15} />
                  <span>Create Course</span>
                </Link>
              )}

              {user.role === 'student' && (
                <Link to="/my-learning" className={`nav-link ${isActive('/my-learning') ? 'active' : ''}`}>
                  <GraduationCapIcon size={15} />
                  <span>My Learning</span>
                </Link>
              )}

              <span className={`badge badge-${user.role}`} style={{ marginLeft: '6px' }}>
                {user.role === 'admin' && <ShieldCheckIcon size={12} color="var(--blue-light)" />}
                {user.role === 'instructor' && <AwardIcon size={12} color="var(--red-accent)" />}
                {user.role === 'student' && <GraduationCapIcon size={12} color="var(--jade)" />}
                <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
              </span>

              <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ marginLeft: '8px' }}>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
              <Link to="/login" className="nav-link">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-blue btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>

      <div className="access-subnav">
        <div className="access-subnav-inner">
          <div className="access-subnav-info">
            <span className="access-subnav-tag">
              <KeyIcon size={12} color="#60a5fa" />
              Course Access Portal
            </span>
            <span>Enter instructor access code (e.g. <strong style={{ color: '#93c5fd' }}>POTTER101</strong>) to unlock course materials & tests</span>
          </div>

          <form onSubmit={handleUnlockCode} className="access-subnav-form">
            <input
              type="text"
              className="access-subnav-input"
              placeholder="e.g. POTTER101"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              disabled={verifying}
            />
            <button
              type="submit"
              className="btn btn-blue btn-sm"
              disabled={verifying || !accessCode.trim()}
            >
              {verifying ? 'Verifying...' : 'Unlock Course'}
            </button>
          </form>
        </div>

        {bannerNotice && (
          <div
            style={{
              maxWidth: '1200px',
              margin: '8px auto 0 auto',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: bannerNotice.type === 'success' ? '#064e3b' : '#831843',
              color: '#ffffff',
              border: bannerNotice.type === 'success' ? '1px solid #059669' : '1px solid #be185d'
            }}
          >
            {bannerNotice.type === 'success' ? <CheckCircleIcon size={14} color="#ffffff" /> : <LockIcon size={14} color="#ffffff" />}
            <span>{bannerNotice.text}</span>
          </div>
        )}
      </div>
    </header>
  );
}
