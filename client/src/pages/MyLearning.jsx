import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  BookOpenIcon,
  AwardIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  RefreshIcon
} from '../components/Icons';

export default function MyLearning() {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('courses');
  const [enrollments, setEnrollments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrollRes, resultRes] = await Promise.all([
        fetch('/api/enrollments/my', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/quizzes/results/my', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const enrollData = await enrollRes.json();
      const resultData = await resultRes.json();

      if (enrollData.success) {
        setEnrollments(enrollData.data || []);
      }
      if (resultData.success) {
        setResults(resultData.data || []);
      }
    } catch (err) {
      setError('Failed to fetch learning data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleUnenroll = async (courseId) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/enrollments/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Successfully dropped course.');
        fetchData();
      } else {
        setError(data.message || 'Failed to drop course');
      }
    } catch (err) {
      setError('Error dropping course');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loader">
          <RefreshIcon size={24} className="spin-icon" color="var(--blue)" />
          <span>Loading your enrolled courses and results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>My Learning Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>
            Monitor curriculum progress, access enrolled lessons, and review certifications
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'courses' ? 'btn-blue' : 'btn-secondary'}`}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpenIcon size={14} />
            Enrolled Courses ({enrollments.length})
          </button>
          <button
            className={`btn ${activeTab === 'results' ? 'btn-blue' : 'btn-secondary'}`}
            onClick={() => setActiveTab('results')}
          >
            <AwardIcon size={14} />
            Evaluations ({results.length})
          </button>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'courses' && (
        <>
          {enrollments.length === 0 ? (
            <div className="card empty-state">
              <BookOpenIcon size={40} color="var(--text-subtle)" />
              <h3 style={{ marginTop: '16px' }}>No Enrolled Courses Yet</h3>
              <p style={{ margin: '8px 0 20px', color: 'var(--text-muted)' }}>
                Explore the course directory and enter your access code to start learning today.
              </p>
              <Link to="/" className="btn btn-blue">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid">
              {enrollments.map((enrollment) => {
                const course = enrollment.courseId;
                if (!course) return null;

                return (
                  <div
                    key={enrollment._id}
                    className="card card-hoverable"
                    style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className="badge badge-student">{course.category || 'Course'}</span>
                        <span className={`status-badge ${enrollment.completed ? 'status-passed' : 'status-failed'}`}>
                          {enrollment.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </div>

                      <h3 style={{ margin: '8px 0', fontSize: '18px' }}>{course.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.45', marginBottom: '16px' }}>
                        {course.description ? (course.description.length > 100 ? `${course.description.substring(0, 100)}...` : course.description) : 'No description'}
                      </p>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                        Instructor: <strong style={{ color: 'var(--charcoal)' }}>{course.instructor?.name || 'Instructor'}</strong>
                      </p>
                    </div>

                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'var(--charcoal)' }}>
                          <span>Course Progress</span>
                          <strong>{enrollment.progress || 0}%</strong>
                        </div>
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${Math.min(100, enrollment.progress || 0)}%` }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link
                          to={`/courses/${course._id}`}
                          className="btn btn-jade btn-sm"
                          style={{ flex: 1 }}
                        >
                          Continue Learning
                          <ArrowRightIcon size={13} />
                        </Link>
                        <button
                          onClick={() => handleUnenroll(course._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--pink)', borderColor: 'var(--pink-border)' }}
                          title="Drop course"
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'results' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Your Quiz Assessment History</h3>
          {results.length === 0 ? (
            <div className="empty-state">
              <AwardIcon size={36} color="var(--text-subtle)" />
              <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>You have not attempted any quizzes yet.</p>
              <Link to="/" className="btn btn-blue" style={{ marginTop: '14px', display: 'inline-flex' }}>
                Explore Courses & Take Quizzes
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quiz Assessment</th>
                    <th>Score</th>
                    <th>Passing Threshold</th>
                    <th>Outcome</th>
                    <th>Submitted On</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600 }}>
                        {r.quizId?.title || 'Course Quiz'}
                      </td>
                      <td>
                        <strong>{r.score}</strong> / {r.totalQuestions} ({((r.score / (r.totalQuestions || 1)) * 100).toFixed(0)}%)
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {r.quizId?.passingPercentage || 50}%
                      </td>
                      <td>
                        <span className={`status-badge ${r.passed ? 'status-passed' : 'status-failed'}`}>
                          {r.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(r.submittedAt).toLocaleDateString()} {new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {r.quizId?._id && (
                          <Link to={`/quiz/${r.quizId._id}`} className="btn btn-secondary btn-sm">
                            Retake Quiz
                          </Link>
                        )}
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
