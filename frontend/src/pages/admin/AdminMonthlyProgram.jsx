import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiClient from '../../api/axios';
import { Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const AdminMonthlyProgram = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [plannedLessons, setPlannedLessons] = useState([]);
  const [payments, setPayments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      const [studentsRes, coursesRes, lessonsRes, plannedRes, paymentsRes, branchesRes, teachersRes] = await Promise.all([
        apiClient.get('/students'),
        apiClient.get('/student-courses'),
        apiClient.get('/lessons'),
        apiClient.get('/planned-lessons'),
        apiClient.get('/payments'),
        apiClient.get('/branches'),
        apiClient.get('/teachers')
      ]);
      
      setStudents(studentsRes.data.filter(s => s.status === 'active'));
      setCourses(coursesRes.data);
      setLessons(lessonsRes.data);
      setPlannedLessons(plannedRes.data.filter(p => p.month === selectedMonth));
      setPayments(paymentsRes.data.filter(p => p.date.startsWith(selectedMonth)));
      setBranches(branchesRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getStudentCourses = (studentId) => {
    return courses.filter(c => c.student_id === studentId);
  };

  const getCourseLessons = (courseId) => {
    return lessons.filter(l => l.student_course_id === courseId && l.date.startsWith(selectedMonth));
  };

  const getStudentPayments = (studentId) => {
    return payments.filter(p => p.student_id === studentId && p.payment_type === 'student_payment');
  };

  const calculateMonthlyTotal = (studentId) => {
    const studentCourses = getStudentCourses(studentId);
    let total = 0;
    studentCourses.forEach(course => {
      const courseLessons = getCourseLessons(course.id);
      courseLessons.forEach(lesson => {
        total += course.price * lesson.number_of_lessons;
      });
    });
    return total;
  };

  const calculateTeacherExpenses = () => {
    const teacherExpenses = {};
    teachers.forEach(teacher => {
      const teacherPayments = payments.filter(p => 
        p.teacher_id === teacher.id && p.payment_type === 'teacher_payment'
      );
      teacherExpenses[teacher.id] = {
        name: teacher.name,
        amount: teacherPayments.reduce((sum, p) => sum + p.amount, 0)
      };
    });
    return Object.values(teacherExpenses);
  };

  const totalRevenue = students.reduce((sum, s) => sum + calculateMonthlyTotal(s.id), 0);
  const totalPaymentsReceived = payments.filter(p => p.payment_type === 'student_payment').reduce((sum, p) => sum + p.amount, 0);
  const teacherExpenses = calculateTeacherExpenses();
  const totalTeacherExpense = teacherExpenses.reduce((sum, t) => sum + t.amount, 0);

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2" data-testid="admin-monthly-program-title">
              Aylık Program
            </h1>
            <p className="text-slate-600">Aylık ders ve ödeme özeti</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-12">Aralık 2024</SelectItem>
                <SelectItem value="2025-01">Ocak 2025</SelectItem>
                <SelectItem value="2025-02">Şubat 2025</SelectItem>
                <SelectItem value="2025-03">Mart 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Toplam Ciro</p>
            <p className="text-3xl font-bold text-blue-600">{totalRevenue.toFixed(2)} ₺</p>
          </div>
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Yapılan Ödeme</p>
            <p className="text-3xl font-bold text-green-600">{totalPaymentsReceived.toFixed(2)} ₺</p>
          </div>
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Hoca Gideri</p>
            <p className="text-3xl font-bold text-orange-600">{totalTeacherExpense.toFixed(2)} ₺</p>
          </div>
          <div className="admin-card p-6">
            <p className="text-sm text-slate-500 mb-1">Net Kar</p>
            <p className="text-3xl font-bold text-purple-600">
              {(totalPaymentsReceived - totalTeacherExpense).toFixed(2)} ₺
            </p>
          </div>
        </div>

        {/* Öğrenci Tablosu */}
        <div className="admin-card p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Öğrenci Detayları</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Öğrenci</th>
                  <th className="text-left py-3 px-2">Veli</th>
                  <th className="text-left py-3 px-2">Aldığı Dersler</th>
                  <th className="text-right py-3 px-2">Ödeyeceği</th>
                  <th className="text-right py-3 px-2">Ödedi</th>
                  <th className="text-right py-3 px-2">Kalan</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const studentCourses = getStudentCourses(student.id);
                  const monthlyTotal = calculateMonthlyTotal(student.id);
                  const studentPayments = getStudentPayments(student.id);
                  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
                  const remaining = monthlyTotal - totalPaid;

                  return (
                    <tr key={student.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-2">{student.name}</td>
                      <td className="py-3 px-2">{student.parent_name}</td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1">
                          {studentCourses.map(course => {
                            const branch = branches.find(b => b.id === course.branch_id);
                            return (
                              <span key={course.id} className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {branch?.name}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-semibold">{monthlyTotal.toFixed(2)} ₺</td>
                      <td className="text-right py-3 px-2 text-green-600">{totalPaid.toFixed(2)} ₺</td>
                      <td className="text-right py-3 px-2 text-orange-600">{remaining.toFixed(2)} ₺</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Öğretmen Ödemeler */}
        <div className="admin-card p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Öğretmen Ödemeleri</h2>
          <div className="space-y-3">
            {teacherExpenses.map((teacher, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-800">{teacher.name}</span>
                <span className="font-bold text-orange-600">{teacher.amount.toFixed(2)} ₺</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMonthlyProgram;