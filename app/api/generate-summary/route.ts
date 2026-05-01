import { NextRequest, NextResponse } from "next/server";
import { generateSummary } from "@/lib/gemini";

/**
 * POST /api/generate-summary
 *
 * Accepts { body: string } and returns { summary: string }.
 *
 * The blog body is split into 200-word chunks internally.
 * Each chunk is summarised, then all chunk summaries are consolidated
 * into one final 200-word summary covering the whole blog.
 *
 * COST NOTE: Called once per post (at creation or on-demand from the post page).
 * The result is stored in posts.summary and never regenerated automatically.
 */
export async function POST(request: NextRequest) {
  // Guard: GEMINI_API_KEY must be set
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured. Add it to your Vercel environment variables." },
      { status: 503 }
    );
  }

  let body: string;
  try {
    const json = await request.json();
    body = json?.body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "string" || body.trim().length === 0) {
    return NextResponse.json(
      { error: "Field 'body' is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  try {
    const summary = await generateSummary(body);
    return NextResponse.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-summary] Gemini error:", message);

    // Surface a clear error — 502 means upstream (Gemini) failed
    return NextResponse.json(
      { error: `Gemini API error: ${message}` },
      { status: 502 }
    );
  }
}
