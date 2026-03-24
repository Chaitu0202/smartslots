import { useState, useEffect } from 'react';
import { aiAPI, collegesAPI } from '../services/api';
import { College } from '../types';
import { Brain, Send, Sparkles, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIAssistantPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [collegeId, setCollegeId] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    text: string;
    result: {
      parsed_constraint: Record<string, unknown>;
      explanation: string;
      confidence: number;
      auto_created?: boolean;
      constraint_id?: number;
    };
  }[]>([]);

  useEffect(() => {
    collegesAPI.list().then((r) => {
      setColleges(r.data);
      if (r.data.length > 0) setCollegeId(String(r.data[0].id));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !collegeId) return;
    setLoading(true);
    try {
      const res = await aiAPI.parseConstraint(input.trim(), Number(collegeId));
      setResults((prev) => [{ text: input.trim(), result: res.data }, ...prev]);
      if (res.data.confidence >= 0.8) {
        toast.success('Constraint parsed and auto-created!');
      } else if (res.data.confidence > 0) {
        toast.success('Constraint parsed (low confidence - not auto-created)');
      } else {
        toast.error('Could not parse constraint. Try rephrasing.');
      }
      setInput('');
    } catch {
      toast.error('Failed to parse constraint');
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "No classes after 2 PM on Friday",
    "Prefer morning classes",
    "No labs on Saturday",
    "Labs must be continuous",
    "Avoid Wednesday",
    "No classes after 4 PM",
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">AI Scheduling Assistant</h1>
        <p className="text-slate-500 mt-1">Type natural language constraints and I'll convert them to scheduling rules</p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">College</label>
            <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
              <option value="">Select College</option>
              {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Constraint (Natural Language)</label>
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., No classes after 2 PM on Friday"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm pr-12"
              />
              <button type="submit" disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Examples */}
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button key={ex} onClick={() => setInput(ex)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-full text-xs text-slate-600 transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Results</h3>
          {results.map((r, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  r.result.confidence >= 0.8 ? 'bg-emerald-100' : r.result.confidence > 0 ? 'bg-amber-100' : 'bg-red-100'
                }`}>
                  {r.result.confidence >= 0.8 ? <Sparkles className="w-4 h-4 text-emerald-600" /> :
                   r.result.confidence > 0 ? <Sparkles className="w-4 h-4 text-amber-600" /> :
                   <AlertTriangle className="w-4 h-4 text-red-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 italic mb-1">"{r.text}"</p>
                  <p className="text-sm font-medium text-slate-900">{r.result.explanation}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.result.confidence >= 0.8 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      Confidence: {Math.round(r.result.confidence * 100)}%
                    </span>
                    {r.result.auto_created && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        Auto-created (ID: {r.result.constraint_id})
                      </span>
                    )}
                  </div>
                  {r.result.parsed_constraint && Object.keys(r.result.parsed_constraint).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-400 cursor-pointer">View parsed constraint</summary>
                      <pre className="mt-1 text-xs text-slate-500 bg-slate-50 rounded p-2 overflow-x-auto">
                        {JSON.stringify(r.result.parsed_constraint, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
