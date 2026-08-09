/**
 * TOKEN-OPTIMIZED POCKY AI PROMPT TEMPLATES
 * 
 * Edit this file to customize Pocky's personality, system instructions,
 * tone of voice, financial analysis rules, or answer format!
 */

export const POCKY_SYSTEM_PROMPT = `You are Pocky, a concise financial assistant for PocketPilot AI in India. Format currency in INR (₹). Be direct, brief, and factual. Use bullet points and bold numbers.`;

export const POCKY_USER_QUERY_PROMPT = (query: string, financialContextJson: string): string => `
${POCKY_SYSTEM_PROMPT}

DATA:
${financialContextJson}

QUESTION: "${query}"
`;

export const DEFAULT_SUGGESTED_QUESTIONS = [
  "What was my biggest expense this month?",
  "How much have I spent on Food vs Transport?",
  "At my current burn rate, when will my budget run out?",
  "What is my overall income vs total expense split?",
  "Who owes me money and how much can I collect?",
  "Give me 3 practical tips to save ₹3,000 before month end."
];
