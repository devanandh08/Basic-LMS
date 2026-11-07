# Basic Learning Management System (LMS)

A full-stack, role-based Learning Management System built with **React (Vite)**, **Express.js**, **Node.js**, and **MongoDB Atlas (Mongoose)**. The platform enables course authoring, lesson publishing, student enrollments, multiple-choice quiz evaluations with automated grading, student progress tracking, and administrative reports.

---

## 1. Project Links & Submission Checklist

- **Live Frontend URL:** [https://your-frontend-domain.netlify.app](https://your-frontend-domain.netlify.app)
- **Live Backend URL:** [https://your-backend-service.onrender.com](https://your-backend-service.onrender.com)
- **GitHub Repository:** [https://github.com/devanandh08/Basic-LMS](https://github.com/devanandh08/Basic-LMS)
- **Demo Video Link:** [https://loom.com/share/... or YouTube link](https://loom.com)
- **Postman Collection:** Included in repository root as [`postman_collection.json`](./postman_collection.json)
- **ER Diagram:** Included in [`docs/ER_DIAGRAM.md`](./docs/ER_DIAGRAM.md)
- **Screenshots:** Included in [`docs/screenshots/`](./docs/)

---

## 2. Test Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@lms.com` | `Admin@123` | Full access, user CRUD & role assignment, courses, system reports |
| **Instructor** | `instructor@lms.com` | `Instructor@123` | Course CRUD, lesson creation & editing, quiz and question authoring |
| **Student** | `student@lms.com` | `Student@123` | Course discovery, enrollment, lesson progress tracking, quiz assessments |

---

## 3. Tech Stack

- **Frontend:** React 18, Vite, React Router DOM v6, Context API for state management, CSS3
- **Backend:** Node.js, Express.js (modular routes, controllers, and middlewares)
- **Database:** MongoDB Atlas via Mongoose ODM (7 interconnected schemas with indexes)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs password hashing
- **Deployment Targets:** Render (Backend), Netlify / Vercel (Frontend)

---

## 4. Main Mongoose Models

1. **User:** Name, unique email, bcrypt-hashed password, role (`admin`, `instructor`, `student`).
2. **Course:** Title, description, category, instructor reference (`User`), published state.
3. **Lesson:** Course reference (`Course`), title, content/notes, sequential order, optional video URL.
4. **Enrollment:** Composite student (`User`) & course (`Course`) relation, progress percentage (0-100%), completion status.
5. **Quiz:** Course reference (`Course`), assessment title, passing percentage threshold (default: 50%).
6. **Question:** Quiz reference (`Quiz`), question text, options array (2-4), zero-based correct option index.
7. **Result:** Student reference (`User`), quiz reference (`Quiz`), score, total questions, pass/fail boolean, submission timestamp.

---

## 5. Functional Implementation Details

### 1. Authentication & Security
- Registration, login, and token-based session persistence using React Context API.
- Passwords salted and hashed with `bcryptjs`.
- Express JWT verification middleware (`protect`) and role-based permission guard (`authorize('admin', 'instructor')`).

### 2. Role-Based Access Control
- **Admin:** System Administration Dashboard, User Directory CRUD (change user roles, delete accounts), system-wide metrics, and full course/quiz inspection.
- **Instructor:** Author new courses, update course metadata, add/edit/delete lessons, configure multiple quizzes per course.
- **Student:** Explore courses with search/category/sort, enroll, track curriculum progress, attempt quizzes with instant grading, and review past quiz scorecards in **My Learning**.

### 3. List Features (Search, Filters, Sort & Pagination)
- Server-side search by title or keywords.
- Category filtering (`Web Development`, `Data Science`, `Design`, `Business`).
- Multi-option sorting: `Newest First`, `Oldest First`, `Title (A-Z)`, `Title (Z-A)`.
- Server-side pagination with dynamic page controls.

### 4. Validation & Feedback States
- Double validation: HTML5 + React controlled forms with `event.preventDefault()` on client, plus field validation in Express controllers.
- Loading spinners (`.loader`), empty state cards (`.empty-state`), success alerts (`.alert-success`), and error alerts (`.alert-error`).

### 5. Reporting & Analytics Dashboard
- Total students, instructors, and courses count.
- Course completion rates and quiz pass rates.
- Real-time student quiz submission logs.

---

## 6. API Endpoints Reference

### Auth & Users
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and return JWT token
- `GET /api/auth/me` - Get currently authenticated user details
- `GET /api/auth/users` - *(Admin)* Paginated list of users with search and role filters
- `PUT /api/auth/users/:id/role` - *(Admin)* Update user role (`student`, `instructor`, `admin`)
- `DELETE /api/auth/users/:id` - *(Admin)* Delete a user account

### Courses
- `GET /api/courses` - Search, filter, sort, and paginate courses
- `GET /api/courses/:id` - Get course details with populated instructor info
- `POST /api/courses` - *(Instructor/Admin)* Create new course
- `PUT /api/courses/:id` - *(Instructor/Admin)* Update course details
- `DELETE /api/courses/:id` - *(Instructor/Admin)* Delete course

### Lessons
- `GET /api/lessons/course/:courseId` - Get ordered lessons for a course
- `POST /api/lessons` - *(Instructor/Admin)* Create a lesson
- `PUT /api/lessons/:id` - *(Instructor/Admin)* Update a lesson
- `DELETE /api/lessons/:id` - *(Instructor/Admin)* Delete a lesson

### Enrollments & Progress
- `POST /api/enrollments/enroll` - *(Student)* Enroll in a course
- `GET /api/enrollments/my` - *(Student)* Get logged-in student's enrolled courses and progress
- `PUT /api/enrollments/progress` - *(Student)* Update progress percentage and completion status
- `DELETE /api/enrollments/:courseId` - *(Student)* Drop/unenroll from a course

### Quizzes & Results
- `GET /api/quizzes/course/:courseId` - List all quizzes for a course (public overview)
- `GET /api/quizzes/:quizId` - Get quiz details and questions (without answers for students)
- `POST /api/quizzes` - *(Instructor/Admin)* Create quiz with questions
- `PUT /api/quizzes/:id` - *(Instructor/Admin)* Update quiz title or passing percentage
- `DELETE /api/quizzes/:id` - *(Instructor/Admin)* Delete quiz and its questions/results
- `POST /api/quizzes/submit` - Submit answers, evaluate score, and record result
- `GET /api/quizzes/results/my` - *(Student)* Get student's historical quiz results
- `GET /api/quizzes/results/all` - *(Admin/Instructor)* Get all student quiz submissions

### Reports
- `GET /api/reports/summary` - *(Admin)* System summary dashboard statistics

---

## 7. Local Setup & Quickstart

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance

### 1. Backend Setup
```bash
cd server
npm install
# Ensure .env contains PORT, MONGO_URI, JWT_SECRET, CLIENT_URL
npm run dev
```

### 2. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```

The application runs on `http://localhost:5173` with the backend API on `http://localhost:5000`.
