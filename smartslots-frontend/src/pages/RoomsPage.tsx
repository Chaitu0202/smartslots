import { useState, useEffect } from 'react';
import { roomsAPI, collegesAPI } from '../services/api';
import { Room, College } from '../types';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', code: '', room_type: 'classroom', capacity: '60',
    college_id: '', building: '', floor: '',
  });

  const load = () => {
    Promise.all([roomsAPI.list(), collegesAPI.list()])
      .then(([r, c]) => { setRooms(r.data); setColleges(c.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', code: '', room_type: 'classroom', capacity: '60', college_id: '', building: '', floor: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, capacity: Number(form.capacity), college_id: Number(form.college_id), floor: form.floor ? Number(form.floor) : null };
      if (editing) {
        await roomsAPI.update(editing.id, payload);
        toast.success('Room updated');
      } else {
        await roomsAPI.create(payload);
        toast.success('Room added');
      }
      resetForm();
      load();
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (r: Room) => {
    setForm({
      name: r.name, code: r.code, room_type: r.room_type, capacity: String(r.capacity),
      college_id: String(r.college_id), building: r.building || '', floor: r.floor !== null ? String(r.floor) : '',
    });
    setEditing(r);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this room?')) return;
    try { await roomsAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase())
  );

  const typeLabel = (t: string) => {
    const map: Record<string, string> = { classroom: 'Classroom', lab: 'Lab', seminar_hall: 'Seminar Hall' };
    return map[t] || t;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rooms</h1>
          <p className="text-slate-500 mt-1">Manage classrooms and labs</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search rooms..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit Room' : 'Add Room'}</h3>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={form.room_type}
                    onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    <option value="classroom">Classroom</option>
                    <option value="lab">Lab</option>
                    <option value="seminar_hall">Seminar Hall</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                  <input type="number" value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">College</label>
                <select required value={form.college_id}
                  onChange={(e) => setForm({ ...form, college_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="">Select</option>
                  {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Building</label>
                  <input type="text" value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Floor</label>
                  <input type="number" value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
              </div>
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
          <div className="text-center py-12 text-slate-500">No rooms found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Room</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Capacity</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{r.code}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.room_type === 'lab' ? 'bg-purple-50 text-purple-700' :
                        r.room_type === 'seminar_hall' ? 'bg-amber-50 text-amber-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>{typeLabel(r.room_type)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{r.capacity}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{r.building ? `${r.building}, Floor ${r.floor}` : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50">
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
