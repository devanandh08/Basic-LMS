import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LockIcon,
  UnlockIcon,
  KeyIcon,
  BookOpenIcon,
  CheckCircleIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
  VideoIcon,
  ArrowRightIcon,
  RefreshIcon
} from '../components/Icons';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [completedLessonIds, setCompletedLessonIds] = useState([]);

  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonContent, setEditLessonContent] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');

  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCourseCat, setEditCourseCat] = useState('Web Development');
  const [editAccessCode, setEditAccessCode] = useState('');

  const fetchCourseData = async () => {
    try {
      const [courseRes, lessonRes, quizRes] = await Promise.all([
        fetch(`/api/courses/${id}`),
        fetch(`/api/lessons/course/${id}`),
        fetch(`/api/quizzes/course/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      const courseData = await courseRes.json();
      const lessonData = await lessonRes.json();
      const quizData = await quizRes.json();

      if (courseData.success) {
        setCourse(courseData.data);
        setEditCourseTitle(courseData.data.title);
        setEditCourseDesc(courseData.data.description);
        setEditCourseCat(courseData.data.category);
        setEditAccessCode(courseData.data.accessCode || 'POTTER101');

        const unlockedList = JSON.parse(localStorage.getItem('unlocked_course_ids') || '[]');
        if (unlockedList.includes(id)) {
          setIsUnlocked(true);
        }
      }
      if (lessonData.success) {
        setLessons(lessonData.data || []);
      }
      if (quizData.success && Array.isArray(quizData.data)) {
        setQuizzes(quizData.data);
      } else {
        setQuizzes([]);
      }

      if (token) {
        const myEnrollments = await fetch('/api/enrollments/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const enrollData = await myEnrollments.json();
        if (enrollData.success && Array.isArray(enrollData.data)) {
          const myEnroll = enrollData.data.find(
            (e) => (e.courseId?._id || e.courseId) === id
          );
          if (myEnroll) {
            setEnrolled(true);
            setEnrollment(myEnroll);
            setIsUnlocked(true);
          } else {
            setEnrolled(false);
            setEnrollment(null);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [id, token]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;
    setAccessCodeError('');

    try {
      const res = await fetch('/api/courses/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCodeInput.trim(), courseId: id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsUnlocked(true);
        const unlockedList = JSON.parse(localStorage.getItem('unlocked_course_ids') || '[]');
        const updated = Array.from(new Set([...unlockedList, id]));
        localStorage.setItem('unlocked_course_ids', JSON.stringify(updated));
        setMessage('Access code accepted. Course materials and quizzes are unlocked.');
      } else {
        setAccessCodeError(data.message || 'Incorrect access code');
      }
    } catch (err) {
      setAccessCodeError('Error validating code');
    }
  };

  const handleEnroll = async () => {
    if (!user) return navigate('/login');
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/enrollments/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnrolled(true);
        setIsUnlocked(true);
        setEnrollment(data.data);
        setMessage('Successfully enrolled in course.');
        fetchCourseData();
      } else {
        setError(data.message || 'Failed to enroll');
      }
    } catch (err) {
      setError('Failed to enroll.');
    }
  };

  const handleUnenroll = async () => {
    if (!window.confirm('Are you sure you want to drop this course? Your progress will be reset.')) return;
    try {
      const res = await fetch(`/api/enrollments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEnrolled(false);
        setEnrollment(null);
        setCompletedLessonIds([]);
        setMessage('Successfully dropped course.');
      } else {
        alert(data.message || 'Failed to drop course');
      }
    } catch (err) {
      alert('Error dropping course');
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: id,
          title: lessonTitle,
          content: lessonContent,
          videoUrl,
          order: lessons.length + 1,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Lesson published successfully.');
        setLessonTitle('');
        setLessonContent('');
        setVideoUrl('');
        setShowLessonForm(false);
        fetchCourseData();
      } else {
        setError(data.message || 'Failed to create lesson');
      }
    } catch (err) {
      setError('Error adding lesson');
    }
  };

  const handleStartEditLesson = (lesson) => {
    setEditingLessonId(lesson._id);
    setEditLessonTitle(lesson.title);
    setEditLessonContent(lesson.content);
    setEditVideoUrl(lesson.videoUrl || '');
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/lessons/${editingLessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editLessonTitle,
          content: editLessonContent,
          videoUrl: editVideoUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingLessonId(null);
        setMessage('Lesson updated successfully.');
        fetchCourseData();
      } else {
        alert(data.message || 'Failed to update lesson');
      }
    } catch (err) {
      alert('Error updating lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Lesson deleted successfully.');
        fetchCourseData();
      } else {
        alert(data.message || 'Failed to delete lesson');
      }
    } catch (err) {
      alert('Error deleting lesson');
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editCourseTitle,
          description: editCourseDesc,
          category: editCourseCat,
          accessCode: editAccessCode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditCourseModal(false);
        setMessage('Course details updated successfully.');
        fetchCourseData();
      } else {
        alert(data.message || 'Failed to update course');
      }
    } catch (err) {
      alert('Error updating course');
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this course?')) return;
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert('Course deleted successfully');
        navigate('/');
      } else {
        alert(data.message || 'Failed to delete course');
      }
    } catch (err) {
      alert('Error deleting course');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Quiz deleted successfully.');
        fetchCourseData();
      } else {
        alert(data.message || 'Failed to delete quiz');
      }
    } catch (err) {
      alert('Error deleting quiz');
    }
  };

  const handleToggleLessonComplete = async (lessonId) => {
    const isCompleted = completedLessonIds.includes(lessonId);
    const updated = isCompleted
      ? completedLessonIds.filter((lid) => lid !== lessonId)
      : [...completedLessonIds, lessonId];

    setCompletedLessonIds(updated);

    const total = lessons.length;
    const progress = total > 0 ? Math.round((updated.length / total) * 100) : 0;

    try {
      await fetch('/api/enrollments/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: id,
          progress,
        }),
      });
      if (enrollment) {
        setEnrollment((prev) => ({
          ...prev,
          progress,
          completed: progress === 100,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyAccessCode = () => {
    const code = course?.accessCode || 'POTTER101';
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loader">
          <RefreshIcon size={24} className="spin-icon" color="var(--blue)" />
          <span>Loading course materials...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container">
        <div className="card empty-state">
          <BookOpenIcon size={40} color="var(--text-subtle)" />
          <h2 style={{ marginTop: '16px' }}>Course not found</h2>
          <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>The requested course could not be located in the catalog.</p>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px' }}>
            Return to Courses
          </Link>
        </div>
      </div>
    );
  }

  const isInstructor = user && (user.role === 'admin' || user.id === course.instructor?._id || user.id === course.instructor);
  const courseCode = course.accessCode || 'POTTER101';
  const canAccessContent = isInstructor || isUnlocked || enrolled;

  return (
    <div className="container">
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span className="badge badge-student">
                <BookOpenIcon size={12} />
                {course.category}
              </span>
              {canAccessContent ? (
                <span className="badge badge-unlocked">
                  <UnlockIcon size={12} color="var(--jade)" />
                  Unlocked
                </span>
              ) : (
                <span className="badge badge-locked">
                  <LockIcon size={12} color="var(--red-accent)" />
                  Access Code Protected
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>{course.title}</h1>
          </div>

          {isInstructor && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowEditCourseModal(!showEditCourseModal)}
                className="btn btn-secondary btn-sm"
              >
                <EditIcon size={13} />
                Edit Details
              </button>
              <button
                onClick={handleDeleteCourse}
                className="btn btn-danger btn-sm"
              >
                <TrashIcon size={13} />
                Delete Course
              </button>
            </div>
          )}
        </div>

        <p style={{ color: 'var(--charcoal)', fontSize: '15px', lineHeight: '1.6', margin: '8px 0 16px 0' }}>
          {course.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Course Instructor: <strong style={{ color: 'var(--obsidian)' }}>{course.instructor?.name || 'Instructor'}</strong> ({course.instructor?.email || 'N/A'})
          </div>

          {isInstructor ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Student Access Code:</span>
              <span className="badge-code" style={{ padding: '4px 10px', borderRadius: 'var(--radius-xs)', fontSize: '13px', fontWeight: 700 }}>
                {courseCode}
              </span>
              <button onClick={copyAccessCode} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '12px' }}>
                <CopyIcon size={12} />
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LockIcon size={14} color="var(--red-accent)" />
              Code Protected Enrollment
            </div>
          )}
        </div>

        {enrolled && enrollment && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--jade-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--jade-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span>
                <strong>Your Progress:</strong> {completedLessonIds.length} of {lessons.length} lessons completed
              </span>
              <strong style={{ color: enrollment.completed ? 'var(--jade)' : 'var(--obsidian)' }}>
                {enrollment.progress || 0}% ({enrollment.completed ? 'Completed' : 'In Progress'})
              </strong>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, enrollment.progress || 0)}%` }}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isInstructor ? (
            <>
              <button onClick={() => setShowLessonForm(!showLessonForm)} className="btn btn-jade">
                <PlusIcon size={15} />
                {showLessonForm ? 'Close Lesson Form' : 'Add Lesson'}
              </button>
              <Link to={`/instructor/create-quiz/${id}`} className="btn btn-blue">
                <PlusIcon size={15} />
                Create New Quiz
              </Link>
            </>
          ) : enrolled ? (
            <>
              <span className="badge badge-student" style={{ padding: '6px 12px' }}>
                <CheckCircleIcon size={14} color="var(--jade)" />
                Enrolled in this course
              </span>
              <button onClick={handleUnenroll} className="btn btn-secondary btn-sm" style={{ color: 'var(--red)' }}>
                Drop Course
              </button>
            </>
          ) : canAccessContent ? (
            <button onClick={handleEnroll} className="btn btn-jade">
              <CheckCircleIcon size={15} />
              Enroll in Course
            </button>
          ) : null}
        </div>
      </div>

      {!canAccessContent && (
        <div className="card" style={{ marginBottom: '28px', border: '1.5px solid rgba(59, 130, 246, 0.35)', background: 'linear-gradient(135deg, #09090b 0%, #0f172a 60%, #1e1b4b 100%)', color: '#ffffff', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' }}>
          <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto', padding: '20px 0' }}>
            <div style={{ width: '52px', height: '52px', background: 'rgba(9, 9, 11, 0.8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', border: '1.5px solid #38bdf8', boxShadow: '0 0 16px rgba(56, 189, 248, 0.3)' }}>
              <LockIcon size={24} color="#38bdf8" />
            </div>
            <h2 style={{ fontSize: '22px', marginBottom: '8px', color: '#ffffff' }}>Enter Course Access Code</h2>
            <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              The curriculum and assessments in this course require authorization. Enter the instructor-provided code to unlock all materials. (Demo code: <strong style={{ color: '#93c5fd' }}>{courseCode}</strong>)
            </p>

            {accessCodeError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{accessCodeError}</div>}

            <form onSubmit={handleVerifyCode} style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Access Code (e.g. POTTER101)"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                style={{ maxWidth: '240px', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', borderColor: 'rgba(59, 130, 246, 0.4)' }}
                required
              />
              <button type="submit" className="btn btn-blue">
                <KeyIcon size={14} color="#ffffff" />
                Unlock Course
              </button>
            </form>
          </div>
        </div>
      )}

      {isInstructor && showEditCourseModal && (
        <div className="card" style={{ marginBottom: '28px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '16px' }}>Edit Course Details</h3>
          <form onSubmit={handleUpdateCourse}>
            <div className="form-group">
              <label>Course Title</label>
              <input
                type="text"
                className="form-control"
                value={editCourseTitle}
                onChange={(e) => setEditCourseTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-control"
                value={editCourseCat}
                onChange={(e) => setEditCourseCat(e.target.value)}
              >
                <option value="Web Development">Web Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
              </select>
            </div>
            <div className="form-group">
              <label>Course Access Code</label>
              <input
                type="text"
                className="form-control"
                value={editAccessCode}
                onChange={(e) => setEditAccessCode(e.target.value.toUpperCase())}
                style={{ fontFamily: 'monospace', fontWeight: 600 }}
                placeholder="e.g. POTTER101"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={editCourseDesc}
                onChange={(e) => setEditCourseDesc(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-jade">Save Changes</button>
              <button type="button" onClick={() => setShowEditCourseModal(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isInstructor && showLessonForm && (
        <div className="card" style={{ marginBottom: '28px', background: 'var(--jade-surface)', border: '1px solid var(--jade-border)' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--jade)' }}>Add New Lesson</h3>
          <form onSubmit={handleCreateLesson}>
            <div className="form-group">
              <label>Lesson Title</label>
              <input
                type="text"
                className="form-control"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g. Advanced Routing Patterns"
                required
              />
            </div>
            <div className="form-group">
              <label>Lesson Content / Notes</label>
              <textarea
                className="form-control"
                rows="4"
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
                placeholder="Write lesson notes, syllabus outline, or code walkthrough..."
                required
              />
            </div>
            <div className="form-group">
              <label>Optional Video or Reference URL</label>
              <input
                type="url"
                className="form-control"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video"
              />
            </div>
            <button type="submit" className="btn btn-jade">
              <PlusIcon size={14} />
              Publish Lesson
            </button>
          </form>
        </div>
      )}

      {canAccessContent && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          <div className="card">
            <h2 style={{ fontSize: '19px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpenIcon size={18} color="var(--jade)" />
              Lessons Curriculum ({lessons.length})
            </h2>

            {lessons.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No lessons uploaded yet for this course.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lessons.map((lesson) => {
                  const isEditing = editingLessonId === lesson._id;
                  const isCompleted = completedLessonIds.includes(lesson._id);

                  return (
                    <div
                      key={lesson._id}
                      style={{
                        padding: '16px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        background: isCompleted ? 'var(--jade-surface)' : '#ffffff',
                      }}
                    >
                      {isEditing ? (
                        <form onSubmit={handleUpdateLesson}>
                          <div className="form-group">
                            <label>Edit Title</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editLessonTitle}
                              onChange={(e) => setEditLessonTitle(e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Edit Content</label>
                            <textarea
                              className="form-control"
                              rows="3"
                              value={editLessonContent}
                              onChange={(e) => setEditLessonContent(e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Edit Video URL</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editVideoUrl}
                              onChange={(e) => setEditVideoUrl(e.target.value)}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" className="btn btn-jade btn-sm">Save</button>
                            <button type="button" onClick={() => setEditingLessonId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {enrolled && (
                                <input
                                  type="checkbox"
                                  checked={isCompleted}
                                  onChange={() => handleToggleLessonComplete(lesson._id)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--jade)' }}
                                  title="Mark as completed"
                                />
                              )}
                              <h4 style={{ fontSize: '15px' }}>{lesson.order}. {lesson.title}</h4>
                              {isCompleted && (
                                <span className="status-badge status-passed" style={{ fontSize: '11px' }}>
                                  Done
                                </span>
                              )}
                            </div>

                            {isInstructor && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleStartEditLesson(lesson)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  <EditIcon size={12} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lesson._id)}
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  <TrashIcon size={12} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          <p style={{ fontSize: '14px', color: 'var(--charcoal)', marginTop: '8px', whiteSpace: 'pre-line' }}>
                            {lesson.content}
                          </p>
                          {lesson.videoUrl && (
                            <a
                              href={lesson.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '13px', color: 'var(--obsidian)', fontWeight: 600, textDecoration: 'none' }}
                            >
                              <VideoIcon size={14} color="var(--blue)" />
                              Watch Attached Video Resource
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: '19px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyIcon size={18} color="var(--blue)" />
              Quizzes & Tests ({quizzes.length})
            </h2>

            {quizzes.length === 0 ? (
              <div>
                <p style={{ color: 'var(--text-muted)' }}>No quizzes created for this course yet.</p>
                {isInstructor && (
                  <Link to={`/instructor/create-quiz/${id}`} className="btn btn-blue btn-sm" style={{ marginTop: '12px' }}>
                    <PlusIcon size={14} />
                    Create First Quiz
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {quizzes.map((quiz) => (
                  <div
                    key={quiz._id}
                    style={{
                      padding: '16px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '16px', color: 'var(--obsidian)' }}>{quiz.title}</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Passing score: <strong>{quiz.passingPercentage}%</strong>
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link
                        to={`/quiz/${quiz._id}`}
                        className="btn btn-sm btn-blue"
                      >
                        Attempt Quiz
                        <ArrowRightIcon size={12} />
                      </Link>

                      {isInstructor && (
                        <button
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          <TrashIcon size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
