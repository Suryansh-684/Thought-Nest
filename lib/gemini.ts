import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/* ── Split text into ~200-word chunks ─────────────────────── */
function chunkByWords(text: string, wordsPerChunk = 200): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
}

/* ── Summarise a single chunk ─────────────────────────────── */
async function summariseChunk(
  model: ReturnType<InstanceType<typeof GoogleGenerativeAI>["getGenerativeModel"]>,
  chunk: string,
  chunkIndex: number,
  totalChunks: number
): Promise<string> {
  const prompt =
    totalChunks === 1
      ? `You are a professional blog editor. Summarise the following blog post section in 2-3 sentences. Be concise and capture the key point.\n\nSection:\n${chunk}`
      : `You are a professional blog editor. This is part ${chunkIndex + 1} of ${totalChunks} of a blog post. Summarise this part in 2-3 sentences. Be concise and capture the key point.\n\nPart ${chunkIndex + 1}:\n${chunk}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/* ── Main export ──────────────────────────────────────────── */
export async function generateSummary(body: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const chunks = chunkByWords(body, 200);

  // If the blog is short enough (≤ 200 words), summarise directly
  if (chunks.length === 1) {
    const prompt = `You are a professional blog editor for ThoughtNest, a premium blogging platform. Read the following blog post and write a compelling, engaging summary in exactly 200 words. Write in third person. Capture the key insights and make readers want to read the full post.

Blog post:
${body}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }

  // For longer blogs: summarise each 200-word chunk in parallel, then consolidate
  const chunkSummaries = await Promise.all(
    chunks.map((chunk, i) => summariseChunk(model, chunk, i, chunks.length))
  );

  // Final consolidation — produce one coherent 200-word summary of the whole blog
  const consolidationPrompt = `You are a professional blog editor for ThoughtNest, a premium blogging platform. Below are summaries of each section of a blog post (the blog was split into ${chunks.length} parts of ~200 words each).

Your task: Write ONE compelling, engaging summary of the ENTIRE blog post in exactly 200 words. Write in third person. Capture the key insights across all sections and make readers want to read the full post. Do not mention that this is a summary of summaries — write as if you read the whole post.

Section summaries:
${chunkSummaries.map((s, i) => `Part ${i + 1}: ${s}`).join("\n\n")}`;

  const finalResult = await model.generateContent(consolidationPrompt);
  return finalResult.response.text().trim();
}
