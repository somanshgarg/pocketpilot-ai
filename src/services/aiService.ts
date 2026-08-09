import { GoogleGenAI, Type } from '@google/genai';
import type { Transaction, MonthlyBudget, Category, AIInsight, LendingEntry } from '../types';
import { INSIGHTS_ANALYSIS_PROMPT } from '../prompts/insightPrompts';
import { POCKY_USER_QUERY_PROMPT } from '../prompts/pockyPrompts';

function getActiveApiKey(userKey?: string): string | undefined {
  if (userKey && userKey.trim().length > 10) {
    return userKey.trim();
  }
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 10) {
    return envKey.trim();
  }
  return undefined;
}

export interface DynamicGeminiModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

/**
 * Queries Google's ModelService (https://generativelanguage.googleapis.com/v1beta/models)
 * to get the exact list of active models for the user's API key.
 */
export async function fetchAvailableGeminiModels(
  apiKey?: string
): Promise<{ success: boolean; models: DynamicGeminiModel[]; message?: string }> {
  const activeKey = getActiveApiKey(apiKey);
  if (!activeKey) {
    return {
      success: false,
      models: [],
      message: 'No valid API key provided. Please enter your Gemini API Key.'
    };
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        models: [],
        message: errData?.error?.message || `Failed to fetch models (HTTP ${res.status}).`
      };
    }

    const data = await res.json();
    if (!data.models || !Array.isArray(data.models)) {
      return { success: false, models: [], message: 'Unexpected response format from Gemini API.' };
    }

    // Filter for models that support generateContent
    const geminiModels: DynamicGeminiModel[] = data.models
      .filter((m: any) => {
        const name = (m.name || '').toLowerCase();
        const methods = m.supportedGenerationMethods || [];
        return name.includes('gemini') && methods.includes('generateContent');
      })
      .map((m: any) => {
        const id = m.name.startsWith('models/') ? m.name.replace('models/', '') : m.name;
        return {
          id: id,
          name: id,
          displayName: m.displayName || id,
          description: m.description || ''
        };
      });

    return {
      success: true,
      models: geminiModels
    };
  } catch (err: any) {
    console.error("Failed to dynamically fetch Gemini models:", err);
    return {
      success: false,
      models: [],
      message: err?.message || 'Network error fetching models from Gemini API.'
    };
  }
}

/**
 * Candidate chain of standard fallback Gemini models (newest first).
 */
const FALLBACK_MODEL_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash'
];

/**
 * Resolves a valid model ID for an API key by cross-referencing live available models.
 */
async function resolveValidModel(apiKey: string, preferredModel?: string): Promise<string> {
  const modelsRes = await fetchAvailableGeminiModels(apiKey);
  if (modelsRes.success && modelsRes.models.length > 0) {
    // Use the user's preferred model if it is available
    if (preferredModel && modelsRes.models.some(m => m.id === preferredModel)) {
      return preferredModel;
    }
    // Walk the canonical fallback chain and return the first available model
    for (const candidate of FALLBACK_MODEL_CHAIN) {
      if (modelsRes.models.some(m => m.id === candidate)) {
        return candidate;
      }
    }
    // Last resort: first model that supports generateContent
    const flashModel = modelsRes.models.find(m => m.id.includes('flash'));
    return flashModel ? flashModel.id : modelsRes.models[0].id;
  }
  // No live list available – honour the preferred model or fall back to the default
  return preferredModel || 'gemini-3.5-flash-lite';
}

/**
 * Tries executing a generateContent request with the preferred model first,
 * and if a 404 (Not Found) or 429 (Resource Exhausted / Quota Limit) error occurs for that model,
 * automatically attempts alternative Gemini models in sequence.
 */
