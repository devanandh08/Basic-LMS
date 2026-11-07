import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import Result from '../models/Result.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

// 1. Get ALL quizzes for a specific course (public outline)
export const getQuizzesByCourse = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId }).sort({ createdAt: -1 });
    res.json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get a SPECIFIC quiz by its quiz ID (along with questions)
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const isTeacher = req.user && (req.user.role === 'admin' || req.user.role === 'instructor');

    // Access Code Protection: if student, verify enrollment or access code
    if (!isTeacher) {
      const course = await Course.findById(quiz.courseId);
      const expectedCode = (course?.accessCode || 'POTTER101').toUpperCase();
      const providedCode = (req.headers['x-access-code'] || req.query.accessCode || '').trim().toUpperCase();

      let hasEnrollment = false;
      if (req.user) {
        hasEnrollment = await Enrollment.exists({ studentId: req.user._id, courseId: quiz.courseId });
      }

      if (!hasEnrollment && providedCode !== expectedCode) {
        return res.status(403).json({
          success: false,
          codeRequired: true,
          message: 'Access Code Required: Enter the course access code to view and take this quiz.'
        });
      }
    }
    const questions = isTeacher 
      ? await Question.find({ quizId: quiz._id })
      : await Question.find({ quizId: quiz._id }).select('-correctOptionIndex');

    // Also fetch logged in student's latest result for this quiz if available
    let latestResult = null;
    if (req.user) {
      latestResult = await Result.findOne({ studentId: req.user._id, quizId: quiz._id }).sort({ submittedAt: -1 });
    }

    res.json({ success: true, data: { quiz, questions, latestResult } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create a new Quiz
export const createQuizWithQuestions = async (req, res) => {
  try {
    const { courseId, title, passingPercentage, questions } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ success: false, message: 'Course ID and title are required' });
    }

    const quiz = await Quiz.create({ courseId, title, passingPercentage: passingPercentage || 50 });

    if (questions && questions.length > 0) {
      const formattedQuestions = questions.map((q) => ({
        quizId: quiz._id,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex || 0
      }));
      await Question.insertMany(formattedQuestions);
    }

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4. Update an existing Quiz
export const updateQuiz = async (req, res) => {
  try {
    const { title, passingPercentage } = req.body;
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { title, passingPercentage },
      { new: true, runValidators: true }
    );
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, data: quiz });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 5. Submit answers for a specific Quiz
export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    if (!quizId || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'quizId and answers array are required' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const questions = await Question.find({ quizId });
    let score = 0;

    questions.forEach((q) => {
      const studentAnswer = answers.find((a) => a.questionId.toString() === q._id.toString());
      if (studentAnswer && studentAnswer.selectedOption === q.correctOptionIndex) {
        score++;
      }
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    const passed = percentage >= quiz.passingPercentage;

    const result = await Result.create({
      studentId: req.user._id,
      quizId,
      score,
      totalQuestions,
      passed
    });

    res.json({
      success: true,
      data: { score, totalQuestions, percentage, passed, resultId: result._id }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Delete a specific Quiz
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    await Question.deleteMany({ quizId: id });
    await Result.deleteMany({ quizId: id });
    await quiz.deleteOne();

    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Get logged in student's quiz results
export const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.user._id })
      .populate('quizId', 'title courseId passingPercentage')
      .sort({ submittedAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Admin/Instructor: Get all results
export const getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate('studentId', 'name email')
      .populate('quizId', 'title courseId')
      .sort({ submittedAt: -1 })
      .limit(50);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Add Question to existing Quiz
export const addQuestionToQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questionText, options, correctOptionIndex } = req.body;
    if (!questionText || !options || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Valid question prompt and at least 2 options are required' });
    }

    const question = await Question.create({
      quizId,
      questionText,
      options,
      correctOptionIndex: correctOptionIndex || 0
    });
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 10. Delete a Question
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
