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
                <div key={course._id} className="card card-hoverable" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <span className="badge badge-student">
                        <BookOpenIcon size={12} />
                        {course.category}
                      </span>
                      
                      {isUnlocked ? (
                        <span className="badge badge-unlocked">
                          <UnlockIcon size={12} color="var(--jade)" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="badge badge-locked">
                          <LockIcon size={12} color="var(--red-accent)" />
                          Code Protected
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: '6px 0 10px 0', fontSize: '18px', color: 'var(--obsidian)' }}>{course.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
                      {course.description ? (course.description.length > 130 ? `${course.description.substring(0, 130)}...` : course.description) : 'No description provided.'}
                    </p>

                    {isOwner && (
                      <div style={{ padding: '8px 12px', background: 'var(--blue-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--blue-border)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: 600 }}>Access Code:</span>
                        <strong className="badge-code">{courseCode}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
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
