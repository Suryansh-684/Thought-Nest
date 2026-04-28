# ThoughtNest — Submission Explanation

---

## Area 1 — AI Tools Used

### Tool: Amazon Q Developer

**What it is:** Amazon Q Developer is an AI coding assistant built by AWS, available as a plugin for VS Code and other IDEs. It provides context-aware code generation, inline completions, and a chat interface that understands the full project structure.

**Why I chose it:**

- **Full-stack context awareness** — Unlike generic AI tools, Amazon Q reads the entire workspace and understands how `AuthContext.tsx` connects to `RoleGuard.tsx` connects to `middleware.ts`. It generates code that fits the existing patterns rather than isolated snippets.
- **Next.js + Supabase fluency** — It understands App Router conventions, server vs. client component boundaries, and Supabase's `@supabase/ssr` cookie-based auth pattern out of the box.
- **Framer Motion scaffolding** — Generating animation variants (`initial`, `animate`, `exit`, `whileInView`, `whileTap`) with correct TypeScript types is tedious by hand. Amazon Q produced complete, type-safe animation objects in one pass.
- **Boilerplate reduction without quality loss** — It handled repetitive patterns (RLS policies, loading states, error boundaries) while I focused on architecture and UX decisions.

**Specific contributions:**

| Task | How Amazon Q helped |
|---|---|
| Supabase RLS policies | Generated all 8 policies with correct `auth.uid()` and subquery syntax for admin checks |
| Database trigger | Wrote the `handle_new_user()` PL/pgSQL function with `SECURITY DEFINER` and `COALESCE` for missing name |
| Framer Motion animations | Scaffolded stagger variants, `useAnimationControls` for BookFlipReader flip, magnetic button spring physics |
| Gemini integration | Wrote `lib/gemini.ts` and the API route with proper error handling and status codes |
| TypeScript fixes | Identified that Framer Motion's `ease` prop requires a bezier tuple `[0.22, 1, 0.36, 1]` not a string `"easeOut"` |
| Optimistic comments | Designed the pattern: add optimistic row → real insert → replace with DB row → rollback on error |
| Admin animated counter | Wrote the `requestAnimationFrame` loop with ease-out cubic timing |
| Auth debugging | Diagnosed the RLS insert failure caused by `user?.id` being evaluated before session confirmation |

---

## Area 2 — Feature Logic

### Authentication Flow

```
User fills register form (name, email, password)
        ↓
supabase.auth.signUp({ email, password, options: { data: { name } } })
        ↓
Supabase creates row in auth.users (internal table)
        ↓
PostgreSQL trigger `on_auth_user_created` fires automatically
        ↓
handle_new_user() inserts into public.users:
  { id: NEW.id, email: NEW.email, name: raw_user_meta_data->>'name', role: 'viewer' }
        ↓
AuthContext.tsx detects auth state change via onAuthStateChange()
        ↓
fetchUserRole() queries public.users for role
        ↓
{ user, role } stored in React context, available everywhere
```

The trigger is the critical piece — it eliminates the race condition that would occur if the client tried to manually insert into `users` after `signUp()` returned. The trigger runs synchronously inside the same database transaction.

### Role-Based Access Control (Triple Layer)

**Layer 1 — Next.js Middleware** (`middleware.ts`):
- Runs on the server before the page renders
- Checks `supabase.auth.getUser()` (not `getSession()` — avoids JWT spoofing)
- Redirects unauthenticated users away from `/posts/create` and `/posts/[id]/edit`
- Fetches role from `users` table and redirects non-admins away from `/admin`

**Layer 2 — RoleGuard Component** (`components/RoleGuard.tsx`):
- Client-side React component wrapping protected pages
- Reads `role` from `AuthContext`
- Shows animated "Access Denied" screen with 2-second redirect if role is insufficient
- Used on: Create Post, Edit Post, Admin Dashboard

**Layer 3 — Supabase RLS Policies** (database level):
- Even if someone bypasses the UI entirely and calls the Supabase API directly, the policies block them
- `posts: author insert` — `WITH CHECK (auth.uid() = author_id)` prevents inserting posts for other users
- `posts: admin delete` — subquery checks `role = 'admin'` in the users table
- This layer cannot be bypassed from the client under any circumstances

### Post Creation Flow

```
Author fills form (title, body, cover image)
        ↓
Step 1: If image selected → upload to Supabase Storage 'post-images' bucket
        → get public URL
        ↓
Step 2: POST /api/generate-summary with { body }
        → server calls Gemini 1.5 Flash
        → returns ~200 word editorial summary
        (non-fatal: if Gemini fails, post publishes without summary)
        ↓
Step 3: supabase.from('posts').insert({ title, body, image_url, author_id, summary })
        ↓
Step 4: canvas-confetti burst + "Published!" success state on button
        ↓
Step 5: router.push(`/posts/${newPost.id}`) after 1.2 seconds
```

The submit button cycles through 5 distinct states (`idle` → `uploading` → `summarising` → `inserting` → `success`), each with its own label and visual treatment, giving the author clear feedback at every step.

### AI Summary Flow

