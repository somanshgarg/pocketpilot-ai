/**
 * TOKEN-OPTIMIZED INSIGHTS PROMPT TEMPLATES
 * 
 * Edit this file to customize the prompt instructions for automated dashboard insight reports!
 */

export const INSIGHTS_SYSTEM_PROMPT = `Financial diagnostic tool. Evaluate monthly budget, burn rate, anomalies, and provide short JSON response. Currency: INR (₹).`;

export const INSIGHTS_ANALYSIS_PROMPT = (data: {
  budget: number;
  totalIncome: number;
  totalSpent: number;
  remainingBalance: number;
  currentDay: number;
  daysInMonth: number;
  categoryTotals: Record<string, number>;
  dailyBurnRate: number;
}): string => `
${INSIGHTS_SYSTEM_PROMPT}
Budget:₹${data.budget},Income:₹${data.totalIncome},Spent:₹${data.totalSpent},Balance:₹${data.remainingBalance},Day:${data.currentDay}/${data.daysInMonth},BurnRate:₹${data.dailyBurnRate.toFixed(0)}/day,Categories:${JSON.stringify(data.categoryTotals)}
Respond in JSON: healthScore(0-100), status("HEALTHY"|"WARNING"|"CRITICAL"), summary(1 sentence), insights(2 short strings), savingTips(2 short strings), predictedDepletionDate(YYYY-MM-DD or "Safe"), anomalyDetected(boolean).
`;
