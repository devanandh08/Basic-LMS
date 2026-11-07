import express from 'express';
import bcrypt from 'bcryptjs';
import { inMemoryStore } from './inMemoryStore.js';

const router = express.Router();

const getAuthUser = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    return inMemoryStore.getUserFromToken(token);
  }
  return null;
};

router.post('/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }
  const existing = inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    _id: 'user-' + Date.now(),
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || 'student',
    createdAt: new Date().toISOString()
  };
  inMemoryStore.users.push(newUser);

  const token = inMemoryStore.generateToken(newUser._id);
  res.status(201).json({
    success: true,
    token,
    user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
  });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }
  const user = inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = inMemoryStore.generateToken(user._id);
  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

router.get('/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

router.get('/auth/users', (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  const safeUsers = inMemoryStore.users.map(({ password, ...rest }) => rest);
  res.json({
    success: true,
    count: safeUsers.length,
    totalPages: 1,
    currentPage: 1,
    totalUsers: safeUsers.length,
    data: safeUsers
  });
});

router.put('/auth/users/:id/role', (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  const target = inMemoryStore.users.find(u => u._id === req.params.id);
  if (!target) return res.status(404).json({ success: false, message: 'User not found' });
  target.role = req.body.role;
  res.json({ success: true, data: { id: target._id, name: target.name, role: target.role } });
});

router.delete('/auth/users/:id', (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  inMemoryStore.users = inMemoryStore.users.filter(u => u._id !== req.params.id);
  res.json({ success: true, message: 'User deleted successfully' });
});

router.get('/courses', (req, res) => {
  const { search, category, sort = 'newest', page = 1, limit = 9, accessCode } = req.query;
  let list = [...inMemoryStore.courses];

  if (accessCode) {
    list = list.filter(c => c.accessCode && c.accessCode.toUpperCase() === accessCode.trim().toUpperCase());
  } else if (search) {
    const s = search.toLowerCase();
    list = list.filter(c =>
      c.title.toLowerCase().includes(s) ||
      c.description.toLowerCase().includes(s) ||
      (c.accessCode && c.accessCode.toLowerCase().includes(s))
    );
  }

  if (category) {
    list = list.filter(c => c.category === category);
  }

  if (sort === 'oldest') {
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sort === 'title_asc') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'title_desc') {
    list.sort((a, b) => b.title.localeCompare(a.title));
  } else {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  res.json({
    success: true,
    count: list.length,
    totalPages: Math.ceil(list.length / limit) || 1,
    currentPage: Number(page),
    totalCourses: list.length,
    data: list
  });
});

router.post('/courses/verify-code', (req, res) => {
  const { code, courseId } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Please provide an access code' });
  const cleanCode = code.trim().toUpperCase();

  let course;
  if (courseId) {
    course = inMemoryStore.courses.find(c => c._id === courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if ((course.accessCode || 'POTTER101').toUpperCase() !== cleanCode) {
      return res.status(400).json({ success: false, message: 'Incorrect access code for this course' });
    }
  } else {
    course = inMemoryStore.courses.find(c => (c.accessCode || 'POTTER101').toUpperCase() === cleanCode);
    if (!course) return res.status(404).json({ success: false, message: 'No course found with this access code' });
  }

  res.json({ success: true, valid: true, message: 'Access granted!', data: course });
});

router.get('/courses/:id', (req, res) => {
  const course = inMemoryStore.courses.find(c => c._id === req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  res.json({ success: true, data: course });
});

router.post('/courses', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const { title, description, category, accessCode, isPublished, isPrivate, imageUrl } = req.body;
  const newCourse = {
    _id: 'course-' + Date.now(),
    title,
    description,
    category,
    accessCode: accessCode ? accessCode.trim().toUpperCase() : 'LMS-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    imageUrl: imageUrl ? imageUrl.trim() : '',
    isPrivate: Boolean(isPrivate),
    isPublished: isPublished !== undefined ? isPublished : true,
    instructor: { _id: user._id, name: user.name, email: user.email },
    createdAt: new Date().toISOString()
  };
  inMemoryStore.courses.unshift(newCourse);
  res.status(201).json({ success: true, data: newCourse });
});

router.put('/courses/:id', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const index = inMemoryStore.courses.findIndex(c => c._id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Course not found' });
  
  const existing = inMemoryStore.courses[index];
  inMemoryStore.courses[index] = {
    ...existing,
    ...req.body,
    accessCode: req.body.accessCode ? req.body.accessCode.trim().toUpperCase() : existing.accessCode
  };
  res.json({ success: true, data: inMemoryStore.courses[index] });
});

router.delete('/courses/:id', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });
  inMemoryStore.courses = inMemoryStore.courses.filter(c => c._id !== req.params.id);
  res.json({ success: true, message: 'Course deleted successfully' });
});

