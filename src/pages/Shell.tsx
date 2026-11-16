import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, IconButton, Kbd, Sheet, springs, type IconName } from "@/ui";
import { useReducedMotion } from "@/lib/hooks";
import { Boundary, BackLink } from "./common";
import { chapterByN } from "./course";
import SearchPalette from "./Search";
import Home from "./Home";
import ChapterPage from "./ChapterPage";
import LabsPage from "./LabsPage";
import LabPage from "./LabPage";
import GlossaryPage from "./GlossaryPage";
import CoursePage from "./CoursePage";
import TodayPage from "./TodayPage";
import GymPage from "./GymPage";
import TrackerPage from "./TrackerPage";
import "./pages.css";

/* The lesson player is written by another agent. import.meta.glob resolves to {} until the file exists,
   so the shell never breaks the build; Vite picks the file up as soon as it is created. */
type AnyComp = ComponentType<Record<string, unknown>>;
const lessonMods = import.meta.glob("./LessonPage.tsx") as Record<string, () => Promise<{ default: AnyComp }>>;
const LessonLoader = lessonMods["./LessonPage.tsx"];
const LessonPage = LessonLoader ? lazy(LessonLoader) : null;

/* ---------------- Theme ---------------- */
const THEME_KEY = "cp30:theme";
function systemDark() { try { return matchMedia("(prefers-color-scheme: dark)").matches; } catch { return false; } }
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const t = document.documentElement.dataset.theme;
    return t === "dark" || t === "light" ? t : systemDark() ? "dark" : "light";
  });
  useEffect(() => {
    const m = matchMedia("(prefers-color-scheme: dark)");
    const f = () => { if (!document.documentElement.dataset.theme) setTheme(m.matches ? "dark" : "light"); };
    m.addEventListener("change", f);
    // Probes may set data-theme directly; follow it.
    const mo = new MutationObserver(() => { const t = document.documentElement.dataset.theme; if (t === "dark" || t === "light") setTheme(t); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { m.removeEventListener("change", f); mo.disconnect(); };
  }, []);
  const toggle = useCallback(() => {
    setTheme((cur) => {
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch { /* storage blocked */ }
      return next;
    });
  }, []);
  return { theme, toggle };
}

/* ---------------- Routes ---------------- */
type Route =
  | { name: "home" } | { name: "course" } | { name: "labs" } | { name: "glossary" } | { name: "today"; day?: number } | { name: "gym" } | { name: "tracker"; tab?: string }
  | { name: "chapter"; n: number } | { name: "lesson"; n: number; l: number } | { name: "lab"; id: string } | { name: "missing"; hash: string };
function parse(hash: string): Route {
  const h = hash.trim();
  if (h === "" || h === "home") return { name: "home" };
  if (h === "course") return { name: "course" };
  if (h === "labs") return { name: "labs" };
  if (h === "glossary") return { name: "glossary" };
  if (h === "today") return { name: "today" };
  const td = h.match(/^today-(\d+)$/); if (td) return { name: "today", day: Number(td[1]) };
  if (h === "gym") return { name: "gym" };
  if (h === "tracker") return { name: "tracker" };
  const tr = h.match(/^tracker-([a-z]+)$/); if (tr) return { name: "tracker", tab: tr[1] };
  let m = h.match(/^ch(\d+)$/); if (m) return { name: "chapter", n: Number(m[1]) };
  m = h.match(/^ch(\d+)-(\d+)$/); if (m) return { name: "lesson", n: Number(m[1]), l: Number(m[2]) };
  m = h.match(/^lab-([a-z0-9-]+)$/); if (m) return { name: "lab", id: m[1] };
  return { name: "missing", hash: h };
}
const NAV: { key: string; label: string; href: string; icon: IconName; tab: boolean }[] = [
  { key: "home", label: "Home", href: "#home", icon: "home", tab: true },
  { key: "today", label: "Today", href: "#today", icon: "calendar", tab: true },
  { key: "course", label: "Course", href: "#course", icon: "route", tab: true },
  { key: "gym", label: "Gym", href: "#gym", icon: "timer", tab: true },
  { key: "tracker", label: "Tracker", href: "#tracker", icon: "chart", tab: false },
  { key: "labs", label: "Labs", href: "#labs", icon: "flask", tab: false },
  { key: "glossary", label: "Glossary", href: "#glossary", icon: "book", tab: false },
];
const MORE = NAV.filter((n) => !n.tab);
function navKey(r: Route) {
  if (r.name === "chapter" || r.name === "course") return "course";
  if (r.name === "lab" || r.name === "labs") return "labs";
  return r.name;
}

export default function Shell({ hash }: { hash: string }) {
  const route = useMemo(() => parse(hash), [hash]);
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => { window.scrollTo(0, 0); setSearchOpen(false); setMoreOpen(false); }, [hash]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f(); addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);
  useEffect(() => {
    const t: Record<string, string> = { home: "CP 30", course: "Course", labs: "Labs", glossary: "Glossary", today: "Today", gym: "Recognition gym", tracker: "Tracker" };
    const name = route.name === "chapter" ? chapterByN(route.n)?.short : route.name === "lab" ? "Lab" : t[route.name];
    document.title = name && name !== "CP 30" ? `${name} · CP 30` : "CP 30";
  }, [route]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((o) => !o); }
      else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); setSearchOpen(true); }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  // The lesson player owns the whole screen (its own top bar and bottom bar).
  if (route.name === "lesson") {
    return (
      <>
        <Boundary resetKey={hash} fallback={() => <LessonFallback n={route.n} l={route.l} failed />}>
          {LessonPage
            ? <Suspense fallback={<div className="pg-loading" aria-busy="true" />}><LessonPage hash={hash} chapter={route.n} lesson={route.l} /></Suspense>
            : <LessonFallback n={route.n} l={route.l} />}
        </Boundary>
        <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      </>
    );
  }

  const active = navKey(route);
  let page;
  switch (route.name) {
    case "home": page = <Home />; break;
    case "course": page = <CoursePage />; break;
    case "labs": page = <LabsPage />; break;
    case "glossary": page = <GlossaryPage />; break;
    case "today": page = <TodayPage day={route.day} />; break;
    case "gym": page = <GymPage />; break;
    case "tracker": page = <TrackerPage tab={route.tab} />; break;
    case "chapter": page = <ChapterPage n={route.n} />; break;
    case "lab": page = <LabPage id={route.id} />; break;
    default: page = <NotFound />;
  }

  return (
    <div className="shell">
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>Skip to content</a>
      <header className={`topbar${scrolled ? " scrolled" : ""}`}>
        <div className="topbar-in">
          <a href="#home" className="brand" aria-label="CP 30, home">
            <Logo />
            <span className="brand-name">CP 30</span>
          </a>
          <nav className="topnav" aria-label="Main">
            {NAV.map((n) => <a key={n.key} href={n.href} aria-current={active === n.key ? "page" : undefined}>{n.label}</a>)}
          </nav>
          <div className="topbar-actions">
            <button type="button" className="searchbtn" onClick={() => setSearchOpen(true)} aria-label="Search the course" aria-keyshortcuts="/ Meta+K">
              <Icon name="search" size={17} stroke={2} /><span className="searchbtn-text">Search</span><Kbd>/</Kbd>
            </button>
            <IconButton label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={toggle}>
              <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
            </IconButton>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={hash || "home"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: reduce ? { duration: 0.15 } : { ...springs.smooth, opacity: { duration: 0.2 } } }}
            exit={{ opacity: 0, transition: { duration: reduce ? 0.1 : 0.12 } }}>
            <Boundary resetKey={hash} fallback={(e) => <PageError message={e.message} />}>{page}</Boundary>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="foot">
        <span>CP 30</span>
        <span className="foot-sep" aria-hidden="true">·</span>
        <span>Competitive programming in Python, in 30 days</span>
      </footer>

      <nav className="tabbar" aria-label="Main">
        {NAV.filter((n) => n.tab).map((n) => (
          <a key={n.key} href={n.href} aria-current={active === n.key ? "page" : undefined}>
            <Icon name={n.icon} size={22} stroke={1.75} /><span>{n.label}</span>
          </a>
        ))}
        <button type="button" className={MORE.some((n) => n.key === active) ? "on" : ""} aria-haspopup="dialog" aria-expanded={moreOpen} onClick={() => setMoreOpen(true)}>
          <Icon name="more" size={22} stroke={1.75} /><span>{MORE.find((n) => n.key === active)?.label ?? "More"}</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onClose={closeMore} label="More pages" width={420}>
        <div className="more">
          <div className="more-head"><span>More</span><button type="button" className="pal-close" onClick={closeMore}>Close</button></div>
          {MORE.map((n) => (
            <a key={n.key} href={n.href} className="more-item" aria-current={active === n.key ? "page" : undefined} onClick={closeMore}>
              <span className="more-ico"><Icon name={n.icon} size={20} /></span>
              <span className="more-t">{n.label}<small>{MORE_SUB[n.key]}</small></span>
              <Icon name="chevron-right" size={18} stroke={2} />
            </a>
          ))}
          <button type="button" className="more-item" onClick={toggle}>
            <span className="more-ico"><Icon name={theme === "dark" ? "sun" : "moon"} size={20} /></span>
            <span className="more-t">{theme === "dark" ? "Light mode" : "Dark mode"}<small>Change how the site looks</small></span>
          </button>
        </div>
      </Sheet>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