async function tryGenerateWithFallback<T>(
  activeKey: string,
  preferredModel: string | undefined,
  requestFn: (model: string) => Promise<T>
): Promise<{ result: T; usedModel: string }> {
  const primaryModel = await resolveValidModel(activeKey, preferredModel);
  const candidateModels = [
    primaryModel,
    ...FALLBACK_MODEL_CHAIN.filter(m => m !== primaryModel)
  ];

  let lastError: any = null;
  for (const model of candidateModels) {
    try {
      const result = await requestFn(model);
      if (result) {
        return { result, usedModel: model };
      }
    } catch (err: any) {
      lastError = err;
      const errStr = err?.message || String(err);
      
      // Stop retrying immediately if key is invalid (400/403)
      if (errStr.includes('API_KEY_INVALID') || errStr.includes('400') || errStr.includes('403')) {
        throw err;
      }

      // Check for 404 or model-specific quota limit
      const isNotFound = errStr.includes('NOT_FOUND') || errStr.includes('404') || errStr.includes('not found');
      const isQuotaExceeded = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
      
      if (isNotFound || isQuotaExceeded) {
        console.warn(`Model "${model}" failed (${isNotFound ? '404 Not Found' : '429 Quota Exceeded'}). Retrying next model in candidate chain...`);
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

export async function testGeminiApiKey(
  apiKey?: string,
  modelName?: string
): Promise<{ success: boolean; message: string; latencyMs?: number; rawError?: string; usedModel?: string }> {
  const activeKey = getActiveApiKey(apiKey);
  if (!activeKey) {
    return {
      success: false,
      message: 'No API Key found. Please enter a valid Gemini API Key.'
    };
  }

  const startTime = performance.now();

  try {
    const ai = new GoogleGenAI({ apiKey: activeKey });
    const { result: response, usedModel } = await tryGenerateWithFallback(
      activeKey,
      modelName,
      (model) => ai.models.generateContent({
        model,
        contents: 'Respond with exactly one word: "OK"',
        config: {
          maxOutputTokens: 10,
          temperature: 0.1
        }
      })
    );

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    if (response && response.text) {
      return {
        success: true,
        message: `API Key validated successfully! Connected to active model "${usedModel}" in ${latencyMs}ms.`,
        latencyMs,
        usedModel
      };
    } else {
      return {
        success: false,
        message: 'API Key accepted, but returned an empty response from Gemini.',
        latencyMs,
        usedModel
      };
    }
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    console.error("Gemini API Key Verification Error:", err);

    let userFriendlyError = 'API Key test failed. ';
    if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('400') || rawMsg.includes('403')) {
      userFriendlyError += 'The API Key provided is invalid or has restricted permissions.';
    } else if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      userFriendlyError += 'Quota limit reached (429 RESOURCE_EXHAUSTED). Free tier limits applied across tested models. PocketPilot will automatically fall back to its offline heuristic engine.';
    } else if (rawMsg.includes('NOT_FOUND') || rawMsg.includes('404')) {
      userFriendlyError += 'The requested model was not found or is unavailable for this key across all available model fallbacks.';
    } else {
      userFriendlyError += rawMsg;
    }

    return {
      success: false,
      message: userFriendlyError,
      rawError: rawMsg
    };
  }
}

export async function generateFinancialInsights(
  transactions: Transaction[],
  budget: MonthlyBudget,
  _categories: Category[],
  apiKey?: string,
  modelName?: string
): Promise<AIInsight> {
  const currentMonthTx = transactions;
  const expenses = currentMonthTx.filter(t => t.type === 'EXPENSE');
  const incomes = currentMonthTx.filter(t => t.type === 'INCOME');

  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const remainingBalance = Math.max(0, (budget.totalBudget + totalIncome) - totalSpent);
  
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);

  const categoryTotals: Record<string, number> = {};
  expenses.forEach(t => {
    categoryTotals[t.categoryName] = (categoryTotals[t.categoryName] || 0) + t.amount;
  });

  const dailyBurnRate = currentDay > 0 ? totalSpent / currentDay : 0;
  
  let predictedDepletionDate = 'Safe (Within Budget)';
  let anomalyDetected = false;

  if (dailyBurnRate > 0 && remainingBalance < (dailyBurnRate * daysRemaining)) {
    const daysLeft = Math.floor(remainingBalance / dailyBurnRate);
    const runoutDate = new Date();
    runoutDate.setDate(now.getDate() + daysLeft);
    predictedDepletionDate = runoutDate.toISOString().split('T')[0];
    anomalyDetected = true;
  }

  const activeKey = getActiveApiKey(apiKey);

  if (activeKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const prompt = INSIGHTS_ANALYSIS_PROMPT({
        budget: budget.totalBudget,
        totalIncome,
        totalSpent,
        remainingBalance,
        currentDay,
        daysInMonth,
        categoryTotals,
        dailyBurnRate
      });

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          healthScore: { type: Type.INTEGER, description: "Score from 0 to 100" },
          status: { type: Type.STRING, enum: ["HEALTHY", "WARNING", "CRITICAL"] },
          summary: { type: Type.STRING, description: "One concise summary sentence" },
          insights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2 analytical insights"
          },
          savingTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2 saving recommendations"
          },
          predictedDepletionDate: { type: Type.STRING, description: "YYYY-MM-DD or Safe" },
          anomalyDetected: { type: Type.BOOLEAN }
        },
        required: ["healthScore", "status", "summary", "insights", "savingTips", "predictedDepletionDate", "anomalyDetected"]
      };

      const { result: aiResponse } = await tryGenerateWithFallback(
        activeKey,
        modelName,
        (model) => ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.3
          }
        })
      );

      if (aiResponse && aiResponse.text) {
        const parsed = JSON.parse(aiResponse.text);
        return {
          ...parsed,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn(`Gemini API call failed, using heuristic engine fallback:`, err);
    }
  }

  const percentageUsed = (totalSpent / budget.totalBudget) * 100;
  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  let healthScore = 100;

  if (percentageUsed >= 90 || remainingBalance === 0) {
    status = 'CRITICAL';
    healthScore = Math.max(10, Math.round(100 - percentageUsed));
  } else if (percentageUsed >= 70 || (dailyBurnRate * daysRemaining > remainingBalance)) {
    status = 'WARNING';
    healthScore = Math.round(100 - (percentageUsed * 0.8));
  } else {
    healthScore = Math.min(100, Math.round(100 - (percentageUsed * 0.5)));
  }

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'None';
  const topCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

  const insightsList: string[] = [];
  const tipsList: string[] = [];

  if (topCategory !== 'None') {
    insightsList.push(`Highest spending area this month: ${topCategory} at ₹${topCategoryAmount.toLocaleString('en-IN')}.`);
  }

  if (dailyBurnRate > 0) {
    insightsList.push(`Average daily burn rate: ₹${dailyBurnRate.toFixed(0)}/day.`);
  }

  if (status === 'CRITICAL') {
    insightsList.push(`Consumed ${percentageUsed.toFixed(1)}% of your monthly budget threshold.`);
    tipsList.push(`Pause discretionary spend in ${topCategory} immediately.`);
    tipsList.push(`Switch to cash payments for daily needs.`);
  } else if (status === 'WARNING') {
    insightsList.push(`Daily burn rate indicates budget depletion risk.`);
    tipsList.push(`Cap daily expenses to under ₹${(remainingBalance / daysRemaining).toFixed(0)}/day.`);
    tipsList.push(`Seek lower-cost alternatives for ${topCategory}.`);
  } else {
    insightsList.push(`Spending within planned limits. ${daysRemaining} days left.`);
    tipsList.push(`Allocate 15% of balance (₹${(remainingBalance * 0.15).toFixed(0)}) to emergency savings.`);
    tipsList.push(`Maintain current UPI/Cash spending ratio.`);
  }

  return {
    healthScore,
    status,
    summary: status === 'HEALTHY' 
      ? `Budget is healthy! You've used ${percentageUsed.toFixed(0)}% of your ₹${budget.totalBudget.toLocaleString('en-IN')} limit.`
      : status === 'WARNING'
      ? `Warning: Spent ${percentageUsed.toFixed(0)}% of your budget with ${daysRemaining} days remaining.`
      : `Critical Alert: Nearing or exceeding monthly budget.`,
    insights: insightsList,
    savingTips: tipsList,
    predictedDepletionDate,
    anomalyDetected,
    lastUpdated: new Date().toISOString()
  };
}

