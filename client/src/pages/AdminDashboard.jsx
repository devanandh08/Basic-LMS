import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  BarChartIcon,
  UsersIcon,
  BookOpenIcon,
  CheckCircleIcon,
  AwardIcon,
  SearchIcon,
  TrashIcon,
  RefreshIcon
} from '../components/Icons';

export default function AdminDashboard() {
  const { token, user: currentUser } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('summary');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);

  const fetchSummaryStats = async () => {
    try {
      const res = await fetch('/api/reports/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: userPage,
        limit: 10,
        ...(userSearch ? { search: userSearch } : {}),
        ...(roleFilter ? { role: roleFilter } : {})
      });
      const res = await fetch(`/api/auth/users?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        setUserTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecentResults = async () => {
    try {
      const res = await fetch('/api/quizzes/results/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchSummaryStats(), fetchUsers(), fetchRecentResults()]);
      setLoading(false);
    };
    if (token) {
      loadAll();
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [userPage, roleFilter]);

  const handleSearchUsers = (e) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('User role permission updated successfully.');
        fetchUsers();
        fetchSummaryStats();
      } else {
        setError(data.message || 'Failed to update role');
      }
    } catch (err) {
      setError('Error updating user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('User deleted successfully.');
        fetchUsers();
        fetchSummaryStats();
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      setError('Error deleting user');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loader">
          <RefreshIcon size={24} className="spin-icon" color="var(--blue)" />
          <span>Generating administrative analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Administration & Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
            System-level control center for user credentials, courses, and evaluation records
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'summary' ? 'btn-blue' : 'btn-secondary'}`}
            onClick={() => setActiveTab('summary')}
          >
            <BarChartIcon size={14} />
            Analytics Summary
          </button>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-blue' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
          >
            <UsersIcon size={14} />
            User Management
          </button>
          <button
            className={`btn ${activeTab === 'results' ? 'btn-blue' : 'btn-secondary'}`}
            onClick={() => setActiveTab('results')}
          >
            <AwardIcon size={14} />
            Submissions ({results.length})
          </button>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'summary' && (
        <div className="grid">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Total Students</span>
              <UsersIcon size={18} color="var(--jade)" />
            </div>
            <h2 style={{ fontSize: '32px', marginTop: '10px', color: 'var(--jade)' }}>{stats?.totalStudents || 0}</h2>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Instructors</span>
              <AwardIcon size={18} color="var(--red)" />
            </div>
            <h2 style={{ fontSize: '32px', marginTop: '10px', color: 'var(--red)' }}>{stats?.totalInstructors || 0}</h2>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Total Courses</span>
              <BookOpenIcon size={18} color="var(--blue)" />
            </div>
            <h2 style={{ fontSize: '32px', marginTop: '10px', color: 'var(--blue)' }}>{stats?.totalCourses || 0}</h2>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Enrollments</span>
              <CheckCircleIcon size={18} color="var(--obsidian)" />
            </div>
            <h2 style={{ fontSize: '32px', marginTop: '10px', color: 'var(--obsidian)' }}>{stats?.totalEnrollments || 0}</h2>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Completion Rate</span>
              <BarChartIcon size={18} color="var(--jade)" />
            </div>
            <h2 style={{ fontSize: '32px', marginTop: '10px', color: 'var(--jade)' }}>{stats?.completionRate || 0}%</h2>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Quiz Pass Rate</span>
              <AwardIcon size={18} color="var(--blue-accent)" />
            </div>
            <h2 style={{ fontSize: '32px', marginTop: '10px', color: 'var(--blue-accent)' }}>{stats?.quizPassRate || 0}%</h2>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '18px' }}>User Directory & Permissions</h3>
            <form onSubmit={handleSearchUsers} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search user or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ width: '220px', paddingLeft: '32px' }}
                />
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                  <SearchIcon size={13} />
                </div>
              </div>
              <select
                className="form-control"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setUserPage(1); }}
                style={{ width: '130px' }}
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
                <option value="admin">Admins</option>
              </select>
              <button type="submit" className="btn btn-sm">Filter</button>
            </form>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registration</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                      No users match the search filters.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="form-control"
                          style={{ padding: '4px 8px', fontSize: '13px', width: '120px' }}
                          disabled={u._id === currentUser?.id}
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u._id !== currentUser?.id ? (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--pink)', borderColor: 'var(--pink-border)' }}
                          >
                            <TrashIcon size={12} />
                            Delete
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>(Current)</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {userTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={userPage <= 1}
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
                Page {userPage} of {userTotalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={userPage >= userTotalPages}
                onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Student Quiz Submissions & Evaluations</h3>
          {results.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No student quiz results recorded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Assessment</th>
                    <th>Score</th>
                    <th>Outcome</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <strong>{r.studentId?.name || 'Student'}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.studentId?.email}</div>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {r.quizId?.title || 'Quiz Assessment'}
                      </td>
                      <td>
                        {r.score} / {r.totalQuestions} ({((r.score / (r.totalQuestions || 1)) * 100).toFixed(0)}%)
                      </td>
                      <td>
                        <span className={`status-badge ${r.passed ? 'status-passed' : 'status-failed'}`}>
                          {r.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(r.submittedAt).toLocaleDateString()} {new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
