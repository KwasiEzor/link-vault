import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

function getOpenAI() {
  if (openaiInstance) return openaiInstance;
  
  const apiKey = process.env.AI_API_KEY;
  const baseURL = process.env.AI_BASE_URL || "https://api.openai.com/v1";

  if (!apiKey) return null;

  openaiInstance = new OpenAI({
    apiKey,
    baseURL,
  });
  
  return openaiInstance;
}

export type AIEnrichmentResult = {
  category: string;
  summary: string;
};

export async function enrichMetadata(title: string, description: string | null, url: string): Promise<AIEnrichmentResult | null> {
  const openai = getOpenAI();
  if (!openai) {
    console.warn("AI_API_KEY is not set. Skipping AI enrichment.");
    return null;
  }

  const prompt = `
    You are an expert digital librarian and content curator for "LinkVault", a premium visual bookmarking platform.
    Analyze the following website metadata and provide a professional categorization and a concise summary.

    URL: ${url}
    Title: ${title}
    Original Description: ${description || "None provided"}

    ### Requirements:
    1. Category: One or two words (e.g., "Design Tools", "AI Research", "Dev Framework", "Productivity").
    2. Summary: One single, impactful sentence (max 25 words) that explains the core value of the resource. Use active, professional language.

    Respond ONLY in the following JSON format:
    {
      "category": "category name",
      "summary": "Impactful summary sentence"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You are a professional content curator." }, { role: "user", content: prompt }],
      model: process.env.AI_MODEL || "gpt-3.5-turbo", // or "llama3-70b-8192" for Groq
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as AIEnrichmentResult;
  } catch (error) {
    console.error("AI Enrichment failed:", error);
    return null;
  }
}
