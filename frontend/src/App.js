import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import axios from "axios";

// Pages
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";

// Admin Pages
import AdminStudents from "./pages/admin/AdminStudents";
import AdminStudentForm from "./pages/admin/AdminStudentForm";
import AdminStudentProfile from "./pages/admin/AdminStudentProfile";
import AdminStudentLessons from "./pages/admin/AdminStudentLessons";
import AdminStudentPlannedLessons from "./pages/admin/AdminStudentPlannedLessons";

import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminTeacherForm from "./pages/admin/AdminTeacherForm";
import AdminTeacherProfile from "./pages/admin/AdminTeacherProfile";
import AdminTeacherBalance from "./pages/admin/AdminTeacherBalance";

import AdminPayments from "./pages/admin/AdminPayments";
import AdminMonthlyProgram from "./pages/admin/AdminMonthlyProgram";
import AdminUserForm from "./pages/admin/AdminUserForm";

// Teacher Pages
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherStudentProfile from "./pages/teacher/TeacherStudentProfile";
import TeacherStudentLessons from "./pages/teacher/TeacherStudentLessons";
import TeacherStudentPlannedLessons from "./pages/teacher/TeacherStudentPlannedLessons";
import TeacherBalance from "./pages/teacher/TeacherBalance";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  useEffect(() => {
    // Initialize data on first load
    const initData = async () => {
      try {
        await axios.post(`${API}/init-data`);
      } catch (error) {
        console.log("Data initialization:", error.response?.data?.message || "Already initialized");
      }
    };
    initData();
  }, []);

  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute requiredRole="admin">
                <AdminStudents />
              </ProtectedRoute>
            } />
            <Route path="/admin/students/new" element={
              <ProtectedRoute requiredRole="admin">
                <AdminStudentForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/students/:id" element={
              <ProtectedRoute requiredRole="admin">
                <AdminStudentProfile />
              </ProtectedRoute>
            } />
            <Route path="/admin/students/:id/lessons/:courseId" element={
              <ProtectedRoute requiredRole="admin">
                <AdminStudentLessons />
              </ProtectedRoute>
            } />
            <Route path="/admin/students/:id/planned-lessons/:courseId" element={
              <ProtectedRoute requiredRole="admin">
                <AdminStudentPlannedLessons />
              </ProtectedRoute>
            } />

            <Route path="/admin/teachers" element={
              <ProtectedRoute requiredRole="admin">
                <AdminTeachers />
              </ProtectedRoute>
            } />
            <Route path="/admin/teachers/new" element={
              <ProtectedRoute requiredRole="admin">
                <AdminTeacherForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/teachers/:id" element={
              <ProtectedRoute requiredRole="admin">
                <AdminTeacherProfile />
              </ProtectedRoute>
            } />
            <Route path="/admin/teachers/:id/balance" element={
              <ProtectedRoute requiredRole="admin">
                <AdminTeacherBalance />
              </ProtectedRoute>
            } />

            <Route path="/admin/payments" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPayments />
              </ProtectedRoute>
            } />
            <Route path="/admin/monthly-program" element={
              <ProtectedRoute requiredRole="admin">
                <AdminMonthlyProgram />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/new" element={
              <ProtectedRoute requiredRole="admin">
                <AdminUserForm />
              </ProtectedRoute>
            } />

            {/* Teacher Routes */}
            <Route path="/teacher/dashboard" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/students" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherStudents />
              </ProtectedRoute>
            } />
            <Route path="/teacher/students/:id/profile" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherStudentProfile />
              </ProtectedRoute>
            } />
            <Route path="/teacher/students/:id/lessons/:courseId" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherStudentLessons />
              </ProtectedRoute>
            } />
            <Route path="/teacher/students/:id/planned-lessons/:courseId" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherStudentPlannedLessons />
              </ProtectedRoute>
            } />
            <Route path="/teacher/balance" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherBalance />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
