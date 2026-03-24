import { useState, useEffect } from 'react';
import { timetablesAPI, departmentsAPI } from '../services/api';
import { Timetable, TimetableEntry, Department } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Eye, Trash2, Download, CheckCircle, AlertTriangle, Wand2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

export default function TimetablesPage() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTT, setSelectedTT] = useState<Timetable | null>(null);
  const [viewEntries, setViewEntries] = useState<TimetableEntry[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [filterSection, setFilterSection] = useState('');
  const [conflicts, setConflicts] = useState<{ type: string; description: string }[]>([]);
  const [genForm, setGenForm] = useState({ department_id: '', academic_year: '2025-2026', semester: '1', name: '' });

  const canManage = isAdmin || isSuperAdmin;

  const load = () => {
    Promise.all([timetablesAPI.list(), departmentsAPI.list()])
      .then(([t, d]) => { setTimetables(t.data); setDepartments(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await timetablesAPI.generate({
        department_id: Number(genForm.department_id),
        academic_year: genForm.academic_year,
        semester: Number(genForm.semester),
        name: genForm.name || undefined,
      });
      if (res.data.success) {
        toast.success(`Timetable generated! Score: ${res.data.score}`);
        setShowGenerate(false);
        load();
      } else {
        toast.error('Generation failed. Check constraints.');
        console.error(res.data.log);
      }
    } catch {
      toast.error('Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const handleView = async (tt: Timetable) => {
    try {
      const res = await timetablesAPI.get(tt.id);
      setSelectedTT(res.data);
      setViewEntries(res.data.entries || []);
      // Load conflicts
      const conflictRes = await timetablesAPI.conflicts(tt.id);
      setConflicts(conflictRes.data.conflicts || []);
    } catch { toast.error('Failed to load timetable'); }
  };

  const handlePublish = async (id: number) => {
    try { await timetablesAPI.publish(id); toast.success('Published!'); load(); if (selectedTT?.id === id) handleView({ ...selectedTT!, is_published: true }); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this timetable?')) return;
    try { await timetablesAPI.delete(id); toast.success('Deleted'); if (selectedTT?.id === id) { setSelectedTT(null); setViewEntries([]); } load(); }
    catch { toast.error('Failed'); }
  };

  const handleExport = async (id: number) => {
    try {
      const res = await timetablesAPI.exportExcel(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `timetable_${id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded!');
    } catch { toast.error('Export failed'); }
  };

  // Get unique periods from entries
  const periods = [...new Set(viewEntries.map((e) => e.period).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0));
  const sections = [...new Set(viewEntries.map((e) => e.section_name).filter(Boolean))];

  const filteredEntries = filterSection
    ? viewEntries.filter((e) => e.section_name === filterSection)
    : viewEntries;

  const getEntry = (day: string, period: number) =>
    filteredEntries.filter((e) => e.day === day && e.period === period);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timetables</h1>
          <p className="text-slate-500 mt-1">View and manage schedules</p>
        </div>
        {canManage && (
          <button onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Wand2 className="w-4 h-4" /> Generate Timetable
          </button>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Generate Timetable</h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select required value={genForm.department_id} onChange={(e) => setGenForm({ ...genForm, department_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="">Select</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
                  <input type="text" value={genForm.academic_year} onChange={(e) => setGenForm({ ...genForm, academic_year: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                  <select value={genForm.semester} onChange={(e) => setGenForm({ ...genForm, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Name (optional)</label>
                <input type="text" value={genForm.name} onChange={(e) => setGenForm({ ...genForm, name: e.target.value })}
                  placeholder="Auto-Generated Timetable"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGenerate(false)} className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={generating}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timetable List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : timetables.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
            No timetables yet. Generate your first timetable.
          </div>
        ) : timetables.map((tt) => (
          <div key={tt.id} className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-colors ${
            selectedTT?.id === tt.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
          }`} onClick={() => handleView(tt)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{tt.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{tt.academic_year} - Sem {tt.semester}</p>
              </div>
              {tt.is_published ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" /> Published
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">Draft</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Score: {tt.score}</span>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleView(tt); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50">
                  <Eye className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleExport(tt.id); }} className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50">
                  <Download className="w-4 h-4" /></button>
                {canManage && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(tt.id); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
                    <Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timetable Grid View */}
      {selectedTT && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{selectedTT.name}</h2>
            <div className="flex gap-2 items-center">
              {sections.length > 1 && (
                <div className="relative">
                  <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none pr-8 appearance-none bg-white">
                    <option value="">All Sections</option>
                    {sections.map(s => <option key={s} value={s!}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              )}
              {canManage && !selectedTT.is_published && (
                <button onClick={() => handlePublish(selectedTT.id)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
                  Publish
                </button>
              )}
            </div>
          </div>

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-semibold text-red-800">{conflicts.length} Conflict(s) Detected</h3>
              </div>
              {conflicts.map((c, i) => (
                <p key={i} className="text-sm text-red-700 ml-7">{c.description}</p>
              ))}
            </div>
          )}

          {/* Grid */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase border-b border-r border-slate-200 w-20">Day</th>
                  {periods.map((p) => (
                    <th key={p} className="px-2 py-3 text-xs font-medium text-slate-500 uppercase border-b border-r border-slate-200 text-center">
                      P{p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 text-sm font-medium text-slate-700 border-r border-slate-200 bg-slate-50">
                      {DAY_LABELS[day]}
                    </td>
                    {periods.map((p) => {
                      const entries = getEntry(day, p!);
                      return (
                        <td key={p} className="px-1 py-1 border-r border-slate-100 align-top min-w-[120px]">
                          {entries.map((entry, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg p-2 mb-1 text-xs"
                              style={{
                                backgroundColor: (entry.subject_color || '#E2E8F0') + '20',
                                borderLeft: `3px solid ${entry.subject_color || '#94A3B8'}`,
                              }}
                            >
                              <p className="font-semibold text-slate-800">{entry.subject_code}</p>
                              <p className="text-slate-600">{entry.teacher_name}</p>
                              {entry.section_name && !filterSection && (
                                <p className="text-slate-400">{entry.section_name}</p>
                              )}
                              {entry.room_name && (
                                <p className="text-slate-400">{entry.room_name}</p>
                              )}
                              {entry.is_lab && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">LAB</span>
                              )}
                            </div>
                          ))}
                          {entries.length === 0 && (
                            <div className="h-16 flex items-center justify-center text-slate-300 text-xs">-</div>
                          )}
                        </td>
                      );
                    })}
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