router.get('/lessons/course/:courseId', (req, res) => {
  const lessons = inMemoryStore.lessons.filter(l => l.courseId === req.params.courseId);
  lessons.sort((a, b) => a.order - b.order);
  res.json({ success: true, data: lessons });
});

router.post('/lessons', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const { courseId, title, content, videoUrl, order } = req.body;
  const newLesson = {
    _id: 'lesson-' + Date.now(),
    courseId,
    title,
    content,
    videoUrl: videoUrl || '',
    order: order || (inMemoryStore.lessons.filter(l => l.courseId === courseId).length + 1),
    createdAt: new Date().toISOString()
  };
  inMemoryStore.lessons.push(newLesson);
  res.status(201).json({ success: true, data: newLesson });
});

router.put('/lessons/:id', (req, res) => {
  const index = inMemoryStore.lessons.findIndex(l => l._id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Lesson not found' });
  inMemoryStore.lessons[index] = { ...inMemoryStore.lessons[index], ...req.body };
  res.json({ success: true, data: inMemoryStore.lessons[index] });
});

router.delete('/lessons/:id', (req, res) => {
  inMemoryStore.lessons = inMemoryStore.lessons.filter(l => l._id !== req.params.id);
  res.json({ success: true, message: 'Lesson deleted' });
});

router.get('/quizzes/course/:courseId', (req, res) => {
  const list = inMemoryStore.quizzes.filter(q => q.courseId === req.params.courseId);
  res.json({ success: true, data: list });
});

router.get('/quizzes/:quizId', (req, res) => {
  const user = getAuthUser(req);
  const quiz = inMemoryStore.quizzes.find(q => q._id === req.params.quizId);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  const isTeacher = user && (user.role === 'admin' || user.role === 'instructor');
  const course = inMemoryStore.courses.find(c => c._id === quiz.courseId);
  const expectedCode = (course?.accessCode || 'POTTER101').toUpperCase();
  const providedCode = (req.headers['x-access-code'] || req.query.accessCode || '').trim().toUpperCase();

  const isEnrolled = user && inMemoryStore.enrollments.some(e => e.studentId === user._id && e.courseId === quiz.courseId);

  if (!isTeacher && !isEnrolled && providedCode !== expectedCode) {
    return res.status(403).json({
      success: false,
      codeRequired: true,
      message: 'Access Code Required: Enter the course access code to view and take this quiz.'
    });
  }

  const questions = inMemoryStore.questions.filter(q => q.quizId === quiz._id).map(q => {
    if (isTeacher) return q;
    const { correctOptionIndex, ...rest } = q;
    return rest;
  });

  let latestResult = null;
  if (user) {
    latestResult = inMemoryStore.results.filter(r => r.studentId === user._id && r.quizId === quiz._id).pop() || null;
  }

  res.json({ success: true, data: { quiz, questions, latestResult } });
});

router.post('/quizzes', (req, res) => {
  const { courseId, title, passingPercentage, questions } = req.body;
  const newQuiz = {
    _id: 'quiz-' + Date.now(),
    courseId,
    title,
    passingPercentage: passingPercentage || 50,
    createdAt: new Date().toISOString()
  };
  inMemoryStore.quizzes.push(newQuiz);

  if (questions && Array.isArray(questions)) {
    questions.forEach((q, idx) => {
      inMemoryStore.questions.push({
        _id: 'q-' + Date.now() + '-' + idx,
        quizId: newQuiz._id,
        questionText: q.questionText,
        options: q.options || [],
        correctOptionIndex: q.correctOptionIndex || 0
      });
    });
  }

  res.status(201).json({ success: true, data: newQuiz });
});

router.delete('/quizzes/:id', (req, res) => {
  inMemoryStore.quizzes = inMemoryStore.quizzes.filter(q => q._id !== req.params.id);
  inMemoryStore.questions = inMemoryStore.questions.filter(q => q.quizId !== req.params.id);
  res.json({ success: true, message: 'Quiz deleted successfully' });
});

router.post('/quizzes/submit', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });

  const { quizId, answers } = req.body;
  const quiz = inMemoryStore.quizzes.find(q => q._id === quizId);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  const questions = inMemoryStore.questions.filter(q => q.quizId === quizId);
  let correctCount = 0;

  answers.forEach(a => {
    const q = questions.find(item => item._id === a.questionId);
    if (q && q.correctOptionIndex === a.selectedOption) {
      correctCount++;
    }
  });

  const total = questions.length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 100;
  const passed = percentage >= quiz.passingPercentage;

  const result = {
    _id: 'res-' + Date.now(),
    studentId: user._id,
    quizId,
    quizTitle: quiz.title,
    score: correctCount,
    totalQuestions: total,
    percentage,
    passed,
    submittedAt: new Date().toISOString()
  };

  inMemoryStore.results.push(result);
  res.json({ success: true, data: result });
});

