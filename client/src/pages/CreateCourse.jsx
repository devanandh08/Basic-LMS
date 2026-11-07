import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { PlusIcon, KeyIcon, ArrowRightIcon } from '../components/Icons';

export default function CreateCourse() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Web Development',
    description: '',
    accessCode: 'LMS-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    isPrivate: false,
    isPublished: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGenerateCode = () => {
    const newCode = 'LMS-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData((prev) => ({ ...prev, accessCode: newCode }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create course');
      }

      navigate(`/courses/${data.data._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '640px', marginTop: '24px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Create New Course</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Configure course information and student access authorization</p>
          </div>
          <Link to="/" className="btn btn-secondary btn-sm">
            Cancel
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course Title *</label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Full-Stack Web Development Masterclass"
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              className="form-control"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="Web Development">Web Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
            </select>
          </div>

          <div className="form-group">
            <label>Course Access Code * (Students provide this to unlock materials & tests)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                name="accessCode"
                className="form-control"
                value={formData.accessCode}
                onChange={(e) => setFormData(prev => ({ ...prev, accessCode: e.target.value.toUpperCase() }))}
                style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}
                placeholder="e.g. REACT2026"
                required
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                className="btn btn-secondary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
              >
                <KeyIcon size={13} />
                Generate Code
              </button>
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Share this code with your class so they can unlock course lessons and take evaluations.
            </small>
          </div>

          <div className="form-group">
            <label>Course Cover Image URL (Optional)</label>
            <input
              type="url"
              name="imageUrl"
              className="form-control"
              value={formData.imageUrl || ''}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Quick Presets:</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80' }))}
              >
                Code / Web
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80' }))}
              >
                Data Science
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80' }))}
              >
                Cyber / Magic
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80' }))}
              >
                UI/UX Design
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              className="form-control"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a comprehensive syllabus overview..."
              required
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              style={{ width: '16px', height: '16px', accentColor: 'var(--obsidian)' }}
            />
            <label htmlFor="isPublished" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '13.5px' }}>
              Publish immediately to course catalog
            </label>
          </div>

          <button type="submit" className="btn btn-blue" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            {loading ? 'Creating Course...' : 'Create Course & Proceed'}
            <ArrowRightIcon size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}