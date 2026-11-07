import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  SearchIcon, 
  PlusIcon, 
  LockIcon, 
  UnlockIcon, 
  BookOpenIcon, 
  ArrowRightIcon,
  RefreshIcon
} from '../components/Icons';

const getCourseImage = (course) => {
  if (course?.imageUrl && course.imageUrl.startsWith('http')) {
    return course.imageUrl;
  }
  const title = (course?.title || '').toLowerCase();
  const category = (course?.category || '').toLowerCase();
  
  if (title.includes('potter') || title.includes('dark arts') || title.includes('magic') || title.includes('spell')) {
    return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80';
  }
  if (category.includes('data') || title.includes('machine learning') || title.includes('python')) {
    return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80';
  }
  if (category.includes('web') || title.includes('bootcamp') || title.includes('react') || title.includes('node') || title.includes('fullstack') || title.includes('full-stack')) {
    return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80';
  }
  if (category.includes('design') || title.includes('ui') || title.includes('ux')) {
    return 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80';
  }
  if (category.includes('business') || title.includes('management') || title.includes('finance')) {
    return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80';
};

export default function CourseList() {
  const { user } = useContext(AuthContext);

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  const [unlockedCourseIds, setUnlockedCourseIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('unlocked_course_ids') || '[]');
    } catch {
      return [];
    }
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 6,
        sort,
        ...(search ? { search } : {}),
        ...(category ? { category } : {})
      });
      const res = await fetch(`/api/courses?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setCourses(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCourses(data.totalCourses || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, category, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Course Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            Structured courses, syllabus modules, and verified evaluations ({totalCourses} courses available)
          </p>
        </div>
        <div>
          {user && (user.role === 'instructor' || user.role === 'admin') && (
            <Link to="/instructor/create-course" className="btn btn-blue">
              <PlusIcon size={16} />
              Create New Course
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search title, category, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
            <SearchIcon size={15} />
          </div>
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '170px' }}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          <option value="Web Development">Web Development</option>
          <option value="Data Science">Data Science</option>
          <option value="Design">Design</option>
          <option value="Business">Business</option>
        </select>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '170px' }}
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="title_asc">Title (A - Z)</option>
          <option value="title_desc">Title (Z - A)</option>
        </select>

        <button type="submit" className="btn">
          Search
        </button>

        {(search || category || sort !== 'newest') && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetFilters}
          >
            <RefreshIcon size={14} />
            Reset
          </button>
        )}
      </form>

      {loading ? (
        <div className="loader">
          <RefreshIcon size={24} className="spin-icon" color="var(--blue)" />
          <span>Loading course catalog...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="card empty-state">
          <BookOpenIcon size={40} color="var(--text-subtle)" />
          <h3 style={{ marginTop: '14px' }}>No courses found</h3>
          <p>Try clearing search keywords or entering your access code in the top portal bar.</p>
        </div>
      ) : (
        <>
          <div className="grid">
            {courses.map((course) => {
              const isOwner = user && (course.instructor?._id === user.id || course.instructor === user.id || user.role === 'admin');
              const isUnlocked = unlockedCourseIds.includes(course._id) || isOwner;
              const courseCode = course.accessCode || 'POTTER101';

              return (
                <div key={course._id} className="card card-hoverable" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 0, overflow: 'hidden' }}>
                  <div className="course-card-thumb">
                    <img
                      src={getCourseImage(course)}
                      alt={course.title}
                      className="course-card-image"
                      loading="lazy"
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                      <span className="badge badge-student" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(9, 9, 11, 0.75)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ffffff' }}>
                        <BookOpenIcon size={12} />
                        {course.category}
                      </span>
                    </div>

                    <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                      {isUnlocked ? (
                        <span className="badge badge-unlocked" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(5, 46, 22, 0.85)', border: '1px solid var(--jade)', color: '#4ade80' }}>
                          <UnlockIcon size={12} color="#4ade80" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="badge badge-locked" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(69, 10, 10, 0.85)', border: '1px solid var(--red-accent)', color: '#fca5a5' }}>
                          <LockIcon size={12} color="#fca5a5" />
                          Code Protected
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '36px', background: 'linear-gradient(to top, rgba(9, 9, 11, 0.7), transparent)' }} />
                  </div>

                  <div style={{ padding: '20px 20px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: 'var(--obsidian)' }}>{course.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
                        {course.description ? (course.description.length > 120 ? `${course.description.substring(0, 120)}...` : course.description) : 'No description provided.'}
                      </p>

                      {isOwner && (
                        <div style={{ padding: '8px 12px', background: 'var(--blue-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--blue-border)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: 600 }}>Access Code:</span>
                          <strong className="badge-code">{courseCode}</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Instructor: <strong style={{ color: 'var(--charcoal)' }}>{course.instructor?.name || 'Instructor'}</strong>
                      </div>
                      <Link
                        to={`/courses/${course._id}`}
                        className={`btn btn-sm ${isUnlocked ? 'btn-jade' : 'btn-secondary'}`}
                      >
                        {isUnlocked ? 'Open Course' : 'Unlock / View'}
                        <ArrowRightIcon size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '36px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Page <strong style={{ color: 'var(--obsidian)' }}>{page}</strong> of <strong style={{ color: 'var(--obsidian)' }}>{totalPages}</strong>
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
