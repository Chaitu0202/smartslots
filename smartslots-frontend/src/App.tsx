import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TeachersPage from './pages/TeachersPage';
import SubjectsPage from './pages/SubjectsPage';
import RoomsPage from './pages/RoomsPage';
import SectionsPage from './pages/SectionsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import TimeSlotsPage from './pages/TimeSlotsPage';
import ConstraintsPage from './pages/ConstraintsPage';
import TimetablesPage from './pages/TimetablesPage';
import CollegesPage from './pages/CollegesPage';
import AIAssistantPage from './pages/AIAssistantPage';
import PreferencesPage from './pages/PreferencesPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: { background: '#1E293B', color: '#F1F5F9', fontSize: '14px' },
        }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/sections" element={<SectionsPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/timeslots" element={<TimeSlotsPage />} />
            <Route path="/constraints" element={<ConstraintsPage />} />
            <Route path="/timetables" element={<TimetablesPage />} />
            <Route path="/colleges" element={<CollegesPage />} />
            <Route path="/ai" element={<AIAssistantPage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
