# ThoughtNest 🪺

> **Where Ideas Take Flight** — A dark luxury editorial blogging platform powered by AI, built with Next.js 16, Supabase, and Gemini.

ThoughtNest is a full-stack blogging platform where authors craft stories, readers discover them, and AI quietly summarises every post at creation time — with zero ongoing API cost per view.

---

## ✨ Features

- 🔐 **Authentication** — Email/password sign-up & login via Supabase Auth
- 👥 **Role-based access** — Three roles: `viewer`, `author`, `admin` with triple-layer protection (middleware + RoleGuard + RLS)
- ✍️ **Rich post creation** — Drag-and-drop cover image upload, auto-resizing textarea, word/character counter
- 🤖 **AI-powered summaries** — Gemini 1.5 Flash generates a 200-word editorial summary at post creation, stored permanently in the database
- 📖 **BookFlip reader** — Immersive open-book reading experience with page-flip animations and mobile swipe support
- 💬 **Comments** — Optimistic UI updates, relative timestamps, author/admin delete controls
- 🛡️ **Admin dashboard** — Animated counters, user role management, post & comment moderation across three tabbed tables
- 🎨 **Dark luxury UI** — Glassmorphism cards, floating orb backgrounds, Framer Motion throughout
- 📱 **Fully responsive** — Mobile hamburger nav, single-page reader on mobile, horizontal-scroll tables
- 🎉 **Confetti on publish** — canvas-confetti burst when a post goes live
- 🔔 **Toast notifications** — Success, error, and info toasts with auto-dismiss
- ⚡ **Loading skeletons** — Shimmer skeleton cards for every data-fetching state
- 📊 **Reading progress bar** — Fixed 3px violet gradient bar tracking scroll position

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS v4 | ^4 |
| Animation | Framer Motion | ^12 |
| Database | Supabase (PostgreSQL) | ^2.105 |
| Auth | Supabase Auth | built-in |
| Storage | Supabase Storage | built-in |
| AI | Google Gemini 1.5 Flash | ^0.24 |
| Icons | Lucide React | ^1.11 |
| Confetti | canvas-confetti | ^1.9 |
| Fonts | Inter + Playfair Display | Google Fonts |
| Deployment | Vercel | — |

---

## 📁 Project Structure

```
thoughtnest/
├── app/
│   ├── admin/
│   │   ├── loading.tsx          # Admin skeleton
│   │   └── page.tsx             # Admin dashboard
│   ├── api/
│   │   └── generate-summary/
│   │       └── route.ts         # POST /api/generate-summary
│   ├── auth/
│   │   ├── login/page.tsx       # Login page
│   │   └── register/page.tsx    # Register page
│   ├── posts/
│   │   ├── [id]/
│   │   │   ├── edit/page.tsx    # Edit post
│   │   │   ├── loading.tsx      # Post skeleton
│   │   │   └── page.tsx         # Post detail
│   │   └── create/page.tsx      # Create post
│   ├── globals.css              # Global styles + CSS variables
│   ├── layout.tsx               # Root layout + metadata
│   ├── loading.tsx              # Global skeleton
│   ├── not-found.tsx            # 404 page
│   └── page.tsx                 # Homepage
├── components/
│   ├── AnimatedBackground.tsx   # Floating orb backgrounds
│   ├── BookFlipReader.tsx       # Open-book page reader
│   ├── ClientLayout.tsx         # Auth + Toast providers + page transitions
│   ├── CommentSection.tsx       # Comments with optimistic updates
│   ├── Navbar.tsx               # Responsive nav with mobile menu
│   ├── Pagination.tsx           # Smart page navigation
│   ├── PostCard.tsx             # 3D-tilt post preview card
│   ├── RoleGuard.tsx            # Client-side role protection
│   ├── SearchBar.tsx            # Debounced search input
│   ├── SkeletonCard.tsx         # Shimmer loading card
│   ├── Spinner.tsx              # Shared loading spinner
│   └── Toast.tsx                # Toast notification system
├── context/
│   └── AuthContext.tsx          # User + role state
├── hooks/
│   └── useAuth.ts               # Re-export of useAuth
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   └── server.ts            # Server Supabase client
│   └── gemini.ts                # Gemini AI client
├── middleware.ts                 # Route protection + admin guard
├── supabase/
│   └── schema.sql               # Full DB schema to run in Supabase
└── .env.example                 # Environment variable template
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini

### 1. Clone the repository

```bash
git clone https://github.com/your-username/thoughtnest.git
cd thoughtnest
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

