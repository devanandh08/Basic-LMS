import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class InMemoryStore {
  constructor() {
    this.users = [
      {
        _id: 'user-admin-1',
        name: 'Admin User',
        email: 'admin@lms.com',
        password: '',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'user-instructor-1',
        name: 'Dev Instructor',
        email: 'instructor@lms.com',
        password: '',
        role: 'instructor',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'user-student-1',
        name: 'Harry Student',
        email: 'student@lms.com',
        password: '',
        role: 'student',
        createdAt: new Date().toISOString()
      }
    ];

    const hash = bcrypt.hashSync('password123', 10);
    this.users.forEach(u => u.password = hash);

    this.courses = [
      {
        _id: 'course-1-harry-potter',
        title: 'Harry Potter: Defense Against the Dark Arts',
        description: 'Learn to create spells, defensive charms, and master patronus incantations against dark forces.',
        category: 'Web Development',
        accessCode: 'POTTER101',
        isPrivate: false,
        isPublished: true,
        instructor: { _id: 'user-instructor-1', name: 'Dev Instructor', email: 'instructor@lms.com' },
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        _id: 'course-2-fullstack-dev',
        title: 'Full-Stack Web Development Bootcamp',
        description: 'Master modern React 18, Node.js, Express, MongoDB Atlas modeling, and JWT authentication.',
        category: 'Web Development',
        accessCode: 'WEB2026',
        isPrivate: false,
        isPublished: true,
        instructor: { _id: 'user-instructor-1', name: 'Dev Instructor', email: 'instructor@lms.com' },
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: 'course-3-data-science',
        title: 'Data Science & Machine Learning with Python',
        description: 'Hands-on exploratory data analysis, Pandas dataframes, predictive models, and Scikit-learn pipelines.',
        category: 'Data Science',
        accessCode: 'DATA101',
        isPrivate: false,
        isPublished: true,
        instructor: { _id: 'user-instructor-1', name: 'Dev Instructor', email: 'instructor@lms.com' },
        createdAt: new Date().toISOString()
      }
    ];

    this.lessons = [
      {
        _id: 'lesson-1-1',
        courseId: 'course-1-harry-potter',
        title: 'Wand Fundamentals & Incantations',
        content: 'Swish and flick! Ensure proper wrist movement and clear vocal pronunciation of the incantation. Practice basic light charms (Lumos and Nox) before proceeding to defensive spells.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        order: 1,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'lesson-1-2',
        courseId: 'course-1-harry-potter',
        title: 'Shield Charms & Protego Mastery',
        content: 'The Shield Charm (Protego) forms a magical barrier that deflects minor physical entities and spells back at the opponent.',
        videoUrl: '',
        order: 2,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'lesson-1-3',
        courseId: 'course-1-harry-potter',
        title: 'Expecto Patronum: Advanced Defense',
        content: 'Focus intensely on a powerful positive memory. The silver guardian will emerge to repel Dementors and dark entities.',
        videoUrl: '',
        order: 3,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'lesson-2-1',
        courseId: 'course-2-fullstack-dev',
        title: 'React Components, Hooks & Controlled Forms',
        content: 'Controlled components in React synchronize form input state with React state using useState and onChange handlers.',
        videoUrl: '',
        order: 1,
        createdAt: new Date().toISOString()
      }
    ];

    this.quizzes = [
      {
        _id: 'quiz-1-potter',
        courseId: 'course-1-harry-potter',
        title: 'DADA Practical Knowledge Assessment',
        passingPercentage: 60,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'quiz-2-web',
        courseId: 'course-2-fullstack-dev',
        title: 'React & Express Architecture Test',
        passingPercentage: 70,
        createdAt: new Date().toISOString()
      }
    ];

    this.questions = [
      {
        _id: 'q-1-1',
        quizId: 'quiz-1-potter',
        questionText: 'What is the incantation for the Disarming Charm?',
        options: ['Expelliarmus', 'Stupefy', 'Avada Kedavra', 'Crucio'],
        correctOptionIndex: 0
      },
      {
        _id: 'q-1-2',
        quizId: 'quiz-1-potter',
        questionText: 'Which defensive spell produces a silver animal guardian to repel Dementors?',
        options: ['Riddikulus', 'Expecto Patronum', 'Alohomora', 'Obliviate'],
        correctOptionIndex: 1
      },
      {
        _id: 'q-1-3',
        quizId: 'quiz-1-potter',
        questionText: 'What does the Protego spell create?',
        options: ['An offensive flame', 'A magical shield barrier', 'A healing potion', 'A portal'],
        correctOptionIndex: 1
      },
      {
        _id: 'q-2-1',
        quizId: 'quiz-2-web',
        questionText: 'Which React hook is standard for managing component state?',
        options: ['useEffect', 'useState', 'useRef', 'useMemo'],
        correctOptionIndex: 1
      }
    ];

    this.enrollments = [
      {
        _id: 'enroll-1',
        studentId: 'user-student-1',
        courseId: 'course-1-harry-potter',
        progress: 33,
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    this.results = [];
  }

  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key', { expiresIn: '7d' });
  }

  getUserFromToken(token) {
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key');
      return this.users.find(u => u._id === decoded.id) || null;
    } catch {
      return null;
    }
  }
}

export const inMemoryStore = new InMemoryStore();
