import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Result from '../models/Result.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });
    const totalLessons = await Lesson.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalQuestions = await Question.countDocuments();

    const totalEnrollments = await Enrollment.countDocuments();
    const completedEnrollments = await Enrollment.countDocuments({ completed: true });

    const totalResults = await Result.countDocuments();
    const passedResults = await Result.countDocuments({ passed: true });

    // Detailed course performance list
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .limit(10)
      .lean();

    const courseBreakdown = await Promise.all(
      courses.map(async (c) => {
        const enrollCount = await Enrollment.countDocuments({ courseId: c._id });
        const lessonCount = await Lesson.countDocuments({ courseId: c._id });
        const quizCount = await Quiz.countDocuments({ courseId: c._id });
        return {
          id: c._id,
          title: c.title,
          category: c.category,
          accessCode: c.accessCode || 'POTTER101',
          instructor: c.instructor?.name || 'Dev Instructor',
          enrollments: enrollCount,
          lessons: lessonCount,
          quizzes: quizCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        totalCourses,
        publishedCourses,
        totalLessons,
        totalQuizzes,
        totalQuestions,
        totalEnrollments,
        completedEnrollments,
        totalResults,
        passedResults,
        completionRate: totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1) : 0,
        quizPassRate: totalResults > 0 ? ((passedResults / totalResults) * 100).toFixed(1) : 0,
        courses: courseBreakdown,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
