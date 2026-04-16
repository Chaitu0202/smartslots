import { useState, useEffect } from 'react';
import { assignmentsAPI, teachersAPI, subjectsAPI, sectionsAPI } from '../services/api';
import { SubjectAssignment, Teacher, Subject, Section } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ teacher_id: '', subject_id: '', section_id: '' });

  const load = () => {
    Promise.all([assignmentsAPI.list(), teachersAPI.list(), subjectsAPI.list(), sectionsAPI.list()])
      .then(([a, t, s, sec]) => {
        setAssignments(a.data); setTeachers(t.data); setSubjects(s.data); setSections(sec.data);
      }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignmentsAPI.create({
        teacher_id: Number(form.teacher_id),
        subject_id: Number(form.subject_id),
        section_id: Number(form.section_id),
      });
      toast.success('Assignment created');
      setForm({ teacher_id: '', subject_id: '', section_id: '' });
      setShowForm(false);
      load();
    } catch { toast.error('Failed to create assignment'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try { await assignmentsAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const getName = (list: { id: number; name: string }[], id: number) =>
    list.find((i) => i.id === id)?.name || `#${id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Subject Assignments</h1>
          <p className="text-slate-500 mt-1">Assign teachers to subjects for each section</p></div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Assignment</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Assignment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
                <select required value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.employee_id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="">Select Subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                <select required value={form.section_id} onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="">Select Section</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.name} (Year {s.year}, Sem {s.semester})</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No assignments yet. Create subject assignments to generate timetables.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Section</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{getName(teachers, a.teacher_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{getName(subjects, a.subject_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{getName(sections, a.section_id)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