```
Client: POST /api/generate-summary
        Body: { body: "full post text..." }
        ↓
Server validates:
  - body exists and is a string → 400 if not
  - body.trim().length >= 50 → 422 if too short
        ↓
lib/gemini.ts: GoogleGenerativeAI('gemini-1.5-flash')
  Prompt: "You are a professional blog editor for ThoughtNest...
           write a compelling summary in exactly 200 words...
           write in third person..."
        ↓
Returns: { summary: "..." }
        ↓
Client stores summary in posts.summary column at insert time
        ↓
Every subsequent post view reads summary from DB — zero API calls
```

---

## Area 3 — Cost Optimization

### The Core Strategy: Generate Once, Store Forever

The most important cost decision in this project is that **Gemini is called exactly once per post — ever**.

| Event | Gemini API called? |
|---|---|
| Post created | ✅ Yes — once |
| Post viewed (1st time) | ❌ No — reads from DB |
| Post viewed (1,000th time) | ❌ No — reads from DB |
| Post edited | ❌ No — summary preserved |
| Post listed on homepage | ❌ No — summary in SELECT |
| Admin views post | ❌ No — reads from DB |

This means a post with 10,000 views costs the same in AI API fees as a post with 1 view: **one Gemini call**.

### Additional Cost Controls

**Model selection — `gemini-1.5-flash` not `gemini-1.5-pro`:**
Flash is approximately 15× cheaper per token than Pro. For a 200-word summary task, Flash produces output that is indistinguishable in quality. Pro would be wasteful.

**Input token minimisation:**
The body is sliced to 6,000 characters before being sent to Gemini (`body.slice(0, 6000)`). Most blog posts are well under this limit, but it prevents runaway costs from extremely long posts. The prompt itself is concise — no few-shot examples, no chain-of-thought padding.

**Non-fatal failure handling:**
If Gemini is unavailable or returns an error, the post publishes without a summary rather than blocking. This means a Gemini outage never prevents authors from publishing, and there's no retry loop that could multiply API calls.

**No re-generation on edit:**
The edit page explicitly does not call `/api/generate-summary`. A comment in the code reads:
```
// Summary preserved from original creation (generated once via Gemini at post creation).
```
This is intentional. The original summary remains valid even if the post body is lightly edited.

**Result:** After the initial creation call, the marginal AI cost per post is **$0.00** regardless of traffic.

---

## Area 4 — Development Understanding

### Bug Encountered: RLS Blocked Author Insert

**Symptom:**
When a logged-in author submitted the create post form, Supabase returned a Row Level Security violation error even though the user was authenticated and the `author_id` matched their `user.id`.

**Root cause:**
The form was using `user?.id` from the `AuthContext` state, which is populated asynchronously. In a specific timing window — particularly on first page load or after a hard refresh — the `user` state in context was `null` for a brief moment while the session was being restored from cookies. The form's submit handler ran before `user` was populated, so `author_id` was being set to `undefined`. The RLS policy `WITH CHECK (auth.uid() = author_id)` correctly rejected this because `auth.uid()` (the real authenticated user) did not equal `undefined`.

**Fix:**
Added a guard at the top of the submit handler:
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!user) return;  // ← this guard was the fix
  ...
}
```

Additionally, the submit button is only rendered when `user` is confirmed, and the `RoleGuard` component ensures the form never renders at all until `loading` is `false` and `role` is confirmed. This creates a natural barrier that prevents the race condition from occurring in practice.

**Lesson:** Never trust client-side state for security-critical values. The RLS policy was working correctly — it was the client code that needed to be more defensive.

---

### Key Architectural Decisions

**App Router over Pages Router**

Next.js App Router enables React Server Components, which means the post detail page can fetch data on the server without exposing Supabase credentials to the client. The server-side Supabase client (`lib/supabase/server.ts`) uses `cookies()` from `next/headers` to read the session, enabling authenticated server-side fetches. This would not be possible with the Pages Router pattern.

**AuthContext over prop drilling**

The user's role needs to be accessible in the Navbar (to show/hide links), in RoleGuard (to gate pages), in PostCard (to show edit button), in CommentSection (to show delete button), and in the admin dashboard. Passing `role` as a prop through all these components would create deeply nested prop chains. A single `AuthContext` with `useAuth()` hook makes the role available anywhere in the tree with one line.

**Supabase Storage over external CDN**

Supabase Storage is included in the free tier and integrates directly with the existing Supabase project. Using an external service like Cloudinary or AWS S3 would require additional accounts, API keys, and billing setup. For a project at this scale, Supabase Storage provides everything needed: public bucket, CDN delivery, and a simple upload API — all within the same client already used for the database.

**Database trigger for user creation**

The alternative to the trigger would be: after `supabase.auth.signUp()` resolves, immediately call `supabase.from('users').insert(...)`. This has two problems:

1. **Race condition** — If the client disconnects between `signUp()` and the manual insert, the `auth.users` row exists but `public.users` does not. The user can log in but the app breaks because their profile row is missing.
2. **RLS complexity** — The insert would need to happen before the session is fully established, requiring special policy handling.

The trigger runs inside the database transaction that creates the `auth.users` row. It is atomic — either both rows are created or neither is. This is the correct solution.

**Summary stored in `posts` table, not a separate table**

A normalised design might put summaries in a `post_summaries` table. However, this would require a JOIN on every post listing query. Since the summary is a 1:1 relationship with the post and is always needed when displaying a post card, storing it directly in the `posts` table means a single `SELECT` query returns everything needed for the homepage grid, the post detail page, and the admin table — with no additional queries.
