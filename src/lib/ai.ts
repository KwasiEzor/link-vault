import OpenAI from "openai";
import { getSetting } from "@/lib/settings";

let openaiInstance: OpenAI | null = null;
let lastUsedApiKey: string | null = null;
let lastUsedBaseUrl: string | null = null;

async function getOpenAI() {
  const apiKey = await getSetting("AI_API_KEY");
  const baseURL = await getSetting("AI_BASE_URL", "https://api.openai.com/v1");

  if (!apiKey) return null;

  if (openaiInstance && lastUsedApiKey === apiKey && lastUsedBaseUrl === baseURL) {
    return openaiInstance;
  }
  
  openaiInstance = new OpenAI({
    apiKey,
    baseURL,
  });
  
  lastUsedApiKey = apiKey;
  lastUsedBaseUrl = baseURL;
  
  return openaiInstance;
}

export type AIEnrichmentResult = {
  category: string;
  summary: string;
};

export async function enrichMetadata(title: string, description: string | null, url: string): Promise<AIEnrichmentResult | null> {
  const aiEnabled = await getSetting("AI_ENABLED", true);
  if (!aiEnabled) {
    console.log("AI Enrichment is disabled in settings.");
    return null;
  }

  const openai = await getOpenAI();
  if (!openai) {
    console.warn("AI_API_KEY is not set. Skipping AI enrichment.");
    return null;
  }

  const model = await getSetting("AI_MODEL", "gpt-3.5-turbo");

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
      model: model,
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

export type LinkInsightsResult = {
  summary: string;
  keyTakeaways: string[];
  topics: string[];
  entities: string[];
  suggestedTags: string[];
};

export async function generateLinkInsights(input: {
  url: string;
  title: string;
  description: string | null;
}): Promise<LinkInsightsResult | null> {
  const aiEnabled = await getSetting("AI_ENABLED", true);
  if (!aiEnabled) return null;

  const openai = await getOpenAI();
  if (!openai) return null;

  const model = await getSetting("AI_MODEL", "gpt-3.5-turbo");

  const prompt = `
You are a world-class product researcher and digital curator.
Create concise, practical insights for a saved web resource.

URL: ${input.url}
Title: ${input.title}
Description: ${input.description || "None"}

Return ONLY JSON in this exact shape:
{
  "summary": "1-2 sentences, max 40 words total",
  "keyTakeaways": ["3-6 bullets, short and specific"],
  "topics": ["3-8 high-level topics"],
  "entities": ["0-8 notable entities/brands/tools/people mentioned or implied"],
  "suggestedTags": ["5-12 short tags, lowercase, no #"]
}
`;

  try {
    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You produce crisp, structured insights for curated links." },
        { role: "user", content: prompt },
      ],
      model,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as LinkInsightsResult;
  } catch (error) {
    console.error("AI insights failed:", error);
    return null;
  }
}
