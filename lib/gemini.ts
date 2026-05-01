/* ── Direct REST call to Gemini v1 (not v1beta) ────────────
   The @google/generative-ai SDK hardcodes v1beta which is
   missing newer models. We call the v1 REST API directly
   so the model name resolves correctly.
──────────────────────────────────────────────────────────── */

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent";

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned an empty response");
  return text.trim();
}

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
  const chunks = chunkByWords(body, 200);

  /* Short blog — single call */
  if (chunks.length === 1) {
    return callGemini(
      `You are a professional blog editor for ThoughtNest, a premium blogging platform. ` +
        `Read the following blog post and write a compelling, engaging summary in exactly 200 words. ` +
        `Write in third person. Capture the key insights and make readers want to read the full post.\n\n` +
        `Blog post:\n${body}`
    );
  }

  /* Long blog — summarise each chunk in parallel, then consolidate */
  const chunkSummaries = await Promise.all(
    chunks.map((chunk, i) =>
      callGemini(
        `You are a professional blog editor. ` +
          `This is part ${i + 1} of ${chunks.length} of a blog post. ` +
          `Summarise this part in 2-3 sentences. Be concise and capture the key point.\n\n` +
          `Part ${i + 1}:\n${chunk}`
      )
    )
  );

  /* Final consolidation */
  return callGemini(
    `You are a professional blog editor for ThoughtNest, a premium blogging platform. ` +
      `Below are summaries of each section of a blog post ` +
      `(the blog was split into ${chunks.length} parts of ~200 words each).\n\n` +
      `Write ONE compelling, engaging summary of the ENTIRE blog post in exactly 200 words. ` +
      `Write in third person. Capture the key insights across all sections and make readers want to read the full post. ` +
      `Do not mention that this is a summary of summaries.\n\n` +
      `Section summaries:\n` +
      chunkSummaries.map((s, i) => `Part ${i + 1}: ${s}`).join("\n\n")
  );
}
