import { useState, useEffect } from 'react';
import { teachersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TeacherPreference } from '../types';
import { Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const PREF_COLORS: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  preferred: 'bg-blue-100 text-blue-700 border-blue-200',
  unavailable: 'bg-red-100 text-red-700 border-red-200',
};

export default function PreferencesPage() {
  const { user } = useAuth();
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Find teacher profile for current user
    teachersAPI.list().then((res) => {
      const myTeacher = res.data.find((t: { user_id: number | null }) => t.user_id === user?.id);
      if (myTeacher) {
        setTeacherId(myTeacher.id);
        loadPreferences(myTeacher.id);
      }
    });
  }, [user]);

  const loadPreferences = async (tid: number) => {
    const res = await teachersAPI.getPreferences(tid);
    const prefs: Record<string, string> = {};
    res.data.forEach((p: TeacherPreference) => {
      prefs[`${p.day}_${p.period}`] = p.preference;
    });
    setPreferences(prefs);
  };

  const togglePref = (day: string, period: number) => {
    const key = `${day}_${period}`;
    const current = preferences[key] || 'available';
    const next = current === 'available' ? 'preferred' : current === 'preferred' ? 'unavailable' : 'available';
    setPreferences({ ...preferences, [key]: next });
  };

  const handleSave = async () => {
    if (!teacherId) { toast.error('No teacher profile linked to your account'); return; }
    setSaving(true);
    try {
      // Clear and re-set all preferences
      await teachersAPI.clearPreferences(teacherId);
      for (const [key, value] of Object.entries(preferences)) {
        if (value !== 'available') {
          const [day, periodStr] = key.split('_');
          await teachersAPI.setPreference(teacherId, {
            teacher_id: teacherId,
            day,
            period: Number(periodStr),
            preference: value,
          });
        }
      }
      toast.success('Preferences saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences({});
    toast.success('Preferences reset');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Preferences</h1>
          <p className="text-slate-500 mt-1">Set your availability and preferred time slots</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {!teacherId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          No teacher profile is linked to your account. Please contact your admin.
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 items-center">
        <span className="text-xs text-slate-500">Click to toggle:</span>
        {Object.entries(PREF_COLORS).map(([pref, cls]) => (
          <span key={pref} className={`px-3 py-1 rounded-lg border text-xs font-medium capitalize ${cls}`}>
            {pref}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase border-b border-r border-slate-200">Day / Period</th>
              {PERIODS.map((p) => (
                <th key={p} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase border-b border-r border-slate-200 text-center">P{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day} className="border-b border-slate-100">
                <td className="px-4 py-3 text-sm font-medium text-slate-700 border-r border-slate-200 bg-slate-50 capitalize">
                  {DAY_LABELS[day]}
                </td>
                {PERIODS.map((period) => {
                  const key = `${day}_${period}`;
                  const pref = preferences[key] || 'available';
                  return (
                    <td key={period} className="px-2 py-2 border-r border-slate-100 text-center">
                      <button
                        onClick={() => togglePref(day, period)}
                        className={`w-full py-2 rounded-lg text-xs font-medium border transition-colors ${PREF_COLORS[pref]}`}
                      >
                        {pref === 'available' ? 'Avail' : pref === 'preferred' ? 'Pref' : 'N/A'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
