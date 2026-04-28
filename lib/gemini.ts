import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateSummary(body: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a professional blog editor for ThoughtNest, a premium blogging platform. Read the following blog post and write a compelling, engaging summary in exactly 200 words. Write in third person. Capture the key insights and make readers want to read the full post.

Blog post:
${body.slice(0, 6000)}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
