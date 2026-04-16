export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'faculty' | 'student';
  college_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface College {
  id: number;
  name: string;
  code: string;
  address: string | null;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  college_id: number;
  created_at: string;
}

export interface Teacher {
  id: number;
  employee_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  department_id: number;
  user_id: number | null;
  max_hours_per_day: number;
  max_hours_per_week: number;
  color: string;
  created_at: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  department_id: number;
  hours_per_week: number;
  is_lab: boolean;
  lab_hours: number;
  color: string;
  created_at: string;
}

export interface Section {
  id: number;
  name: string;
  year: number;
  semester: number;
  department_id: number;
  student_count: number;
  created_at: string;
}

export interface Room {
  id: number;
  name: string;
  code: string;
  room_type: string;
  capacity: number;
  college_id: number;
  building: string | null;
  floor: number | null;
  is_available: boolean;
  created_at: string;
}

export interface TimeSlot {
  id: number;
  day: string;
  period: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  college_id: number;
}

export interface SubjectAssignment {
  id: number;
  teacher_id: number;
  subject_id: number;
  section_id: number;
}

export interface TeacherPreference {
  id: number;
  teacher_id: number;
  day: string;
  period: number;
  preference: string;
  reason: string | null;
}

export interface Constraint {
  id: number;
  name: string;
  description: string | null;
  constraint_type: string;
  rule: Record<string, unknown>;
  college_id: number;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export interface TimetableEntry {
  id: number;
  timetable_id: number;
  timeslot_id: number;
  subject_id: number;
  teacher_id: number;
  section_id: number;
  room_id: number | null;
  subject_name: string | null;
  subject_code: string | null;
  subject_color: string | null;
  teacher_name: string | null;
  teacher_color: string | null;
  section_name: string | null;
  room_name: string | null;
  day: string | null;
  period: number | null;
  start_time: string | null;
  end_time: string | null;
  is_lab: boolean | null;
}

export interface Timetable {
  id: number;
  name: string;
  department_id: number;
  academic_year: string;
  semester: number;
  is_published: boolean;
  score: number;
  generation_log: { log: string[] } | null;
  created_at: string;
  updated_at: string;
  entries: TimetableEntry[] | null;
}

export interface DashboardStats {
  total_teachers: number;
  total_subjects: number;
  total_rooms: number;
  total_sections: number;
  total_timetables: number;
  published_timetables: number;
  teacher_load: { name: string; hours: number; max_hours: number; color: string }[];
  room_usage: { name: string; code: string; used: number; total: number; usage_percent: number }[];
  department_stats: { name: string; code: string; teachers: number; subjects: number; sections: number }[];
}

export interface Conflict {
  type: string;
  description: string;
  severity: string;
  entry_ids: number[];
  explanation?: string;
}

export interface Suggestion {
  type: string;
  description: string;
  priority: string;
  teacher_id?: number;
  entry_id?: number;
}
