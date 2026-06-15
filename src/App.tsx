import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ExamCenter from "@/pages/ExamCenter";
import ExamDetail from "@/pages/ExamDetail";
import SignConfirm from "@/pages/SignConfirm";
import LearningRecords from "@/pages/LearningRecords";
import RecordDetail from "@/pages/RecordDetail";
import AdminReports from "@/pages/admin/AdminReports";
import ExamManagement from "@/pages/admin/ExamManagement";
import QuestionBank from "@/pages/admin/QuestionBank";
import UserManagement from "@/pages/admin/UserManagement";
import PositionManagement from "@/pages/admin/PositionManagement";
import { MainLayout, PrivateRoute } from "@/components/Layout";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="exams" element={<ExamCenter />} />
          <Route path="exams/:id" element={<ExamDetail />} />
          <Route path="exams/:id/sign" element={<SignConfirm />} />
          <Route path="records" element={<LearningRecords />} />
          <Route path="records/:id" element={<RecordDetail />} />

          <Route
            path="admin/exams"
            element={
              <PrivateRoute reqRoles={["super_admin", "compliance_officer"]}>
                <ExamManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/questions"
            element={
              <PrivateRoute reqRoles={["super_admin", "compliance_officer"]}>
                <QuestionBank />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/positions"
            element={
              <PrivateRoute reqRoles={["super_admin"]}>
                <PositionManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <PrivateRoute reqRoles={["super_admin"]}>
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/reports"
            element={
              <PrivateRoute reqRoles={["super_admin", "compliance_officer"]}>
                <AdminReports />
              </PrivateRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
