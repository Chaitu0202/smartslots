import { useState, useEffect } from 'react';
import { sectionsAPI, departmentsAPI } from '../services/api';
import { Section, Department } from '../types';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', year: '1', semester: '1', department_id: '', student_count: '60' });

  const load = () => {
    Promise.all([sectionsAPI.list(), departmentsAPI.list()])
      .then(([s, d]) => { setSections(s.data); setDepartments(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ name: '', year: '1', semester: '1', department_id: '', student_count: '60' }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, year: Number(form.year), semester: Number(form.semester), department_id: Number(form.department_id), student_count: Number(form.student_count) };
      if (editing) { await sectionsAPI.update(editing.id, payload); toast.success('Updated'); }
      else { await sectionsAPI.create(payload); toast.success('Added'); }
      resetForm(); load();
    } catch { toast.error('Failed'); }
  };

  const handleEdit = (s: Section) => {
    setForm({ name: s.name, year: String(s.year), semester: String(s.semester), department_id: String(s.department_id), student_count: String(s.student_count) });
    setEditing(s); setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try { await sectionsAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const filtered = sections.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Sections</h1><p className="text-slate-500 mt-1">Manage class sections</p></div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"><Plus className="w-4 h-4" /> Add Section</button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit Section' : 'Add Section'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    <option value="">Select</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                  <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Students</label>
                  <input type="number" value={form.student_count} onChange={(e) => setForm({ ...form, student_count: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No sections found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Section</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Semester</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Students</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">Year {s.year}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">Sem {s.semester}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{s.student_count}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
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
