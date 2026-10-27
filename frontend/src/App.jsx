import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const SubjectBoard = lazy(() => import("./pages/SubjectBoard"));
const Sessions = lazy(() => import("./pages/Sessions"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Planner = lazy(() => import("./pages/Planner"));
const FocusTimer = lazy(() => import("./pages/FocusTimer"));
const Calendar = lazy(() => import("./pages/Calendar"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/groups" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
          <Route path="/groups/:groupId/subjects/:subjectId" element={<ProtectedRoute><SubjectBoard /></ProtectedRoute>} />
          <Route path="/groups/:groupId/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/groups/:groupId/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/groups/:groupId/chat" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/focus" element={<ProtectedRoute><FocusTimer /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