export async function askPocky(
  query: string,
  transactions: Transaction[],
  budget: MonthlyBudget,
  lendingEntries: LendingEntry[],
  apiKey?: string,
  modelName?: string
): Promise<string> {
  const expenses = transactions.filter(t => t.type === 'EXPENSE');
  const incomes = transactions.filter(t => t.type === 'INCOME');

  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const remainingBalance = Math.max(0, (budget.totalBudget + totalIncome) - totalSpent);

  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  const dailyBurnRate = currentDay > 0 ? totalSpent / currentDay : 0;

  const categoryTotals: Record<string, number> = {};
  expenses.forEach(t => {
    categoryTotals[t.categoryName] = (categoryTotals[t.categoryName] || 0) + t.amount;
  });

  const recentTx = transactions.slice(0, 10).map(t => ({
    date: t.date,
    type: t.type,
    amount: `₹${t.amount}`,
    category: t.categoryName,
    paymentSource: t.paymentSource,
    note: t.note || ''
  }));

  const pendingLent = lendingEntries.filter(e => e.type === 'LENT' && e.status === 'PENDING');
  const pendingBorrowed = lendingEntries.filter(e => e.type === 'BORROWED' && e.status === 'PENDING');

  const contextData = {
    budget: `₹${budget.totalBudget}`,
    totalIncome: `₹${totalIncome}`,
    totalSpent: `₹${totalSpent}`,
    balance: `₹${remainingBalance}`,
    burnRate: `₹${dailyBurnRate.toFixed(2)}/day`,
    daysLeft: daysRemaining,
    categories: categoryTotals,
    recentLog: recentTx,
    receivables: pendingLent.map(e => `${e.person}:₹${e.amount}(Due ${e.dueDate})`),
    payables: pendingBorrowed.map(e => `${e.person}:₹${e.amount}(Due ${e.dueDate})`)
  };

  const contextJson = JSON.stringify(contextData);
  const activeKey = getActiveApiKey(apiKey);

  if (activeKey) {
    // Pick the best model: user's selection, then canonical fallback chain
    const model = modelName || 'gemini-3.5-flash-lite';
    const prompt = POCKY_USER_QUERY_PROMPT(query, contextJson);

    // Try each candidate model via direct REST API (same pattern as fetchAvailableGeminiModels)
    const candidates = [model, ...FALLBACK_MODEL_CHAIN.filter(m => m !== model)];
    let lastApiError: string | null = null;

    for (const candidateModel of candidates) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${activeKey}`;
      console.log(`[Pocky] Trying model: ${candidateModel}`);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4 }
          })
        });

        const data = await res.json();

        if (!res.ok) {
          const errMsg = data?.error?.message || `HTTP ${res.status}`;
          console.warn(`[Pocky] Model ${candidateModel} error: ${errMsg}`);

          // Stop immediately on auth errors – no point cycling models
          if (res.status === 400 || res.status === 401 || res.status === 403) {
            throw new Error(`API key error (${res.status}): ${errMsg}`);
          }
          // 404 or 429 – try next candidate
          lastApiError = errMsg;
          continue;
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[Pocky] Got response from ${candidateModel}`);
          return text;
        }
        lastApiError = 'Empty response from Gemini API.';
        continue;
      } catch (fetchErr: any) {
        // If it's an auth error rethrow immediately, otherwise try next model
        if (fetchErr.message?.includes('API key error')) throw fetchErr;
        lastApiError = fetchErr?.message || String(fetchErr);
        console.warn(`[Pocky] Fetch error on ${candidateModel}:`, fetchErr);
      }
    }

    // All candidates failed – throw the last error so the UI can show it
    throw new Error(lastApiError || 'All Gemini models failed to respond.');
  }

  const qLower = query.toLowerCase();
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const highestCategory = sortedCategories[0];
  const sortedTxByAmount = [...expenses].sort((a, b) => b.amount - a.amount);
  const highestExpense = sortedTxByAmount[0];

  if (qLower.includes('biggest') || qLower.includes('highest') || qLower.includes('max') || qLower.includes('largest')) {
    if (highestExpense) {
      return `🐾 **Pocky's Insight:**\n\nYour single largest transaction this month was **₹${highestExpense.amount.toLocaleString('en-IN')}** for **${highestExpense.categoryName}** (${highestExpense.note || 'No note'}) on **${highestExpense.date}** via ${highestExpense.paymentSource}.\n\nOverall, your top category is **${highestCategory ? highestCategory[0] : 'N/A'}** with a total spend of **₹${highestCategory ? highestCategory[1].toLocaleString('en-IN') : 0}**.`;
    }
  }

  if (qLower.includes('food') && qLower.includes('transport')) {
    const foodSpend = categoryTotals['Food'] || 0;
    const transportSpend = categoryTotals['Transport'] || 0;
    return `🐾 **Pocky's Category Comparison:**\n\n- 🍕 **Food & Dining:** ₹${foodSpend.toLocaleString('en-IN')}\n- 🚌 **Transport:** ₹${transportSpend.toLocaleString('en-IN')}\n\nYou've spent **₹${(foodSpend - transportSpend).toLocaleString('en-IN')}** ${foodSpend >= transportSpend ? 'more' : 'less'} on Food compared to Transport this month!`;
  }

  if (qLower.includes('run out') || qLower.includes('burn rate') || qLower.includes('depletion') || qLower.includes('at my current')) {
    if (dailyBurnRate > 0) {
      const daysLeft = Math.floor(remainingBalance / dailyBurnRate);
      if (daysLeft < daysRemaining) {
        const runoutDate = new Date();
        runoutDate.setDate(now.getDate() + daysLeft);
        return `🐾 **Pocky's Runway Warning:**\n\nAt your current burn rate of **₹${dailyBurnRate.toFixed(0)} per day**, your remaining **₹${remainingBalance.toLocaleString('en-IN')}** will run out around **${runoutDate.toISOString().split('T')[0]}** (in ~${daysLeft} days).\n\n💡 *Pocky's Recommendation:* Reduce daily discretionary spend to **₹${(remainingBalance / daysRemaining).toFixed(0)}/day** to last until month end.`;
      }
      return `🐾 **Pocky's Runway Check:**\n\nYou're burning **₹${dailyBurnRate.toFixed(0)} per day**, leaving you with **₹${remainingBalance.toLocaleString('en-IN')}** for the next ${daysRemaining} days. You are on track to stay comfortably within your budget!`;
    }
  }

  if (qLower.includes('owe') || qLower.includes('debt') || qLower.includes('lent') || qLower.includes('borrowed')) {
    const lentTotal = pendingLent.reduce((s, e) => s + e.amount, 0);
    const borrowedTotal = pendingBorrowed.reduce((s, e) => s + e.amount, 0);

    let reply = `🐾 **Pocky's Debt Summary:**\n\n`;
    reply += `- 🟢 **Others Owe You (Receivables):** ₹${lentTotal.toLocaleString('en-IN')} across ${pendingLent.length} people.\n`;
    if (pendingLent.length > 0) {
      reply += pendingLent.map(e => `  • ${e.person}: ₹${e.amount} (Due ${e.dueDate})`).join('\n') + '\n';
    }
    reply += `- 🔴 **You Owe Others (Payables):** ₹${borrowedTotal.toLocaleString('en-IN')} across ${pendingBorrowed.length} people.\n`;
    if (pendingBorrowed.length > 0) {
      reply += pendingBorrowed.map(e => `  • ${e.person}: ₹${e.amount} (Due ${e.dueDate})`).join('\n');
    }
    return reply;
  }

  if (qLower.includes('tip') || qLower.includes('save') || qLower.includes('advice') || qLower.includes('recommend')) {
    return `🐾 **Pocky's Smart Savings Tips:**\n\n1. **Target ${highestCategory ? highestCategory[0] : 'Food'}:** You've spent ₹${highestCategory ? highestCategory[1].toLocaleString('en-IN') : 0} here. Setting a 15% cap could save you ~₹${highestCategory ? (highestCategory[1] * 0.15).toFixed(0) : 500}.\n2. **UPI Instant Spend Buffer:** You spent ₹${(categoryTotals['UPI'] || totalSpent * 0.7).toFixed(0)} via UPI. Try keeping a small cash stash for daily micro-transactions to feel the physical outflow.\n3. **Collect Receivables:** You have ₹${pendingLent.reduce((s, e) => s + e.amount, 0)} pending from friends! Follow up with them to boost your available balance instantly.`;
  }

  return `🐾 **Pocky's Spending Analysis:**\n\n- 💰 **Total Income:** ₹${totalIncome.toLocaleString('en-IN')}\n- 💸 **Total Spent:** ₹${totalSpent.toLocaleString('en-IN')} (${((totalSpent / budget.totalBudget) * 100).toFixed(0)}% of ₹${budget.totalBudget.toLocaleString('en-IN')} budget)\n- 💵 **Remaining Balance:** ₹${remainingBalance.toLocaleString('en-IN')}\n- 📊 **Top Spending Category:** ${highestCategory ? `${highestCategory[0]} (₹${highestCategory[1].toLocaleString('en-IN')})` : 'N/A'}\n- ⚡ **Average Daily Burn:** ₹${dailyBurnRate.toFixed(0)}/day\n\nAsk me anything specific like *"How much did I spend on Food?"* or *"Give me saving tips"*!`;
}

