import { useState, useEffect } from 'react';
import { subjectsAPI, departmentsAPI } from '../services/api';
import { Subject, Department } from '../types';
import { Plus, Pencil, Trash2, Search, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', code: '', department_id: '', hours_per_week: '4',
    is_lab: false, lab_hours: '0', color: '#10B981',
  });

  const load = () => {
    Promise.all([subjectsAPI.list(), departmentsAPI.list()])
      .then(([s, d]) => { setSubjects(s.data); setDepartments(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', code: '', department_id: '', hours_per_week: '4', is_lab: false, lab_hours: '0', color: '#10B981' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        department_id: Number(form.department_id),
        hours_per_week: Number(form.hours_per_week),
        lab_hours: Number(form.lab_hours),
      };
      if (editing) {
        await subjectsAPI.update(editing.id, payload);
        toast.success('Subject updated');
      } else {
        await subjectsAPI.create(payload);
        toast.success('Subject added');
      }
      resetForm();
      load();
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (s: Subject) => {
    setForm({
      name: s.name, code: s.code, department_id: String(s.department_id),
      hours_per_week: String(s.hours_per_week), is_lab: s.is_lab,
      lab_hours: String(s.lab_hours), color: s.color,
    });
    setEditing(s);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subject?')) return;
    try { await subjectsAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-slate-500 mt-1">Manage courses and subjects</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search subjects..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit Subject' : 'Add Subject'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                  <input type="text" required value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select required value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="">Select</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hours/Week</label>
                  <input type="number" value={form.hours_per_week}
                    onChange={(e) => setForm({ ...form, hours_per_week: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input type="checkbox" checked={form.is_lab} id="is_lab"
                    onChange={(e) => setForm({ ...form, is_lab: e.target.checked })}
                    className="rounded border-slate-300" />
                  <label htmlFor="is_lab" className="text-sm font-medium text-slate-700">Lab Subject</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <input type="color" value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 cursor-pointer" />
                </div>
              </div>
              {form.is_lab && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lab Hours (continuous slots)</label>
                  <input type="number" value={form.lab_hours}
                    onChange={(e) => setForm({ ...form, lab_hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No subjects found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Hours/Week</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                        <span className="text-sm font-medium text-slate-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{s.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{s.hours_per_week}</td>
                    <td className="px-6 py-4">
                      {s.is_lab ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          <FlaskConical className="w-3 h-3" /> Lab
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">Theory</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50">
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
