import { useState, useEffect } from 'react';
import { constraintsAPI, collegesAPI } from '../services/api';
import { Constraint, College } from '../types';
import { Plus, Trash2, Pencil, Shield, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Constraint | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', constraint_type: 'hard', college_id: '', priority: '1',
    rule_type: 'no_class_after', rule_day: '', rule_period: '6', rule_start: '1', rule_end: '4', rule_bonus: '5',
  });

  const load = () => {
    Promise.all([constraintsAPI.list(), collegesAPI.list()])
      .then(([c, col]) => { setConstraints(c.data); setColleges(col.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', constraint_type: 'hard', college_id: '', priority: '1',
      rule_type: 'no_class_after', rule_day: '', rule_period: '6', rule_start: '1', rule_end: '4', rule_bonus: '5' });
    setEditing(null); setShowForm(false);
  };

  const buildRule = () => {
    switch (form.rule_type) {
      case 'no_class_after': return { type: 'no_class_after', period: Number(form.rule_period), day: form.rule_day || undefined };
      case 'lab_continuous': return { type: 'lab_continuous' };
      case 'room_type_match': return { type: 'room_type_match' };
      case 'prefer_time_range': return { type: 'prefer_time_range', start_period: Number(form.rule_start), end_period: Number(form.rule_end), bonus: Number(form.rule_bonus) };
      case 'avoid_day': return { type: 'avoid_day', day: form.rule_day, penalty: -10 };
      default: return { type: form.rule_type };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name, description: form.description, constraint_type: form.constraint_type,
        college_id: Number(form.college_id), priority: Number(form.priority), rule: buildRule(),
      };
      if (editing) { await constraintsAPI.update(editing.id, payload); toast.success('Updated'); }
      else { await constraintsAPI.create(payload); toast.success('Created'); }
      resetForm(); load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try { await constraintsAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Constraints</h1>
          <p className="text-slate-500 mt-1">Configure scheduling rules</p></div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Constraint</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit Constraint' : 'Add Constraint'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" rows={2} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={form.constraint_type} onChange={(e) => setForm({ ...form, constraint_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    <option value="hard">Hard</option><option value="soft">Soft</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <input type="number" min="1" max="10" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">College</label>
                  <select required value={form.college_id} onChange={(e) => setForm({ ...form, college_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    <option value="">Select</option>{colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Rule Type</label>
                <select value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="no_class_after">No classes after period</option>
                  <option value="lab_continuous">Labs must be continuous</option>
                  <option value="room_type_match">Room type must match</option>
                  <option value="prefer_time_range">Prefer time range</option>
                  <option value="avoid_day">Avoid day</option>
                </select></div>
              {(form.rule_type === 'no_class_after' || form.rule_type === 'avoid_day') && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Day (optional)</label>
                    <select value={form.rule_day} onChange={(e) => setForm({ ...form, rule_day: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                      <option value="">All days</option>
                      {['monday','tuesday','wednesday','thursday','friday','saturday'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
                    </select></div>
                  {form.rule_type === 'no_class_after' && (
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">After Period</label>
                      <input type="number" min="1" max="8" value={form.rule_period} onChange={(e) => setForm({ ...form, rule_period: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
                  )}
                </div>
              )}
              {form.rule_type === 'prefer_time_range' && (
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Period</label>
                    <input type="number" value={form.rule_start} onChange={(e) => setForm({ ...form, rule_start: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">End Period</label>
                    <input type="number" value={form.rule_end} onChange={(e) => setForm({ ...form, rule_end: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Bonus</label>
                    <input type="number" value={form.rule_bonus} onChange={(e) => setForm({ ...form, rule_bonus: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
                </div>
              )}
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
        ) : constraints.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No constraints configured yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {constraints.map((c) => (
              <div key={c.id} className="p-4 hover:bg-slate-50 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  c.constraint_type === 'hard' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {c.constraint_type === 'hard' ? <Shield className="w-5 h-5 text-red-600" /> : <Sparkles className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-slate-900">{c.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.constraint_type === 'hard' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                    }`}>{c.constraint_type}</span>
                    <span className="text-xs text-slate-400">Priority: {c.priority}</span>
                  </div>
                  {c.description && <p className="text-sm text-slate-500 mt-0.5">{c.description}</p>}
                  <p className="text-xs text-slate-400 mt-1 font-mono">Rule: {JSON.stringify(c.rule)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(c); setShowForm(true); setForm({
                    name: c.name, description: c.description || '', constraint_type: c.constraint_type,
                    college_id: String(c.college_id), priority: String(c.priority),
                    rule_type: (c.rule as Record<string, string>).type || 'no_class_after', rule_day: '', rule_period: '6', rule_start: '1', rule_end: '4', rule_bonus: '5',
                  }); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                    <Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
