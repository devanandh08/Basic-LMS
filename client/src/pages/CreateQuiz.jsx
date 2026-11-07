import React, { useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { PlusIcon, ArrowRightIcon, KeyIcon } from '../components/Icons';

export default function CreateQuiz() {
  const { courseId } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
    },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuestionChange = (qIndex, text) => {
    const updated = [...questions];
    updated[qIndex].questionText = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, text) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = text;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].correctOptionIndex = Number(oIndex);
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          title,
          passingPercentage: Number(passingPercentage),
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create quiz');

      navigate(`/courses/${courseId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '720px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Create Course Assessment</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Build multiple choice evaluation questions and passing criteria</p>
          </div>
          <Link to={`/courses/${courseId}`} className="btn btn-secondary btn-sm">
            Cancel
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Quiz Title</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Core Architecture Assessment"
              required
            />
          </div>

          <div className="form-group">
            <label>Passing Percentage (%)</label>
            <input
              type="number"
              className="form-control"
              min="1"
              max="100"
              value={passingPercentage}
              onChange={(e) => setPassingPercentage(e.target.value)}
              required
            />
          </div>

          <h3 style={{ margin: '24px 0 14px 0', fontSize: '17px' }}>Questions ({questions.length})</h3>
          {questions.map((q, qIndex) => (
            <div key={qIndex} style={{ padding: '18px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '18px', background: 'var(--surface)' }}>
              <div className="form-group">
                <label>Question {qIndex + 1} Prompt</label>
                <input
                  type="text"
                  className="form-control"
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                  placeholder="Enter the question query or problem statement"
                  required
                />
              </div>

              <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Options (Select the radio corresponding to the correct answer):
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={q.correctOptionIndex === oIndex}
                      onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--jade)' }}
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={opt}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button type="button" onClick={addQuestion} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
            <PlusIcon size={14} />
            Add Another Question
          </button>

          <button type="submit" className="btn btn-blue" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Publishing Assessment...' : 'Publish Assessment'}
            <ArrowRightIcon size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}