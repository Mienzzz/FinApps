import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Debt, Wallet } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function getFinancialAdvice(
  transactions: Transaction[],
  debts: Debt[],
  wallets: Wallet[],
  language: 'en' | 'id' = 'id'
) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Analyze the following financial data and provide advice in ${language === 'id' ? 'Indonesian' : 'English'}.
      
      Transactions (last 30 days): ${JSON.stringify(transactions.slice(0, 50))}
      Debts/Receivables: ${JSON.stringify(debts)}
      Wallets/Balances: ${JSON.stringify(wallets)}
      
      Provide:
      1. A financial health score (0-100).
      2. A short status summary.
      3. 3-5 actionable pieces of advice.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          status: { type: Type.STRING },
          advice: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["score", "status", "advice"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function askFinancialQuestion(
  question: string,
  transactions: Transaction[],
  debts: Debt[],
  wallets: Wallet[],
  language: 'en' | 'id' = 'id'
) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      You are a professional financial advisor. Answer the user's question based on their data.
      User Question: "${question}"
      
      Financial Data:
      Transactions: ${JSON.stringify(transactions.slice(0, 30))}
      Debts: ${JSON.stringify(debts)}
      Wallets: ${JSON.stringify(wallets)}
      
      Answer in ${language === 'id' ? 'Indonesian' : 'English'}. Be concise, helpful, and encouraging.
    `
  });

  return response.text;
}
