import { useState, useEffect } from 'react';
import { timeslotsAPI, collegesAPI } from '../services/api';
import { TimeSlot, College } from '../types';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function TimeSlotsPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ day: 'monday', period: '1', start_time: '09:00', end_time: '09:50', is_break: false, college_id: '' });

  const load = () => {
    Promise.all([timeslotsAPI.list(), collegesAPI.list()])
      .then(([s, c]) => { setSlots(s.data); setColleges(c.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await timeslotsAPI.create({ ...form, period: Number(form.period), college_id: Number(form.college_id) });
      toast.success('Time slot added');
      setShowForm(false);
      load();
    } catch { toast.error('Failed'); }
  };

  const handleGenerateDefault = async () => {
    if (colleges.length === 0) { toast.error('Create a college first'); return; }
    const collegeId = colleges[0].id;
    try {
      const res = await timeslotsAPI.generateDefault(collegeId);
      toast.success(res.data.detail);
      load();
    } catch { toast.error('Failed to generate'); }
  };

  const handleDelete = async (id: number) => {
    try { await timeslotsAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  // Group slots by day
  const grouped = DAYS.map((day) => ({
    day,
    slots: slots.filter((s) => s.day === day).sort((a, b) => a.period - b.period),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Time Slots</h1><p className="text-slate-500 mt-1">Configure periods and breaks</p></div>
        <div className="flex gap-2">
          <button onClick={handleGenerateDefault}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
            <Wand2 className="w-4 h-4" /> Generate Default
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Time Slot</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
                  <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                  <input type="number" min="1" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">College</label>
                <select required value={form.college_id} onChange={(e) => setForm({ ...form, college_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="">Select</option>{colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 mb-4">No time slots configured yet.</p>
          <button onClick={handleGenerateDefault}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            Generate Default Slots (Mon-Sat, 8 periods)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.filter(g => g.slots.length > 0).map(({ day, slots: daySlots }) => (
            <div key={day} className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 capitalize">{day}</h3>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((s) => (
                  <div key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${s.is_break ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <span className="font-medium text-slate-700">P{s.period}</span>
                    <span className="text-slate-500">{s.start_time} - {s.end_time}</span>
                    <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
