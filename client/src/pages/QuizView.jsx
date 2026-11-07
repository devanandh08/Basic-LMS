import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LockIcon,
  KeyIcon,
  CheckCircleIcon,
  RefreshIcon,
  AwardIcon,
  ArrowRightIcon
} from '../components/Icons';

export default function QuizView() {
  const { quizId } = useParams();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [requiresCode, setRequiresCode] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const fetchQuiz = async (providedCode = '') => {
    setLoading(true);
    setError('');
    setCodeError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (providedCode) {
        headers['x-access-code'] = providedCode;
      }

      const res = await fetch(`/api/quizzes/${quizId}`, { headers });
      const data = await res.json();

      if (res.status === 403 && data.codeRequired) {
        setRequiresCode(true);
        setError(data.message);
      } else if (data.success && data.data) {
        setQuiz(data.data.quiz);
        setQuestions(data.data.questions || []);
        setRequiresCode(false);
        if (data.data.latestResult) {
          setResult(data.data.latestResult);
        }
      } else {
        setError(data.message || 'Failed to load quiz');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQuiz();
    }
  }, [quizId, token]);

  const handleUnlockQuiz = (e) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;
    fetchQuiz(accessCodeInput.trim().toUpperCase());
  };

  const handleOptionChange = (questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedAnswers = Object.keys(selectedAnswers).map((qId) => ({
      questionId: qId,
      selectedOption: selectedAnswers[qId],
    }));

    if (formattedAnswers.length < questions.length) {
      if (!window.confirm('You have not answered all questions. Submit anyway?')) {
        return;
      }
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      if (accessCodeInput) {
        headers['x-access-code'] = accessCodeInput;
      }

      const res = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          quizId: quiz._id,
          answers: formattedAnswers,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.message || 'Error submitting quiz');
      }
    } catch (err) {
      alert('Error submitting quiz answers');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loader">
          <RefreshIcon size={24} className="spin-icon" color="var(--gold)" />
          <span>Loading quiz assessment...</span>
        </div>
      </div>
    );
  }

  if (requiresCode) {
    return (
      <div className="container" style={{ maxWidth: '520px', marginTop: '40px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '36px 24px', border: '1.5px solid rgba(59, 130, 246, 0.35)', background: 'linear-gradient(135deg, #09090b 0%, #0f172a 60%, #1e1b4b 100%)', color: '#ffffff', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(9, 9, 11, 0.8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', border: '1.5px solid #38bdf8', boxShadow: '0 0 16px rgba(56, 189, 248, 0.3)' }}>
            <LockIcon size={24} color="#38bdf8" />
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: '#ffffff' }}>Course Access Code Required</h2>
          <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
            This quiz is restricted to enrolled students. Enter your course access code to begin your evaluation. (Demo: <strong style={{ color: '#93c5fd' }}>POTTER101</strong>)
          </p>

          {codeError && <div className="alert alert-error">{codeError}</div>}

          <form onSubmit={handleUnlockQuiz}>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Enter Code (e.g. POTTER101)"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-blue" style={{ width: '100%' }}>
              <KeyIcon size={14} color="#ffffff" />
              Unlock & Start Quiz
            </button>
          </form>

          <Link to="/" className="btn btn-secondary btn-sm" style={{ marginTop: '16px', display: 'inline-block' }}>
            Return to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="container" style={{ maxWidth: '520px' }}>
        <div className="card empty-state">
          <h2>Notice</h2>
          <p style={{ color: 'var(--pink)', margin: '12px 0' }}>{error}</p>
          <Link to="/" className="btn btn-secondary">
            Return to Courses
          </Link>
        </div>
      </div>
    );
  }

  const isTeacher = user && (user.role === 'admin' || user.role === 'instructor');

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="badge badge-student">
              <AwardIcon size={12} color="var(--jade)" />
              Assessment
            </span>
            <h1 style={{ fontSize: '24px', margin: '8px 0 4px 0' }}>{quiz?.title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Passing Threshold: <strong>{quiz?.passingPercentage}%</strong> · Questions: <strong>{questions.length}</strong>
            </p>
          </div>

          <Link to={quiz?.courseId ? `/courses/${quiz.courseId}` : '/'} className="btn btn-secondary btn-sm">
            Back to Course
          </Link>
        </div>
      </div>

      {result && (
        <div
          className="card"
          style={{
            marginBottom: '28px',
            border: result.passed ? '2px solid var(--jade-border)' : '2px solid var(--pink-border)',
            background: result.passed ? 'var(--jade-surface)' : 'var(--pink-surface)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className={`status-badge ${result.passed ? 'status-passed' : 'status-failed'}`}>
                {result.passed ? 'PASSED' : 'FAILED'}
              </span>
              <h2 style={{ fontSize: '22px', margin: '8px 0 4px 0' }}>
                Your Score: {result.score} / {result.totalQuestions} ({result.percentage}%)
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--charcoal)' }}>
                {result.passed
                  ? 'Congratulations! You successfully cleared the passing threshold for this quiz.'
                  : `You needed ${quiz?.passingPercentage}% to pass. You can retake the assessment below.`}
              </p>
            </div>

            <button
              onClick={() => { setResult(null); setSelectedAnswers({}); }}
              className="btn btn-secondary btn-sm"
            >
              <RefreshIcon size={13} />
              Retake Quiz
            </button>
          </div>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="card empty-state">
          <h3>No questions available</h3>
          <p>This quiz does not have any questions configured yet.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {questions.map((q, qIndex) => {
            const isAnswered = selectedAnswers[q._id] !== undefined;

            return (
              <div key={q._id} className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--obsidian)' }}>
                    Question {qIndex + 1} of {questions.length}
                  </h3>
                  {isAnswered && (
                    <span style={{ fontSize: '12px', color: 'var(--jade)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircleIcon size={12} color="var(--jade)" />
                      Answered
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--charcoal)', marginBottom: '16px' }}>
                  {q.questionText}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options.map((opt, oIndex) => {
                    const isSelected = selectedAnswers[q._id] === oIndex;
                    const isCorrect = isTeacher && q.correctOptionIndex === oIndex;

                    return (
                      <label
                        key={oIndex}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1.5px solid var(--obsidian)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--surface)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name={`question-${q._id}`}
                          value={oIndex}
                          checked={isSelected}
                          onChange={() => handleOptionChange(q._id, oIndex)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--obsidian)' }}
                        />
                        <span style={{ fontSize: '14px', color: 'var(--obsidian)', flex: 1 }}>{opt}</span>
                        {isCorrect && (
                          <span className="badge badge-student" style={{ fontSize: '11px' }}>
                            Correct Answer (Instructor View)
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Completed: <strong>{Object.keys(selectedAnswers).length}</strong> of <strong>{questions.length}</strong>
            </span>
            <button type="submit" className="btn btn-blue">
              Submit Answers & View Score
              <ArrowRightIcon size={14} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