router.get('/quizzes/results/my', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const myResults = inMemoryStore.results.filter(r => r.studentId === user._id);
  res.json({ success: true, data: myResults });
});

router.get('/quizzes/results/all', (req, res) => {
  res.json({ success: true, data: inMemoryStore.results });
});

router.get('/enrollments/my', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });

  const myEnrollments = inMemoryStore.enrollments
    .filter(e => e.studentId === user._id)
    .map(e => ({
      ...e,
      courseId: inMemoryStore.courses.find(c => c._id === e.courseId) || { _id: e.courseId, title: 'Course' }
    }));
  res.json({ success: true, data: myEnrollments });
});

router.post('/enrollments/enroll', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });

  const { courseId } = req.body;
  const existing = inMemoryStore.enrollments.find(e => e.studentId === user._id && e.courseId === courseId);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Already enrolled' });
  }

  const enrollment = {
    _id: 'enroll-' + Date.now(),
    studentId: user._id,
    courseId,
    progress: 0,
    completed: false,
    createdAt: new Date().toISOString()
  };
  inMemoryStore.enrollments.push(enrollment);
  res.status(201).json({ success: true, data: enrollment });
});

router.delete('/enrollments/:courseId', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });
  inMemoryStore.enrollments = inMemoryStore.enrollments.filter(e => !(e.studentId === user._id && e.courseId === req.params.courseId));
  res.json({ success: true, message: 'Successfully unenrolled' });
});

router.put('/enrollments/progress', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const { courseId, progress } = req.body;
  const enroll = inMemoryStore.enrollments.find(e => e.studentId === user._id && e.courseId === courseId);
  if (enroll) {
    enroll.progress = progress;
    enroll.completed = progress === 100;
  }
  res.json({ success: true, data: enroll });
});

router.get('/reports/summary', (req, res) => {
  const totalUsers = inMemoryStore.users.length;
  const totalStudents = inMemoryStore.users.filter(u => u.role === 'student').length;
  const totalInstructors = inMemoryStore.users.filter(u => u.role === 'instructor').length;
  const totalAdmins = inMemoryStore.users.filter(u => u.role === 'admin').length;
  const totalCourses = inMemoryStore.courses.length;
  const totalLessons = inMemoryStore.lessons.length;
  const totalQuizzes = inMemoryStore.quizzes.length;
  const totalQuestions = inMemoryStore.questions.length;
  const totalEnrollments = inMemoryStore.enrollments.length;
  const completedEnrollments = inMemoryStore.enrollments.filter(e => e.completed).length;
  const totalResults = inMemoryStore.results.length;
  const passedResults = inMemoryStore.results.filter(r => r.passed).length;

  res.json({
    success: true,
    data: {
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      totalLessons,
      totalQuizzes,
      totalQuestions,
      totalEnrollments,
      completedEnrollments,
      totalResults,
      passedResults,
      completionRate: totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1) : '100.0',
      quizPassRate: totalResults > 0 ? ((passedResults / totalResults) * 100).toFixed(1) : '85.0',
      courses: inMemoryStore.courses.map(c => ({
        id: c._id,
        title: c.title,
        category: c.category,
        accessCode: c.accessCode || 'POTTER101',
        instructor: c.instructor?.name || 'Dev Instructor',
        enrollments: inMemoryStore.enrollments.filter(e => e.courseId === c._id).length,
        lessons: inMemoryStore.lessons.filter(l => l.courseId === c._id).length,
        quizzes: inMemoryStore.quizzes.filter(q => q.courseId === c._id).length
      })),
      generatedAt: new Date().toISOString()
    }
  });
});

export default router;
