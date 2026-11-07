import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

// 1. Enroll in a course (with instructor check)
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user._id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Prevent instructor from enrolling in their own course
    if (course.instructor.toString() === studentId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot enroll in your own course as an instructor',
      });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ studentId, courseId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    // Verify access code if provided
    const expectedCode = (course.accessCode || 'POTTER101').toUpperCase();
    const providedCode = (req.body.accessCode || '').trim().toUpperCase();
    if (course.isPrivate && providedCode !== expectedCode) {
      return res.status(400).json({ success: false, message: 'Valid course access code is required to enroll in this private course' });
    }

    const enrollment = await Enrollment.create({ studentId, courseId });
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. Fetch logged-in student's enrollments
export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user._id })
      .populate({
        path: 'courseId',
        populate: { path: 'instructor', select: 'name email' }
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update student progress
export const updateProgress = async (req, res) => {
  try {
    const { courseId, progress } = req.body;
    if (progress === undefined || !courseId) {
      return res.status(400).json({ success: false, message: 'courseId and progress are required' });
    }

    const completed = Number(progress) >= 100;
    const enrollment = await Enrollment.findOneAndUpdate(
      { studentId: req.user._id, courseId },
      { progress: Number(progress), completed },
      { new: true }
    );
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found' });
    }
    res.json({ success: true, data: enrollment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4. Cancel / Drop Enrollment (Delete)
export const cancelEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollment = await Enrollment.findOneAndDelete({
      studentId: req.user._id,
      courseId
    });
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found' });
    }
    res.json({ success: true, message: 'Successfully unenrolled from course' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
