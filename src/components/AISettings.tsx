import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Key, 
  RefreshCw, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  Zap,
  Info,
  Sliders,
  CheckCircle2,
  XCircle,
  Activity,
  Flame,
  Download
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { DynamicGeminiModel } from '../services/aiService';

export const AISettings: React.FC = () => {
  const { settings, updateSettings, refreshAIInsight, testApiKey, fetchDynamicModels, resetToSampleData } = useFinance();

  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [proMode, setProMode] = useState<boolean>(settings.proModeEnabled || false);
  const [selectedModel, setSelectedModel] = useState<string>(
    settings.selectedModel || 'gemini-3.5-flash-lite'
  );

  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number; rawError?: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [fetchedModels, setFetchedModels] = useState<DynamicGeminiModel[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState('');

  useEffect(() => {
    if (proMode) {
      handleFetchModels();
    }
  }, [proMode, apiKeyInput]);

  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    setFetchErrorMsg('');
    const res = await fetchDynamicModels(apiKeyInput.trim());
    if (res.success && res.models.length > 0) {
      setFetchedModels(res.models);
      if (!res.models.some(m => m.id === selectedModel)) {
        setSelectedModel(res.models[0].id);
      }
    } else {
      setFetchErrorMsg(res.message || 'Could not fetch models from API key.');
    }
    setIsFetchingModels(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ 
      geminiApiKey: apiKeyInput.trim(),
      proModeEnabled: proMode,
      selectedModel: selectedModel
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testApiKey(apiKeyInput.trim());
    setTestResult(result);
    setIsTesting(false);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshAIInsight();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>AI Intelligence, Pro Mode & Settings</span>
        </h2>
        <p className="text-xs text-slate-400">Configure Google Gemini API key, benchmark latency, and toggle Pro Mode to select models</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-6 border border-indigo-500/30">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Google Gemini API Configuration</h3>
              <p className="text-xs text-slate-400">Validate API key, measure latency, and configure active model</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
              proMode 
                ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10' 
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}>
              <Flame className={`w-3.5 h-3.5 ${proMode ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span>{proMode ? 'Pro Mode Active' : 'Standard Mode'}</span>
            </span>
          </div>
        </div>

        {isSaved && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>AI settings and Gemini Key saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Gemini API Key
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 py-2.5 px-4 glass-input rounded-xl text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition flex items-center justify-center space-x-2 shrink-0 shadow-md"
              >
                <Activity className={`w-4 h-4 text-indigo-400 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing Key...' : '⚡ Test API Key'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center">
              <Info className="w-3.5 h-3.5 mr-1 text-indigo-400 shrink-0" />
              If left blank, PocketPilot automatically falls back to an offline, token-saving heuristic AI engine.
            </p>
          </div>

          {testResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              testResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}>
              <div className="flex items-center justify-between font-bold text-sm">
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span>{testResult.success ? 'API Key Connection Successful!' : 'API Connection Test Failed'}</span>
                </div>
                {testResult.latencyMs && (
                  <span className="text-xs bg-slate-900/80 px-2 py-1 rounded border border-slate-800 text-emerald-400 font-mono">
                    ⚡ {testResult.latencyMs}ms Latency
                  </span>
                )}
              </div>
              <p className="text-xs">{testResult.message}</p>
              {testResult.rawError && (
                <details className="text-[10px] text-rose-300/80 pt-1 cursor-pointer">
                  <summary className="font-semibold underline">View technical error details</summary>
                  <pre className="mt-1 p-2 rounded bg-slate-950/80 overflow-x-auto text-rose-400 font-mono">
                    {testResult.rawError}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Pro Mode Toggle</h4>
                  <p className="text-xs text-slate-400">Enable Pro Mode to unlock model selection directly fetched from your API Key</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newMode = !proMode;
                  setProMode(newMode);
                  if (!newMode) {
                    setSelectedModel('gemini-3.5-flash-lite');
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  proMode ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    proMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {proMode && (
              <div className="pt-3 border-t border-slate-800 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Dynamic Models Fetched From Your API Key:</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={handleFetchModels}
                    disabled={isFetchingModels}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition"
                  >
                    <Download className={`w-3.5 h-3.5 ${isFetchingModels ? 'animate-spin' : ''}`} />
                    <span>{isFetchingModels ? 'Querying API...' : 'Fetch / Refresh List'}</span>
                  </button>
                </div>

                {fetchErrorMsg && (
                  <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                    ⚠️ {fetchErrorMsg} (Make sure your API Key is valid)
                  </p>
                )}

                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full py-2.5 px-3 glass-input rounded-xl text-xs bg-slate-900 text-slate-100 font-mono"
                >
                  {fetchedModels.length > 0 ? (
                    fetchedModels.map((m) => (
                      <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                        {m.displayName} ({m.id})
                      </option>
                    ))
                  ) : (
                    <>
                      {/* ── Gemini 3 (Latest Stable) ─────────────────────────────── */}
                      <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite ★ (Default – Fastest &amp; Budget-Friendly)</option>
                      <option value="gemini-3.6-flash">gemini-3.6-flash (Newest – Balanced Speed &amp; Intelligence)</option>
                      <option value="gemini-3.5-flash">gemini-3.5-flash (Agentic &amp; Coding Tasks)</option>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Frontier-Class, Low Cost)</option>
                      {/* ── Gemini 2.5 ────────────────────────────────────────────── */}
                      <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Budget Multimodal)</option>
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Best Price-Performance + Reasoning)</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro (Advanced – Complex Tasks &amp; Deep Reasoning)</option>
                      {/* ── Gemini 2.0 (Legacy) ───────────────────────────────────── */}
                      <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Legacy Lightweight)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Legacy Production)</option>
                    </>
                  )}
                </select>

                <p className="text-[10px] text-slate-400">
                  Currently active model for AI analysis & Ask Pocky queries: <strong className="text-amber-300 font-mono">{selectedModel}</strong>
                </p>
              </div>
            )}

            {!proMode && (
              <p className="text-[11px] text-slate-500 pt-1 italic">
                Model selection is hidden when Standard Mode is active. Toggle Pro Mode ON above to view and select models dynamically fetched from your API key.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
            >
              Save AI & Model Settings
            </button>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
          Active AI Capabilities Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-indigo-300 flex items-center">
              <Zap className="w-4 h-4 mr-1 text-indigo-400" /> Dynamic API Model Discovery
            </span>
            <p className="text-slate-400">
              Directly queries <code className="text-purple-300 font-mono">generativelanguage.googleapis.com</code> using your key to list available models.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-300 flex items-center">
              <Flame className="w-4 h-4 mr-1 text-amber-400" /> Pro Mode Conditional UI
            </span>
            <p className="text-slate-400">
              Model selection is cleanly hidden in Standard Mode and revealed only when Pro Mode toggle is enabled.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-300 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" /> Token-Saving Prompts
            </span>
            <p className="text-slate-400">
              Concise prompt templates in <code className="text-purple-300 font-mono">src/prompts/</code> minimize token consumption.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-purple-300 flex items-center">
              <Activity className="w-4 h-4 mr-1 text-purple-400" /> Latency Benchmarking
            </span>
            <p className="text-slate-400">
              Tests your API Key with real-time response latency measurement in milliseconds.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 space-y-3">
        <h3 className="text-sm font-bold text-rose-300">Reset Application State</h3>
        <p className="text-xs text-slate-400">
          Restore sample data (prefilled with realistic August 2026 transactions, income, categories, and debts) for quick testing.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Reset all transactions and settings to default sample data?')) {
              resetToSampleData();
              alert('Application state reset to sample data!');
            }
          }}
          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Sample Data</span>
        </button>
      </div>
    </div>
  );
};
