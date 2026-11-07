import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CourseList from './pages/CourseList.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import QuizView from './pages/QuizView.jsx';
import CreateCourse from './pages/CreateCourse.jsx';
import CreateQuiz from './pages/CreateQuiz.jsx';
import MyLearning from './pages/MyLearning.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<CourseList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/courses" element={<CourseList />} />
          <Route
            path="/instructor/create-course"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <CreateCourse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/create-quiz/:courseId"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <CreateQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-learning"
            element={
              <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
                <MyLearning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:quizId"
            element={
              <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
                <QuizView />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<CourseList />} />
        </Routes>
      </main>
    </>
  );
}
