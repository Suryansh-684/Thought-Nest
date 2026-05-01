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

/* ── Main export ──────────────────────────────────────────── */
export async function generateSummary(body: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  const chunks = chunkByWords(body, 200);

  /* Short blog — single call */
  if (chunks.length === 1) {
    const result = await model.generateContent(
      `You are a professional blog editor for ThoughtNest, a premium blogging platform. ` +
        `Read the following blog post and write a compelling, engaging summary in exactly 200 words. ` +
        `Write in third person. Capture the key insights and make readers want to read the full post.\n\n` +
        `Blog post:\n${body}`
    );
    return result.response.text().trim();
  }

  /* Long blog — summarise each 200-word chunk in parallel, then consolidate */
  const chunkSummaries = await Promise.all(
    chunks.map(async (chunk, i) => {
      const r = await model.generateContent(
        `You are a professional blog editor. ` +
          `This is part ${i + 1} of ${chunks.length} of a blog post. ` +
          `Summarise this part in 2-3 sentences. Be concise and capture the key point.\n\n` +
          `Part ${i + 1}:\n${chunk}`
      );
      return r.response.text().trim();
    })
  );

  /* Final consolidation */
  const result = await model.generateContent(
    `You are a professional blog editor for ThoughtNest, a premium blogging platform. ` +
      `Below are summaries of each section of a blog post ` +
      `(the blog was split into ${chunks.length} parts of ~200 words each).\n\n` +
      `Write ONE compelling, engaging summary of the ENTIRE blog post in exactly 200 words. ` +
      `Write in third person. Capture the key insights across all sections and make readers want to read the full post. ` +
      `Do not mention that this is a summary of summaries.\n\n` +
      `Section summaries:\n` +
      chunkSummaries.map((s, i) => `Part ${i + 1}: ${s}`).join("\n\n")
  );

  return result.response.text().trim();
}
