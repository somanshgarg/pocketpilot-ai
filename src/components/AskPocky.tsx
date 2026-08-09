import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  FileText, 
  RefreshCcw,
  Zap,
  Lightbulb
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { askPocky } from '../services/aiService';
import { DEFAULT_SUGGESTED_QUESTIONS } from '../prompts/pockyPrompts';

interface Message {
  id: string;
  sender: 'user' | 'pocky';
  text: string;
  timestamp: string;
}

export const AskPocky: React.FC = () => {
  const { transactions, budget, lendingEntries, settings } = useFinance();

  const activeModel = settings.selectedModel || 'gemini-3.5-flash-lite';
  const hasApiKey = !!(settings.geminiApiKey && settings.geminiApiKey.trim().length > 10);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'pocky',
      text: `👋 **Hi there! I'm Pocky**, your Gemini-powered personal finance assistant!\n\nAsk me anything about your **recent spends**, **category breakdowns**, **income vs expenses**, **budget runway**, or **debt status**.\n\nYou can also click any of the suggested questions below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleSendQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    console.log('[AskPocky] Sending query:', text);
    console.log('[AskPocky] API key present:', hasApiKey, '| Model:', activeModel);

    try {
      const pockyAnswer = await askPocky(
        text,
        transactions,
        budget,
        lendingEntries,
        settings.geminiApiKey,
        activeModel
      );

      const pockyMsg: Message = {
        id: 'pocky-' + Date.now(),
        sender: 'pocky',
        text: pockyAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, pockyMsg]);
    } catch (err: any) {
      console.error('AskPocky Error:', err);
      const rawErr = err?.message || String(err);
      let userFriendlyMsg = rawErr;
      if (rawErr.includes('429') || rawErr.includes('RESOURCE_EXHAUSTED')) {
        userFriendlyMsg = "⚠️ **Quota Exceeded (429 RESOURCE_EXHAUSTED)**: Your Gemini API key has hit rate/quota limits across available models. Please check your plan limits at https://ai.dev/rate-limit.";
      } else if (rawErr.includes('API_KEY_INVALID') || rawErr.includes('400') || rawErr.includes('403')) {
        userFriendlyMsg = "⚠️ **Invalid API Key (400/403)**: The Gemini API Key provided in AI Settings is invalid or unauthorized. Please verify your key in Settings.";
      }

      const errorMsg: Message = {
        id: 'err-' + Date.now(),
        sender: 'pocky',
        text: `🐾 **Gemini API Error:**\n\n${userFriendlyMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'pocky',
        text: `👋 **Chat reset! I'm Pocky**, ready for your financial questions.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-xl shadow-purple-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="w-8 h-8 text-indigo-400 animate-bounce" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                Ask Pocky AI
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center">
                <Zap className="w-3 h-3 mr-1 text-emerald-400" /> {activeModel}
              </span>
            </div>
            <p className="text-xs text-slate-400">Conversational Q&A on your recent spends, overall budget, and savings</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 text-slate-300">
          <FileText className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Prompts: <code className="text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded">src/prompts/pockyPrompts.ts</code></span>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl space-y-2">
        <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Quick Suggested Questions for Pocky:</span>
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {DEFAULT_SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600/30 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition text-left"
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[480px]">
        <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Pocky AI Financial Q&A Session</span>
          </span>
          <div className="flex items-center space-x-2">
            {hasApiKey ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Gemini API · {activeModel}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⚠️ No API Key · Offline Mode
              </span>
            )}
            <button
              onClick={handleClearChat}
              className="text-slate-500 hover:text-slate-300 transition flex items-center space-x-1"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>


        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                msg.sender === 'pocky' 
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-600' 
                  : 'bg-slate-700'
              }`}>
                {msg.sender === 'pocky' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'pocky'
                  ? 'bg-slate-900/90 border border-slate-800 text-slate-200'
                  : 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/20'
              }`}>
                <div className="whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>
                <span className={`block text-[9px] mt-2 text-right ${msg.sender === 'pocky' ? 'text-slate-500' : 'text-indigo-200'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-indigo-300 animate-pulse">
                🐾 Pocky is analyzing your financial records using {activeModel}...
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery(inputQuery);
          }}
          className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask Pocky anything about your recent spends, categories, or budget..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            className="flex-1 py-2.5 px-4 glass-input rounded-xl text-xs"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center space-x-1.5"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HelpCircle className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <strong className="block text-purple-300">Want to edit Pocky's prompt instructions or system persona?</strong>
            <span className="text-slate-400">Open <code className="text-purple-300 font-mono">src/prompts/pockyPrompts.ts</code> and update the <code className="text-purple-300 font-mono">POCKY_SYSTEM_PROMPT</code> or <code className="text-purple-300 font-mono">POCKY_USER_QUERY_PROMPT</code> strings!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