const MORE_SUB: Record<string, string> = { tracker: "Progress table, daily log, mistakes, re-solves", labs: "Step-by-step algorithm players", glossary: "Every term in plain words" };

/** Logo: a 30-day ring, three quarters done, around a code prompt. */
function Logo() {
  return (
    <svg className="logo" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect width="28" height="28" rx="8" className="logo-bg" />
      <circle cx="14" cy="14" r="8.5" className="logo-track" />
      <path d="M14 5.5a8.5 8.5 0 1 1 -8.5 8.5" className="logo-arc" />
      <path d="M11.5 10.8l3.4 3.2-3.4 3.2" className="logo-mark" />
    </svg>
  );
}

function LessonFallback({ n, l, failed }: { n: number; l: number; failed?: boolean }) {
  const ch = chapterByN(n);
  const lesson = ch?.lessons[l - 1];
  return (
    <div className="fallback-screen">
      <div className="fallback-card">
        <BackLink href={`#ch${n}`}>{ch?.short ?? "Course"}</BackLink>
        <div className="pg-eyebrow" style={{ marginTop: 20 }}>Chapter {n} · Lesson {l}</div>
        <h1 className="fallback-title">{lesson?.title ?? "This lesson"}</h1>
        <p className="fallback-text">
          {failed ? "This lesson could not open. The content may still be in progress. Please try again in a moment." : "The lesson player is not ready yet. Please come back in a moment."}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a className="ui-btn ui-btn-primary ui-btn-m" href={`#ch${n}`}>Back to the chapter</a>
          <a className="ui-btn ui-btn-secondary ui-btn-m" href="#home">Home</a>
        </div>
      </div>
    </div>
  );
}

function PageError({ message }: { message: string }) {
  return (
    <div className="page narrow">
      <div className="ui-empty"><strong>This page could not be shown</strong>Part of the content is still being written. Please try again in a moment.<div className="pg-errmsg">{message}</div></div>
      <div style={{ textAlign: "center" }}><a className="ui-btn ui-btn-secondary ui-btn-m" href="#home">Go home</a></div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page narrow">
      <div className="ui-empty"><strong>Page not found</strong>This address does not match a page in the course.</div>
      <div style={{ textAlign: "center" }}><a className="ui-btn ui-btn-primary ui-btn-m" href="#home">Go home</a></div>
    </div>
  );
}
