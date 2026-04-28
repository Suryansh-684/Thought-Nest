import { NextRequest, NextResponse } from "next/server";
import { generateSummary } from "@/lib/gemini";

/**
 * POST /api/generate-summary
 *
 * COST OPTIMIZATION NOTE:
 * Summary is generated ONLY ONCE at post creation time and stored directly
 * in the posts.summary column. It is never called again for the same post.
 * This means each post costs exactly one Gemini API call — ever.
 * Do NOT call this endpoint on post reads, edits, or any other lifecycle event.
 */
export async function POST(request: NextRequest) {
  let body: string;

  try {
    const json = await request.json();
    body = json?.body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "string") {
    return NextResponse.json(
      { error: "Field 'body' is required and must be a string" },
      { status: 400 }
    );
  }

  if (body.trim().length < 50) {
    return NextResponse.json(
      { error: "Post body must be at least 50 characters to generate a summary" },
      { status: 422 }
    );
  }

  try {
    const summary = await generateSummary(body);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[generate-summary] Gemini error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 502 }
    );
  }
}
