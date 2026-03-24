import { useState, useEffect } from 'react';
import { teachersAPI, departmentsAPI } from '../services/api';
import { Teacher, Department } from '../types';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [form, setForm] = useState({
    employee_id: '', name: '', email: '', phone: '',
    department_id: '', max_hours_per_day: '6', max_hours_per_week: '24', color: '#3B82F6',
  });

  const load = () => {
    Promise.all([
      teachersAPI.list(filterDept ? Number(filterDept) : undefined),
      departmentsAPI.list(),
    ]).then(([t, d]) => {
      setTeachers(t.data);
      setDepartments(d.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterDept]);

  const resetForm = () => {
    setForm({ employee_id: '', name: '', email: '', phone: '', department_id: '', max_hours_per_day: '6', max_hours_per_week: '24', color: '#3B82F6' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        department_id: Number(form.department_id),
        max_hours_per_day: Number(form.max_hours_per_day),
        max_hours_per_week: Number(form.max_hours_per_week),
      };
      if (editing) {
        await teachersAPI.update(editing.id, payload);
        toast.success('Teacher updated');
      } else {
        await teachersAPI.create(payload);
        toast.success('Teacher added');
      }
      resetForm();
      load();
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setForm({
      employee_id: teacher.employee_id,
      name: teacher.name,
      email: teacher.email || '',
      phone: teacher.phone || '',
      department_id: String(teacher.department_id),
      max_hours_per_day: String(teacher.max_hours_per_day),
      max_hours_per_week: String(teacher.max_hours_per_week),
      color: teacher.color,
    });
    setEditing(teacher);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this teacher?')) return;
    try {
      await teachersAPI.delete(id);
      toast.success('Teacher deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.employee_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
          <p className="text-slate-500 mt-1">Manage faculty members</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editing ? 'Edit Teacher' : 'Add Teacher'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                  <input type="text" required value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="text" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select required value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Hrs/Day</label>
                  <input type="number" value={form.max_hours_per_day}
                    onChange={(e) => setForm({ ...form, max_hours_per_day: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Hrs/Week</label>
                  <input type="number" value={form.max_hours_per_week}
                    onChange={(e) => setForm({ ...form, max_hours_per_week: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <input type="color" value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >Cancel</button>
                <button type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No teachers found. Add your first teacher to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Max Hours</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Color</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: teacher.color }}>
                          {teacher.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{teacher.employee_id}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{teacher.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{teacher.max_hours_per_day}h/day, {teacher.max_hours_per_week}h/week</td>
                    <td className="px-6 py-4">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: teacher.color }}></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(teacher)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(teacher.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
