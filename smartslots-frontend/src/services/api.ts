import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  register: (data: { email: string; full_name: string; password: string; role: string; college_id?: number }) =>
    api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
  users: (college_id?: number) => api.get('/api/auth/users', { params: { college_id } }),
};

// Colleges
export const collegesAPI = {
  list: () => api.get('/api/colleges'),
  create: (data: { name: string; code: string; address?: string }) => api.post('/api/colleges', data),
  update: (id: number, data: { name?: string; address?: string }) => api.put(`/api/colleges/${id}`, data),
  delete: (id: number) => api.delete(`/api/colleges/${id}`),
};

// Departments
export const departmentsAPI = {
  list: (college_id?: number) => api.get('/api/departments', { params: { college_id } }),
  create: (data: { name: string; code: string; college_id: number }) => api.post('/api/departments', data),
  update: (id: number, data: { name?: string; code?: string }) => api.put(`/api/departments/${id}`, data),
  delete: (id: number) => api.delete(`/api/departments/${id}`),
};

// Teachers
export const teachersAPI = {
  list: (department_id?: number) => api.get('/api/teachers', { params: { department_id } }),
  create: (data: Record<string, unknown>) => api.post('/api/teachers', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/api/teachers/${id}`, data),
  delete: (id: number) => api.delete(`/api/teachers/${id}`),
  getPreferences: (id: number) => api.get(`/api/teachers/${id}/preferences`),
  setPreference: (id: number, data: { teacher_id: number; day: string; period: number; preference: string; reason?: string }) =>
    api.post(`/api/teachers/${id}/preferences`, data),
  clearPreferences: (id: number) => api.delete(`/api/teachers/${id}/preferences`),
};

// Subjects
export const subjectsAPI = {
  list: (department_id?: number) => api.get('/api/subjects', { params: { department_id } }),
  create: (data: Record<string, unknown>) => api.post('/api/subjects', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/api/subjects/${id}`, data),
  delete: (id: number) => api.delete(`/api/subjects/${id}`),
};

// Rooms
export const roomsAPI = {
  list: (college_id?: number) => api.get('/api/rooms', { params: { college_id } }),
  create: (data: Record<string, unknown>) => api.post('/api/rooms', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/api/rooms/${id}`, data),
  delete: (id: number) => api.delete(`/api/rooms/${id}`),
};

// Sections
export const sectionsAPI = {
  list: (department_id?: number) => api.get('/api/sections', { params: { department_id } }),
  create: (data: Record<string, unknown>) => api.post('/api/sections', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/api/sections/${id}`, data),
  delete: (id: number) => api.delete(`/api/sections/${id}`),
};

// TimeSlots
export const timeslotsAPI = {
  list: (college_id?: number) => api.get('/api/timeslots', { params: { college_id } }),
  create: (data: Record<string, unknown>) => api.post('/api/timeslots', data),
  generateDefault: (college_id: number) => api.post(`/api/timeslots/generate-default?college_id=${college_id}`),
  delete: (id: number) => api.delete(`/api/timeslots/${id}`),
};

// Assignments
export const assignmentsAPI = {
  list: (params?: { section_id?: number; teacher_id?: number }) =>
    api.get('/api/assignments', { params }),
  create: (data: { teacher_id: number; subject_id: number; section_id: number }) =>
    api.post('/api/assignments', data),
  delete: (id: number) => api.delete(`/api/assignments/${id}`),
};

// Constraints
export const constraintsAPI = {
  list: (college_id?: number) => api.get('/api/constraints', { params: { college_id } }),
  create: (data: Record<string, unknown>) => api.post('/api/constraints', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/api/constraints/${id}`, data),
  delete: (id: number) => api.delete(`/api/constraints/${id}`),
};

// Timetables
export const timetablesAPI = {
  list: (department_id?: number) => api.get('/api/timetables', { params: { department_id } }),
  get: (id: number) => api.get(`/api/timetables/${id}`),
  generate: (data: { department_id: number; academic_year: string; semester: number; name?: string }) =>
    api.post('/api/timetables/generate', data),
  updateEntry: (timetableId: number, entryId: number, data: Record<string, unknown>) =>
    api.put(`/api/timetables/${timetableId}/entries/${entryId}`, data),
  deleteEntry: (timetableId: number, entryId: number) =>
    api.delete(`/api/timetables/${timetableId}/entries/${entryId}`),
  publish: (id: number) => api.post(`/api/timetables/${id}/publish`),
  delete: (id: number) => api.delete(`/api/timetables/${id}`),
  conflicts: (id: number) => api.get(`/api/timetables/${id}/conflicts`),
  suggestions: (id: number) => api.get(`/api/timetables/${id}/suggestions`),
  exportExcel: (id: number, section_id?: number) =>
    api.get(`/api/timetables/${id}/export/excel`, {
      params: { section_id },
      responseType: 'blob',
    }),
};

// Dashboard
export const dashboardAPI = {
  get: (college_id?: number) => api.get('/api/dashboard', { params: { college_id } }),
};

// AI
export const aiAPI = {
  parseConstraint: (text: string, college_id: number) =>
    api.post('/api/ai/parse-constraint', { text, college_id }),
  explainConflicts: (timetable_id: number) =>
    api.get(`/api/ai/explain-conflicts/${timetable_id}`),
  suggestions: (timetable_id: number) =>
    api.get(`/api/ai/suggestions/${timetable_id}`),
};

export default api;
