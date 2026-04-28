"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Feather, LayoutDashboard, LogOut,
  Menu, PenLine, User, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/* ── Underline nav link ───────────────────────────────────── */
function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link href={href} onClick={onClick} className="group relative px-1 py-0.5 text-sm font-medium">
      <span className={active ? "text-white" : "text-white/50 transition-colors group-hover:text-white"}>
        {children}
      </span>
      <span
        className={`absolute bottom-0 left-0 h-px bg-violet-400 transition-all duration-300 ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}

/* ── Magnetic Write button ────────────────────────────────── */
function MagneticWriteButton() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  function onMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: (e.clientX - rect.left - rect.width  / 2) * 0.3,
      y: (e.clientY - rect.top  - rect.height / 2) * 0.3,
    });
  }

  return (
    <motion.a
      ref={ref}
      href="/posts/create"
      onMouseMove={onMouseMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-colors hover:bg-violet-500"
    >
      <PenLine className="h-3.5 w-3.5" />
      Write
    </motion.a>
  );
}

/* ── Avatar dropdown ──────────────────────────────────────── */
function AvatarDropdown({
  name, avatarUrl, role, onSignOut,
}: {
  name: string; avatarUrl?: string | null; role: string | null; onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:border-violet-500/40 hover:text-white"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
            {initials}
          </span>
        )}
        <span className="hidden sm:block">{name.split(" ")[0]}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A2E] shadow-2xl shadow-black/60"
            style={{ backdropFilter: "blur(12px)" }}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
          >
            <div className="border-b border-white/8 px-4 py-3">
              <p className="text-xs font-medium text-white/80">{name}</p>
              <p className="mt-0.5 text-xs capitalize text-violet-400">{role ?? "viewer"}</p>
            </div>
            <div className="p-1.5">
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              {role === "admin" && (
                <Link href="/admin" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white">
                  <LayoutDashboard className="h-4 w-4" /> Admin Panel
                </Link>
              )}
              <button onClick={() => { setOpen(false); onSignOut(); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-400/80 transition-colors hover:bg-rose-500/10 hover:text-rose-400">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Navbar ───────────────────────────────────────────────── */
export default function Navbar() {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 50); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close mobile menu on route change */
  const pathname = usePathname();
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const displayName =
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ?? "User";

  const showWrite = role === "author" || role === "admin";
  const showAdmin = role === "admin";

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled || mobileOpen
            ? "border-b border-white/10 bg-black/50 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Feather className="h-5 w-5 text-violet-400" />
            </motion.div>
            <span className="font-heading text-lg font-bold text-white">
              Thought<span className="text-violet-400">Nest</span>
            </span>
            <span className="text-base">🪺</span>
          </Link>

          {/* Desktop center links */}
          <div className="hidden items-center gap-6 md:flex">
            <NavLink href="/">Explore</NavLink>
            {user && <NavLink href="/dashboard">Dashboard</NavLink>}
            {showWrite && <NavLink href="/posts/create">Write Blog</NavLink>}
            {showAdmin && <NavLink href="/admin">Admin</NavLink>}
          </div>

          {/* Desktop right */}
          <div className="hidden items-center gap-3 md:flex">
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded-xl bg-white/5" />
            ) : user ? (
              <>
                {showWrite && <MagneticWriteButton />}
                <AvatarDropdown
                  name={displayName}
                  avatarUrl={user.user_metadata?.avatar_url as string | undefined}
                  role={role}
                  onSignOut={handleSignOut}
                />
              </>
            ) : (
              <>
                <Link href="/auth/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:text-white">
                  Login
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/auth/register"
                    className="rounded-xl border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-semibold text-violet-300 backdrop-blur-sm transition-all hover:border-violet-400 hover:bg-violet-600/30 hover:text-white">
                    Get Started
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-colors hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.div key="close"
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div key="open"
                  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile slide-down menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
              className="overflow-hidden border-t border-white/8 md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-4">
                <MobileLink href="/" onClick={() => setMobileOpen(false)}>Explore</MobileLink>
                {showWrite && (
                  <MobileLink href="/posts/create" onClick={() => setMobileOpen(false)}>
                    ✍️ Write Blog
                  </MobileLink>
                )}
                {showAdmin && (
                  <MobileLink href="/admin" onClick={() => setMobileOpen(false)}>
                    🛡️ Admin Panel
                  </MobileLink>
                )}
                {user && (
                  <MobileLink href="/dashboard" onClick={() => setMobileOpen(false)}>
                    📊 Dashboard
                  </MobileLink>
                )}

                <div className="my-2 h-px bg-white/8" />

                {!loading && (
                  user ? (
                    <>
                      <div className="px-3 py-2">
                        <p className="text-xs text-white/40">Signed in as</p>
                        <p className="text-sm font-medium text-white/80">{displayName}</p>
                        <p className="text-xs capitalize text-violet-400">{role}</p>
                      </div>
                      <button
                        onClick={() => { setMobileOpen(false); handleSignOut(); }}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-rose-400/80 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <MobileLink href="/auth/login" onClick={() => setMobileOpen(false)}>Sign In</MobileLink>
                      <Link href="/auth/register" onClick={() => setMobileOpen(false)}
                        className="mt-1 rounded-xl bg-violet-600 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-violet-500">
                        Get Started
                      </Link>
                    </>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}

function MobileLink({
  href, children, onClick,
}: {
  href: string; children: React.ReactNode; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} onClick={onClick}
      className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-violet-600/20 text-violet-300"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}>
      {children}
    </Link>
  );
}