**a. Create a new Supabase project** at [supabase.com/dashboard](https://supabase.com/dashboard)

**b. Run the schema** — Go to **SQL Editor** in your Supabase dashboard and paste the entire contents of `supabase/schema.sql`, then click **Run**.

This creates:
- `users`, `posts`, `comments` tables
- Row Level Security policies on all three tables
- An auto-insert trigger that creates a `users` row on every new sign-up

**c. Create the storage bucket** — Go to **Storage → New Bucket**:
- Name: `post-images`
- Toggle **Public bucket** → ON
- Click **Create bucket**

Then run this in the SQL Editor:
```sql
CREATE POLICY "post-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');
```

**d. Get your credentials** — Go to **Settings → API** and copy:
- Project URL
- `anon` public key

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Create your first admin user

1. Register an account through the UI
2. Go to **Supabase → Table Editor → users**
3. Find your row and change `role` from `viewer` to `admin`
4. Refresh the app — the Admin link will appear in the navbar

---

## 🌐 Deployment to Vercel

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your GitHub repository
3. Framework preset will auto-detect as **Next.js**
4. Click **Deploy** (it will fail — that's expected, env vars are missing)

### Step 3 — Add environment variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `GEMINI_API_KEY` | Your Google Gemini API key |

### Step 4 — Redeploy

Go to **Deployments → ⋯ → Redeploy**. Your site will be live at `your-project.vercel.app`.

### Step 5 — Update Supabase allowed URLs

In Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://your-project.vercel.app`
- **Redirect URLs**: `https://your-project.vercel.app/**`

---

## 🤖 AI Tool Used

This project was built with the assistance of **Amazon Q Developer** (AWS's AI coding assistant, available as an IDE plugin).

**What it helped with:**

- Generating complete Supabase RLS policies with correct `auth.uid()` syntax
- Scaffolding all Framer Motion animation variants (`initial`, `animate`, `exit`, `whileHover`, `whileTap`, `whileInView`) across every component
- Writing the Gemini API integration in `lib/gemini.ts` and the API route
- Debugging the TypeScript type errors from Framer Motion's strict `Easing` type (required bezier tuple instead of string)
- Designing the BookFlipReader's `rotateY` flip animation with `useAnimationControls`
- Structuring the optimistic comment update pattern
- Writing the `requestAnimationFrame`-based animated counter in the admin dashboard
- Generating the complete database trigger function with `SECURITY DEFINER`

---

## 📊 Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | References `auth.users`, primary key |
| `name` | `text` | Not null |
| `email` | `text` | Not null |
| `role` | `text` | Default `'viewer'` — `viewer` \| `author` \| `admin` |
| `avatar_url` | `text` | Nullable |
| `created_at` | `timestamp` | Default `now()` |

### `posts`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `gen_random_uuid()` |
| `title` | `text` | Not null |
| `body` | `text` | Not null |
| `image_url` | `text` | Nullable — Supabase Storage public URL |
| `author_id` | `uuid` | References `users(id)` on delete cascade |
| `summary` | `text` | Nullable — AI-generated once at creation |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `comments`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `gen_random_uuid()` |
| `post_id` | `uuid` | References `posts(id)` on delete cascade |
| `user_id` | `uuid` | References `users(id)` on delete cascade |
| `comment_text` | `text` | Not null |
| `created_at` | `timestamp` | Default `now()` |

---

## 🔐 Role Permissions Table

| Action | Viewer | Author | Admin |
|---|:---:|:---:|:---:|
| Read posts | ✅ | ✅ | ✅ |
| Read comments | ✅ | ✅ | ✅ |
| Create post | ❌ | ✅ | ✅ |
| Edit own post | ❌ | ✅ | ✅ |
| Edit any post | ❌ | ❌ | ✅ |
| Delete any post | ❌ | ❌ | ✅ |
| Post comment | ✅ (auth) | ✅ | ✅ |
| Delete own comment | ✅ | ✅ | ✅ |
| Delete any comment | ❌ | ❌ | ✅ |
| Access admin dashboard | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |

> Protection is enforced at three independent layers: Next.js middleware (server), RoleGuard component (client), and Supabase RLS policies (database).

---

## 📝 License

MIT — free to use, modify, and distribute.

---

<div align="center">
  <p>Built with ❤️ and a lot of ☕</p>
  <p><strong>ThoughtNest 🪺 — Where Ideas Take Flight</strong></p>
</div>
