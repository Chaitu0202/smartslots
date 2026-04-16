import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { DashboardStats } from '../types';
import { Users, BookOpen, DoorOpen, GraduationCap, Calendar, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) return <p className="text-slate-500">Failed to load dashboard data.</p>;

  const statCards = [
    { label: 'Teachers', value: stats.total_teachers, icon: Users, color: 'bg-blue-500' },
    { label: 'Subjects', value: stats.total_subjects, icon: BookOpen, color: 'bg-emerald-500' },
    { label: 'Rooms', value: stats.total_rooms, icon: DoorOpen, color: 'bg-amber-500' },
    { label: 'Sections', value: stats.total_sections, icon: GraduationCap, color: 'bg-purple-500' },
    { label: 'Timetables', value: stats.total_timetables, icon: Calendar, color: 'bg-pink-500' },
    { label: 'Published', value: stats.published_timetables, icon: CheckCircle, color: 'bg-cyan-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your scheduling system</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-500">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Teacher Workload Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Teacher Workload</h3>
          {stats.teacher_load.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.teacher_load}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Current Hours" />
                <Bar dataKey="max_hours" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Max Hours" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No teacher data available
            </div>
          )}
        </div>

        {/* Room Usage Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Room Usage</h3>
          {stats.room_usage.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.room_usage}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="usage_percent"
                  nameKey="name"
                  label={({ name, usage_percent }) => `${name}: ${usage_percent}%`}
                >
                  {stats.room_usage.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No room data available
            </div>
          )}
        </div>
      </div>

      {/* Department Stats */}
      {stats.department_stats.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Department Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-sm font-medium text-slate-500">Department</th>
                  <th className="pb-3 text-sm font-medium text-slate-500">Code</th>
                  <th className="pb-3 text-sm font-medium text-slate-500 text-center">Teachers</th>
                  <th className="pb-3 text-sm font-medium text-slate-500 text-center">Subjects</th>
                  <th className="pb-3 text-sm font-medium text-slate-500 text-center">Sections</th>
                </tr>
              </thead>
              <tbody>
                {stats.department_stats.map((dept, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 text-sm font-medium text-slate-900">{dept.name}</td>
                    <td className="py-3 text-sm text-slate-500">{dept.code}</td>
                    <td className="py-3 text-sm text-slate-700 text-center">{dept.teachers}</td>
                    <td className="py-3 text-sm text-slate-700 text-center">{dept.subjects}</td>
                    <td className="py-3 text-sm text-slate-700 text-center">{dept.sections}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