export function autoSuggestCategory(note: string, categories: Category[]): string {
  if (!note) return categories[0]?.id || '';
  const lower = note.toLowerCase();

  if (lower.includes('food') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('coffee') || lower.includes('swiggy') || lower.includes('zomato') || lower.includes('restaurant')) {
    return categories.find(c => c.name === 'Food')?.id || categories[0].id;
  }
  if (lower.includes('bus') || lower.includes('cab') || lower.includes('uber') || lower.includes('ola') || lower.includes('metro') || lower.includes('petrol') || lower.includes('fuel')) {
    return categories.find(c => c.name === 'Transport')?.id || categories[0].id;
  }
  if (lower.includes('movie') || lower.includes('netflix') || lower.includes('game') || lower.includes('concert') || lower.includes('cinema')) {
    return categories.find(c => c.name === 'Entertainment')?.id || categories[0].id;
  }
  if (lower.includes('bill') || lower.includes('electricity') || lower.includes('wifi') || lower.includes('recharge') || lower.includes('rent')) {
    return categories.find(c => c.name === 'Bills & Utilities')?.id || categories[0].id;
  }
  if (lower.includes('shoe') || lower.includes('cloth') || lower.includes('amazon') || lower.includes('flipkart') || lower.includes('mall') || lower.includes('shopping')) {
    return categories.find(c => c.name === 'Shopping')?.id || categories[0].id;
  }
  if (lower.includes('book') || lower.includes('course') || lower.includes('exam') || lower.includes('fee') || lower.includes('tuition')) {
    return categories.find(c => c.name === 'Education')?.id || categories[0].id;
  }

  return categories[0]?.id || '';
}
