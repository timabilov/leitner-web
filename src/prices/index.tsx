import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { initializePaddle } from "@paddle/paddle-js";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { PRICING_TIERS, PRICING_TIERS_CLAIM } from "./assets/pricing-data";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";
import { useSearchParams } from "react-router-dom";
import { usePostHog } from "posthog-js/react";
import { getLastTouch, getFirstTouch } from "@/lib/attribution";
import SettingsDialog from "@/settings/settings-dialog2";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import LiveActivityFeed2 from "./live-activity-feed2";

/* ================================================================
   Types & Constants
   ================================================================ */
type HeroWidget = "quiz" | "scratch" | "exam-math" | "explainer";

const SCRATCH_SESSION_KEY = "bycat-scratch-state";
const HERO_SESSION_KEY = "bycat-hero-pick";
const SCRATCH_TTL = 15 * 60 * 1000; // 15 minutes

const FAQ_DATA = [
  { q: "Can I cancel anytime?", a: "Yes. Cancel anytime from your account settings with no questions asked. Weekly and monthly plans auto-renew but never lock you in." },
  { q: "What happens after the 3-day free trial?", a: "You'll be billed the annual rate only after your trial ends. We'll send you a reminder 24 hours before — you can cancel before then at no charge." },
  { q: "Is the Weekly plan really free?", a: "Yes — the weekly plan is free during our launch promotion. It includes all core features so you can try Bycat before committing." },
  { q: "How does Live AI Tutoring work?", a: "Our AI Tutoring uses advanced language models trained on your specific curriculum to provide step-by-step guidance, hints, and explanations in real-time." },
  { q: "Is my data safe?", a: "Absolutely. All data is encrypted at rest and in transit with AES-256 and TLS 1.3. We never sell your data to third parties." },
];

const fetchSubscription = async () => {
  const res = await axiosInstance.get(`${API_BASE_URL}/subscription/get`);
  return res.data;
};

/* ================================================================
   Hero Widget Selection (session-based, testable via ?hero=X)
   ================================================================ */
function pickHeroWidget(forcedHero: string | null): HeroWidget {
  const allWidgets: HeroWidget[] = ["quiz", "scratch", "exam-math", "explainer"];

  // URL param override for prod testing (e.g. ?hero=scratch)
  if (forcedHero && allWidgets.includes(forcedHero as HeroWidget)) {
    return forcedHero as HeroWidget;
  }

  // Scratch is off for now — random pick from the other 3, never repeat last shown
  const pool: HeroWidget[] = ["quiz", "exam-math", "explainer"];
  const last = sessionStorage.getItem(HERO_SESSION_KEY);
  const candidates = last ? pool.filter((w) => w !== last) : pool;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  sessionStorage.setItem(HERO_SESSION_KEY, picked);
  return picked;
}

/* ================================================================
   Confetti burst (shared by quiz + scratch)
   ================================================================ */
const ConfettiBurst = () => (
  <div className="absolute left-1/2 top-2 pointer-events-none">
    <span className="absolute rounded-sm" style={{ "--cx": "-34px", width: 6, height: 9, background: "var(--v2-accent)", animation: "v2-confetti .9s .05s ease-out both" } as React.CSSProperties} />
    <span className="absolute rounded-sm" style={{ "--cx": "26px", width: 6, height: 9, background: "#EFB100", animation: "v2-confetti .9s ease-out both" } as React.CSSProperties} />
    <span className="absolute rounded-sm" style={{ "--cx": "-14px", width: 5, height: 8, background: "var(--v2-ok)", animation: "v2-confetti .9s .12s ease-out both" } as React.CSSProperties} />
    <span className="absolute rounded-sm" style={{ "--cx": "44px", width: 5, height: 8, background: "var(--v2-accent2)", animation: "v2-confetti .9s .08s ease-out both" } as React.CSSProperties} />
    <span className="absolute rounded-full" style={{ "--cx": "8px", width: 6, height: 6, background: "var(--v2-bad)", animation: "v2-confetti .9s .16s ease-out both" } as React.CSSProperties} />
  </div>
);

/* ================================================================
   Widget badge (top row icon + label)
   ================================================================ */
const WidgetBadge = ({ label, hint }: { label: string; hint: string }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <span className="w-8 h-8 shrink-0 rounded-[9px] bg-[var(--v2-ink)] text-[var(--v2-bg)] grid place-items-center">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.4 6.1 6.1 2.4-6.1 2.4L12 19.5 9.6 13.4 3.5 11l6.1-2.4z" /></svg>
    </span>
    <span className="text-xs font-bold tracking-[.06em] text-[var(--v2-mut)]">{label}</span>
    <span className="ml-auto text-[11px] font-bold text-[var(--v2-mut)] border border-[var(--v2-line)] rounded-full px-2.5 py-0.5">{hint}</span>
  </div>
);

/* ================================================================
   HERO: Quiz Widget
   ================================================================ */
function HeroQuiz() {
  const [pick, setPick] = useState<number | null>(null);
  const isCorrect = pick === 70;

  return (
    <div
      className="max-w-[460px] mx-auto text-left bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-[20px] p-4 shadow-[var(--v2-shadow)] relative"
      style={{ animation: pick === null ? "v2-buzz 5s ease-in-out infinite" : "v2-softFloat 5s ease-in-out infinite" }}
    >
      <WidgetBadge label="LOCK SCREEN · now" hint="try it" />
      <p className="m-0 mb-3 text-[14.5px] font-semibold leading-[1.45]">Pop quiz: how much of what you studied today is gone by tomorrow?</p>

      {pick === null ? (
        <div className="flex gap-2">
          {[10, 30, 70].map((v) => (
            <button
              key={v}
              onClick={() => setPick(v)}
              className="flex-1 h-[38px] rounded-[11px] border border-[var(--v2-line)] bg-[var(--v2-panel2)] text-[var(--v2-ink)] text-[13px] font-bold cursor-pointer transition-transform active:scale-95 hover:border-[var(--v2-ink)]"
            >
              ~{v}%
            </button>
          ))}
        </div>
      ) : (
        <>
          <ConfettiBurst />
          <div className="flex items-center gap-2.5 bg-[var(--v2-panel2)] rounded-xl p-2.5 px-3.5" style={{ animation: "v2-fadeUp .3s ease both" }}>
            <span className={cn("w-[22px] h-[22px] shrink-0 rounded-lg text-white grid place-items-center", isCorrect ? "bg-[var(--v2-ok)]" : "bg-[var(--v2-accent)]")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.5l5 5 10-11" /></svg>
            </span>
            <span className="text-[13px] leading-[1.45]">
              {isCorrect
                ? "Right — ~70% gone within a day. You just did active recall. Imagine your own notes doing this to you, daily."
                : "It's ~70% within a day (Ebbinghaus curve). Which is exactly the problem this app quizzes away."}
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-2.5 border border-dashed border-[var(--v2-line)] rounded-xl p-2.5 px-3.5" style={{ animation: "v2-fadeUp .35s .15s ease both" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#EA580C"><path d="M12 22c4.4 0 7.5-2.9 7.5-7.2 0-3.1-1.8-5.4-3.4-7.1-.5 1.2-1.3 2.1-2.3 2.6.3-2.8-1-6.4-3.8-8.3.2 3-1.6 4.7-3.2 6.4C5.2 10 4.5 11.9 4.5 14.8 4.5 19.1 7.6 22 12 22z" /></svg>
            <span className="text-[12.5px] leading-[1.45]">
              <strong>That was Day 1 of a streak.</strong>{" "}
              <span className="text-[var(--v2-mut)]">It counts if you start your trial today — tomorrow it's gone.</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================
   HERO: Scratch Card Widget
   ================================================================ */
function HeroScratch() {
  const [scratch, setScratch] = useState(0);
  const [revealedAt, setRevealedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  // Restore scratch state from session
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SCRATCH_SESSION_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.revealed && Date.now() - data.ts < SCRATCH_TTL) {
          setScratch(100);
          setRevealedAt(data.ts);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!revealedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [revealedAt]);

  const onScratch = useCallback(() => {
    if (revealedAt) return;
    setScratch((prev) => {
      const next = Math.min(prev + 2.5, 100);
      if (next >= 100) {
        const ts = Date.now();
        setRevealedAt(ts);
        sessionStorage.setItem(SCRATCH_SESSION_KEY, JSON.stringify({ ts, revealed: true }));
      }
      return next;
    });
  }, [revealedAt]);

  const reserveLeft = revealedAt ? Math.max(0, revealedAt + SCRATCH_TTL - now) : 0;
  const reserveMin = Math.floor(reserveLeft / 60000);
  const reserveSec = String(Math.floor((reserveLeft % 60000) / 1000)).padStart(2, "0");

  return (
    <div
      className="max-w-[460px] mx-auto text-left bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-[20px] p-4 shadow-[var(--v2-shadow)] relative"
      style={{ animation: revealedAt ? "v2-softFloat 5s ease-in-out infinite" : "v2-buzz 5s ease-in-out infinite" }}
    >
      <WidgetBadge label="HIDDEN ON THIS PAGE · just for you" hint="rub it" />
      <p className="m-0 mb-3 text-[14.5px] font-semibold leading-[1.45]">Your real offer is under the foil. Rub with your cursor to scratch it off.</p>

      <div
        onPointerMove={onScratch}
        className="relative h-[92px] rounded-[14px] overflow-hidden border border-[var(--v2-line)] cursor-grab"
        style={{ touchAction: "none" }}
      >
        {/* Revealed content under foil */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--v2-panel2)] text-center px-2.5">
          <span className="font-heading text-xl font-extrabold tracking-tight">
            EXTRA 33% OFF <span className="text-[var(--v2-mut)] font-bold">+</span> 3-day free trial
          </span>
          <span className="text-xs text-[var(--v2-mut)]">Annual plan · applied automatically at checkout</span>
        </div>
        {/* Foil overlay */}
        {scratch < 100 && (
          <div
            className="absolute inset-0 bg-[var(--v2-ink)] grid place-items-center text-[var(--v2-bg)] text-xs font-extrabold tracking-[.12em] transition-opacity duration-100"
            style={{ opacity: Math.max(0, 1 - scratch / 100) }}
          >
            <span>SCRATCH · {Math.round(scratch)}%</span>
          </div>
        )}
      </div>

      {revealedAt && (
        <>
          <ConfettiBurst />
          <div className="flex items-center gap-2.5 mt-2.5 border border-dashed border-[var(--v2-line)] rounded-xl p-2.5 px-3.5" style={{ animation: "v2-fadeUp .35s ease both" }}>
            <span className="w-2 h-2 shrink-0 rounded-full bg-[var(--v2-bad)]" style={{ animation: "v2-urgeBlink 1.2s ease-in-out infinite" }} />
            <span className="text-[12.5px] leading-[1.45]">
              <strong>Reserved for you · {reserveMin}:{reserveSec}</strong>{" "}
              <span className="text-[var(--v2-mut)]">— you scratched it, it's yours. Walk away and it re-seals.</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================
   HERO: Exam Math Widget
   ================================================================ */
function HeroExamMath() {
  const [days, setDays] = useState(30);
  const reviews = days * 2;
  const verdict =
    days < 10
      ? "Too late to cram calmly — but exactly enough time for spaced recall, if you start today."
      : days < 30
        ? "The perfect window: start today and every one of those reviews lands before the exam."
        : `Start now and exam week becomes a formality — your notes will have quizzed you ${reviews} times by then.`;

  return (
    <div
      className="max-w-[460px] mx-auto text-left bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-[20px] p-4 shadow-[var(--v2-shadow)] relative"
      style={{ animation: "v2-softFloat 5s ease-in-out infinite" }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 shrink-0 rounded-[9px] bg-[var(--v2-ink)] text-[var(--v2-bg)] grid place-items-center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 10h17M8 2.5V6M16 2.5V6" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-xs font-bold tracking-[.06em] text-[var(--v2-mut)]">EXAM MATH · takes 5 seconds</span>
        <span className="ml-auto text-[11px] font-bold text-[var(--v2-mut)] border border-[var(--v2-line)] rounded-full px-2.5 py-0.5">drag it</span>
      </div>
      <p className="m-0 mb-1 text-[14.5px] font-semibold leading-[1.45]">
        My next exam is in <span className="text-[var(--v2-accent)]" style={{ fontVariantNumeric: "tabular-nums" }}>{days} days</span>.
      </p>
      <input
        type="range" min={3} max={90} value={days}
        onChange={(e) => setDays(+e.target.value)}
        className="w-full my-0.5 mb-3 cursor-grab"
        style={{ accentColor: "var(--v2-ink)" }}
      />
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[var(--v2-panel2)] rounded-xl p-2.5 px-3">
          <strong className="text-[17px] font-heading">{reviews}</strong><br />
          <span className="text-[11.5px] text-[var(--v2-mut)] leading-[1.4]">lock-screen reviews before exam day</span>
        </div>
        <div className="bg-[var(--v2-panel2)] rounded-xl p-2.5 px-3">
          <strong className="text-[17px] font-heading">22¢</strong><br />
          <span className="text-[11.5px] text-[var(--v2-mut)] leading-[1.4]">per day on the Annual plan</span>
        </div>
        <div className="bg-[var(--v2-panel2)] rounded-xl p-2.5 px-3">
          <strong className="text-[17px] font-heading">1 coffee</strong><br />
          <span className="text-[11.5px] text-[var(--v2-mut)] leading-[1.4]">= 20 days of Pro</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 mt-2.5 border border-dashed border-[var(--v2-line)] rounded-xl p-2.5 px-3.5">
        <span className="w-2 h-2 shrink-0 rounded-full bg-[var(--v2-ink)]" />
        <span className="text-[12.5px] leading-[1.45]">{verdict}</span>
      </div>
    </div>
  );
}

/* ================================================================
   HERO: Explainer Widget (How it works)
   ================================================================ */
function HeroExplainer() {
  return (
    <div
      className="max-w-[560px] mx-auto text-left bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-[22px] shadow-[var(--v2-shadow)] overflow-hidden"
      style={{ animation: "v2-softFloat 6s ease-in-out infinite" }}
    >
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
        <span className="w-8 h-8 shrink-0 rounded-[9px] bg-[var(--v2-ink)] text-[var(--v2-bg)] grid place-items-center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
        </span>
        <span className="text-xs font-bold tracking-[.06em] text-[var(--v2-mut)]">HOW IT WORKS · while you live your life</span>
        <span className="ml-auto text-[11px] font-bold text-[var(--v2-mut)] border border-[var(--v2-line)] rounded-full px-2.5 py-0.5">watch</span>
      </div>

      {/* Animated scene */}
      <div className="relative h-[216px] overflow-hidden" style={{
        background: `linear-gradient(120deg, transparent 30%, color-mix(in oklab, var(--v2-accent) 7%, transparent) 50%, transparent 70%),
                     radial-gradient(120% 90% at 16% 10%, color-mix(in oklab, var(--v2-accent) 22%, transparent), transparent 55%),
                     radial-gradient(110% 100% at 86% 16%, color-mix(in oklab, var(--v2-accent2) 20%, transparent), transparent 60%),
                     radial-gradient(100% 130% at 50% 115%, color-mix(in oklab, var(--v2-ok) 16%, transparent), transparent 55%),
                     var(--v2-panel2)`
      }}>
        {/* Dashed connector lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 560 216" preserveAspectRatio="none" fill="none">
          <path d="M152 96 C 190 70, 200 120, 228 104" stroke="var(--v2-accent)" strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" opacity=".55" style={{ animation: "v2-dashFlow 1.6s linear infinite" }} />
          <path d="M332 104 C 360 120, 372 66, 408 88" stroke="var(--v2-accent2)" strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" opacity=".55" style={{ animation: "v2-dashFlow 1.6s linear infinite" }} />
        </svg>

        {/* Twinkle stars */}
        <svg className="absolute" style={{ left: "9%", top: 20, color: "var(--v2-accent)", animation: "v2-twinkle 3.2s .4s ease-in-out infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>
        <svg className="absolute" style={{ right: "12%", top: 14, color: "var(--v2-accent2)", animation: "v2-twinkle 2.7s 1.1s ease-in-out infinite" }} width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>
        <svg className="absolute" style={{ right: "30%", bottom: 22, color: "#EFB100", animation: "v2-twinkle 3.6s 1.8s ease-in-out infinite" }} width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>
        <svg className="absolute" style={{ left: "31%", bottom: 30, color: "var(--v2-ok)", animation: "v2-twinkle 3s .9s ease-in-out infinite" }} width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></svg>

        {/* Note card (left) */}
        <div className="absolute bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-[13px] p-3 shadow-[var(--v2-shadow)]" style={{ left: "5%", top: 56, width: 122, transform: "rotate(-5deg)" }}>
          <div className="text-[9px] font-extrabold tracking-[.09em] text-[var(--v2-mut)] mb-1.5">YOUR NOTE</div>
          <div className="h-[5px] rounded-sm bg-[var(--v2-line)] mb-1.5" />
          <div className="relative h-[5px] rounded-sm bg-[var(--v2-line)] mb-1.5">
            <div className="absolute inset-0 rounded-sm bg-[var(--v2-ink)]" style={{ transformOrigin: "left", animation: "v2-hlSweep 6s ease infinite" }} />
          </div>
          <div className="h-[5px] w-[68%] rounded-sm bg-[var(--v2-line)]" />
        </div>

        {/* Glow center */}
        <div className="absolute pointer-events-none" style={{ left: "50%", top: "50%", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklab, var(--v2-accent) 26%, transparent), transparent 70%)", animation: "v2-glowPulse 4s ease-in-out infinite" }} />

        {/* Phone (center) */}
        <div className="absolute" style={{ left: "50%", top: 40, width: 112, height: 200, borderRadius: 26, background: "#101014", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 18px 40px -14px rgba(10,10,20,.55)", animation: "v2-tiltFloat 6s ease-in-out infinite" }}>
          <div className="absolute" style={{ left: "50%", top: 9, transform: "translateX(-50%)", width: 34, height: 9, borderRadius: 999, background: "#000" }} />
          <div className="absolute rounded-[22px] overflow-hidden" style={{ inset: 4, background: "linear-gradient(170deg, color-mix(in oklab, var(--v2-accent) 38%, #16161d), color-mix(in oklab, var(--v2-accent2) 30%, #101018) 60%, #0c0c12)" }}>
            <div className="text-center mt-7 text-white/90 font-heading text-[22px] font-bold tracking-wide">21:12</div>
            <div className="mx-1.5 mt-3 bg-white/95 rounded-[11px] p-2 shadow-[0_6px_16px_rgba(0,0,0,.3)]" style={{ animation: "v2-notifDrop 6s ease infinite" }}>
              <div className="text-[7.5px] font-extrabold tracking-[.07em] text-[#8A8A93]">BIO 301 · now</div>
              <div className="text-[9.5px] font-bold leading-[1.35] text-[#17171B]">What was that highlight about?</div>
            </div>
          </div>
        </div>

        {/* Recall ring (right) */}
        <div className="absolute bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-[14px] p-2.5 px-3.5 shadow-[var(--v2-shadow)] flex items-center gap-2" style={{ right: "5%", top: 52, transform: "rotate(4deg)" }}>
          <svg width="40" height="40" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--v2-line)" strokeWidth="4" />
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--v2-ok)" strokeWidth="4" strokeLinecap="round" strokeDasharray="113" strokeDashoffset="113" transform="rotate(-90 22 22)" style={{ animation: "v2-ringGo 6s ease infinite" }} />
          </svg>
          <span className="leading-[1.25]">
            <strong className="text-[15px] font-heading">92%</strong><br />
            <span className="text-[9.5px] text-[var(--v2-mut)]">recall on<br />exam day</span>
          </span>
        </div>

        {/* Streak pill (bottom-left) */}
        <div className="absolute inline-flex items-center gap-1.5 bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-full py-1.5 px-3 shadow-[var(--v2-shadow)]" style={{ left: "7%", bottom: 20, transform: "rotate(-3deg)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#EA580C"><path d="M12 22c4.4 0 7.5-2.9 7.5-7.2 0-3.1-1.8-5.4-3.4-7.1-.5 1.2-1.3 2.1-2.3 2.6.3-2.8-1-6.4-3.8-8.3.2 3-1.6 4.7-3.2 6.4C5.2 10 4.5 11.9 4.5 14.8 4.5 19.1 7.6 22 12 22z" /></svg>
          <span className="text-[10.5px] font-extrabold">Day 7 streak</span>
        </div>

        {/* Correct pill (bottom-right) */}
        <div className="absolute inline-flex items-center gap-1.5 bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-full py-1.5 px-3 shadow-[var(--v2-shadow)]" style={{ right: "8%", bottom: 18, transform: "rotate(3deg)" }}>
          <span className="w-[13px] h-[13px] shrink-0 rounded-full bg-[var(--v2-ok)] text-white grid place-items-center">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.5l5 5 10-11" /></svg>
          </span>
          <span className="text-[10.5px] font-extrabold">Correct, again</span>
        </div>
      </div>

      {/* Steps row */}
      <div className="px-4 py-3.5">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 shrink-0 rounded-[9px] grid place-items-center" style={{ background: "color-mix(in oklab, var(--v2-accent) 14%, transparent)", color: "var(--v2-accent)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3.5l3.5 3.5L8 19.5 3.5 20.5 4.5 16z" /></svg>
            </span>
            <span className="text-[11.5px] leading-[1.35]"><strong>Write</strong><br /><span className="text-[var(--v2-mut)]">notes like always</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 shrink-0 rounded-[9px] grid place-items-center" style={{ background: "color-mix(in oklab, var(--v2-accent2) 16%, transparent)", color: "var(--v2-accent2)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>
            </span>
            <span className="text-[11.5px] leading-[1.35]"><strong>Get pinged</strong><br /><span className="text-[var(--v2-mut)]">on your lock screen</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 shrink-0 rounded-[9px] grid place-items-center" style={{ background: "color-mix(in oklab, var(--v2-ok) 15%, transparent)", color: "var(--v2-ok)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.5l5 5 10-11" /></svg>
            </span>
            <span className="text-[11.5px] leading-[1.35]"><strong>Remember</strong><br /><span className="text-[var(--v2-mut)]">92% by exam day</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 mt-3 border border-dashed border-[var(--v2-line)] rounded-xl p-2.5 px-3.5">
          <span className="w-2 h-2 shrink-0 rounded-full bg-[var(--v2-ok)]" />
          <span className="text-[12.5px] leading-[1.45]">No study sessions to remember. <span className="text-[var(--v2-mut)]">Your notes chase you — that's the whole trick.</span></span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Check icon (shared)
   ================================================================ */
const CheckIcon = () => (
  <span className="w-[17px] h-[17px] shrink-0 rounded-full bg-[var(--v2-ok)] text-white grid place-items-center">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.5l5 5 10-11" /></svg>
  </span>
);

/* ================================================================
   Pricing Card
   ================================================================ */
function PricingCard({
  plan,
  featured,
  onCheckout,
  isLoading,
  activePlanKey,
  onManage,
  liveData,
  hasPromo,
  promoOn,
}: {
  plan: any;
  featured: boolean;
  onCheckout: () => void;
  isLoading: boolean;
  activePlanKey: string | null;
  onManage: () => void;
  liveData: any;
  hasPromo: boolean;
  promoOn: boolean;
}) {
  const { t } = useTranslation();
  const isActive = activePlanKey === plan.key;
  const isAnnual = plan.key === "annual";
  const isMonthly = plan.key === "monthly";
  const isWeekly = plan.key === "weekly";

  const price = liveData ? liveData.current : null;
  const original = liveData?.original;
  const hasTrial = liveData?.hasTrial;
  const trialFreq = liveData?.trialFrequency;

  const displayPrice = isWeekly && hasPromo
    ? "Free"
    : price
      ? `$${isAnnual ? (price / 12).toFixed(2) : price}`
      : "";
  const perLabel = isWeekly ? (hasPromo ? "first week" : "/week") : isAnnual ? "/month" : `/${plan.unit}`;
  const anchor = original ? `$${isAnnual ? (original / 12).toFixed(2) : original}/${plan.unit}` : null;

  const baseChip = isWeekly
    ? "Free to start"
    : isMonthly
      ? "50% OFF"
      : "80% OFF";

  const desc = isWeekly
    ? "For the exam that's next week. Full access, then $5.99/wk if you stay."
    : isMonthly
      ? "Through the semester, month by month. Pause or cancel whenever."
      : promoOn
        ? "Best value for the school year — and the only plan the semester offer applies to."
        : "Best value for the school year. Half price, every day.";

  const ctaLabel = isActive
    ? t("Manage subscription")
    : hasTrial
      ? `Start ${trialFreq}-${t("day free trial")}`
      : isWeekly
        ? "Start free week"
        : isAnnual
          ? (promoOn ? "Start 3-day free trial" : "Go Annual")
          : "Get Monthly";

  const ctaSub = isWeekly
    ? "No card. It just works."
    : isMonthly
      ? "Billed monthly · cancel in 2 taps"
      : promoOn
        ? `$0 today · $${price || "79.99"} year one`
        : `Billed $${price || "119.88"}/yr · cancel anytime`;

  const promoPill = featured && promoOn ? "Semester offer: extra discount + free trial" : null;

  const features = plan.features || [
    "Unlimited notes",
    "2x Daily Live AI Tutoring",
    "AI Chat",
    "Unlimited quizzes & flashcards",
    "Quiz push notifications",
  ];

  return (
    <div
      className={cn(
        "relative flex flex-col bg-[var(--v2-panel)] rounded-[20px] p-6 transition-transform hover:-translate-y-[3px]",
        featured
          ? "border-[1.5px] border-[var(--v2-accent)] shadow-[var(--v2-shadow)]"
          : "border-[1.5px] border-[var(--v2-line)]"
      )}
    >
      {/* "MOST PICKED" badge */}
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--v2-ink)] text-[var(--v2-bg)] text-[10.5px] font-extrabold tracking-[.1em] rounded-full py-1.5 px-3.5 whitespace-nowrap">
          MOST PICKED · 71%
        </span>
      )}

      {/* Name + chip */}
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] font-extrabold tracking-[.12em] uppercase text-[var(--v2-mut)]">{plan.name || plan.key}</span>
        <span className="ml-auto text-[11px] font-bold text-[var(--v2-ink)] bg-[var(--v2-nav-active)] rounded-full py-1 px-2.5 whitespace-nowrap">{baseChip}</span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1.5 mt-3.5 mb-0.5">
        <span className="font-heading text-4xl font-extrabold tracking-tight">{displayPrice}</span>
        {!isWeekly && <span className="text-[var(--v2-mut)] text-sm">{perLabel}</span>}
      </div>
      {anchor && <span className="text-[var(--v2-mut)] text-[13px] line-through">{anchor}</span>}

      <p className="mt-2.5 mb-3.5 text-[13.5px] text-[var(--v2-mut)]">{desc}</p>

      {/* Promo pill */}
      {promoPill && (
        <span className="inline-flex items-center gap-1.5 w-max bg-[var(--v2-ink)] text-[var(--v2-bg)] rounded-full py-1.5 px-3 text-[12.5px] font-bold mb-3.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z" /></svg>
          {promoPill}
        </span>
      )}

      {/* Features */}
      <div className="grid gap-2.5 mb-5">
        {features.map((f: string, i: number) => (
          <span key={i} className="flex items-center gap-2.5 text-[13.5px]">
            <span className="w-[19px] h-[19px] shrink-0 rounded-[7px] bg-[var(--v2-panel2)] text-[var(--v2-ok)] grid place-items-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.5l5 5 10-11" /></svg>
            </span>
            {f}
          </span>
        ))}
      </div>

      <div className="flex-1" />

      {/* CTA */}
      <button
        onClick={isActive ? onManage : onCheckout}
        disabled={isLoading}
        className={cn(
          "h-[46px] rounded-[13px] border-[1.5px] text-sm font-bold cursor-pointer transition-transform hover:-translate-y-px active:scale-[.98] flex items-center justify-center gap-2",
          featured && !isActive
            ? "border-transparent bg-[var(--v2-ink)] text-[var(--v2-bg)]"
            : "border-[var(--v2-line)] bg-[var(--v2-panel)] text-[var(--v2-ink)]"
        )}
      >
        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : ctaLabel}
      </button>
      <p className="mt-2.5 text-center text-xs text-[var(--v2-mut)]">{ctaSub}</p>
    </div>
  );
}

/* ================================================================
   MAIN: Pricing Page
   ================================================================ */
export default function PricingSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { userId, email } = useUserStore();
  const [paddle, setPaddle] = useState<any>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [prices, setPrices] = useState<any>({});
  const checkoutRef = useRef<{ priceId: string; itemPrice: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const { targetDate, hasPromo } = useOfferCountdown();
  const [searchParams] = useSearchParams();
  const isPromoLink = searchParams.get("sale") === "true";
  const posthog = usePostHog();

  const promoOn = !!(isPromoLink && hasPromo);

  // Countdown
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const left = Math.max(0, targetDate.getTime() - Date.now());
      setTimeLeft({
        d: Math.floor(left / 864e5),
        h: Math.floor((left % 864e5) / 36e5),
        m: Math.floor((left % 36e5) / 6e4),
        s: Math.floor((left % 6e4) / 1e3),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  // Hero widget selection
  const heroWidget = useMemo(() => pickHeroWidget(searchParams.get("hero")), []);

  // Subscription
  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
    enabled: !!userId,
  });
  const activePlanKey = subscriptionData?.data?.billing_cycle?.interval
    ? (subscriptionData.data.billing_cycle.interval === "year" ? "annual" : "monthly")
    : null;

  // AppLovin view_item
  useEffect(() => { console.log("[axon] view_item event fired"); window.axon?.("track", "view_item"); }, []);

  // Paddle init + price fetch
  useEffect(() => {
    const init = async () => {
      const paddleInstance = await initializePaddle({
        environment: import.meta.env.VITE_PADDLE_ENV,
        token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
        eventCallback: (event: any) => {
          if (event.name === "checkout.closed") setLoadingPriceId(null);
          if (event.name === "checkout.completed") {
            const txn = event.data;
            const attribution = getLastTouch();
            const firstAttribution = getFirstTouch();
            const firstItem = txn?.items?.[0];
            const purchaseValue = firstItem?.totals?.total ?? txn?.totals?.total ?? checkoutRef.current?.itemPrice ?? 0;
            const axonPurchaseData = {
              item_id: firstItem?.price_id || checkoutRef.current?.priceId || "",
              user_email: email || "",
              item_price: purchaseValue,
              value: purchaseValue,
              currency: txn?.currency_code || "USD",
              transaction_id: txn?.transaction_id || "",
              items: (txn?.items || []).map((item: any) => ({ id: item?.price_id, quantity: item?.quantity })),
              shipping: 0,
              tax: firstItem?.totals?.tax ?? txn?.totals?.tax ?? 0,
            };
            console.log("[axon] purchase event:", axonPurchaseData);
            window.axon?.("track", "purchase", axonPurchaseData);
            posthog.capture("purchase", {
              value: purchaseValue,
              currency: txn?.currency_code || "USD",
              transaction_id: txn?.transaction_id || "",
              last_utm_source: attribution.utm_source || null,
              last_utm_medium: attribution.utm_medium || null,
              last_utm_campaign: attribution.utm_campaign || null,
              first_utm_source: firstAttribution.utm_source || null,
              aleid: attribution.aleid || firstAttribution.aleid || null,
            });
            toast.success(t("Welcome aboard!"));
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
          }
        },
      });
      if (paddleInstance) {
        setPaddle(paddleInstance);
        const activeTiers = promoOn ? PRICING_TIERS_CLAIM : PRICING_TIERS;
        const results = await Promise.all(
          activeTiers.map((tier) =>
            paddleInstance.PricePreview({
              items: [{ priceId: tier.priceId, quantity: 1 }],
              discountId: tier.discountId,
            })
          )
        );
        const newPrices: any = {};
        results.forEach((result: any) => {
          const item = result.data.details.lineItems[0];
          const discountObj = item.discounts?.[0]?.discount;
          const discountType = discountObj?.type;
          const discountValue = discountObj?.amount;
          newPrices[item.price.id] = {
            current: parseInt(item.formattedTotals.total.replace(/[^0-9]/g, ""), 10) / 100,
            original: parseInt(item.formattedTotals.subtotal.replace(/[^0-9]/g, ""), 10) / 100,
            hasTrial: !!item.price?.trialPeriod,
            trialFrequency: item.price?.trialPeriod?.frequency,
            trialInterval: item.price?.trialPeriod?.interval,
            discountPercent: discountType === "percentage" ? discountValue : null,
            discountFormatted: item.formattedTotals.discount,
          };
        });
        setPrices(newPrices);
      }
    };
    init();
  }, [isPromoLink, hasPromo]);

  const openCheckout = (priceId: string, discountId?: string) => {
    const attribution = getLastTouch();
    setLoadingPriceId(priceId);
    const liveData = prices[priceId];
    const itemPrice = liveData?.current || 0;
    checkoutRef.current = { priceId, itemPrice };
    const axonCartData = {
      item_id: priceId,
      user_email: email || "",
      item_price: itemPrice,
      value: itemPrice,
      currency: "USD",
    };
    console.log("[axon] add_to_cart event:", axonCartData);
    window.axon?.("track", "add_to_cart", axonCartData);
    console.log("[axon] begin_checkout event:", axonCartData);
    window.axon?.("track", "begin_checkout", axonCartData);
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      discountId,
      customData: {
        internal_user_id: userId,
        internal_email: email,
        utm_source: attribution.utm_source || null,
        utm_medium: attribution.utm_medium || null,
        utm_campaign: attribution.utm_campaign || null,
        aleid: attribution.aleid || null,
      },
      settings: { displayMode: "overlay", theme: "system" },
    });
  };

  const activeTiers = promoOn ? PRICING_TIERS_CLAIM : PRICING_TIERS;

  return (
    <div className="min-h-full" style={{ fontSize: 14, lineHeight: 1.55 }}>
      {/* ====== Page Content ====== */}
      <div className="max-w-[1040px] mx-auto px-5 sm:px-10 py-9 pb-20">

        {/* --- Header Section --- */}
        <div className="text-center mb-8" style={{ animation: "v2-fadeUp .4s .04s ease both" }}>

          {/* Promo badge */}
          {promoOn && (
            <div className="inline-flex items-center gap-3 bg-[var(--v2-nav-active)] border border-[var(--v2-line)] rounded-full py-2 px-2.5 mb-5 text-[13px] font-semibold text-[var(--v2-ink)]">
              <span className="bg-[var(--v2-ink)] text-[var(--v2-bg)] rounded-full py-1 px-3 text-[10.5px] font-extrabold tracking-[.09em]" style={{ animation: "v2-softFloat 3.5s ease-in-out infinite" }}>
                SEMESTER OFFER
              </span>
              Extra discount + free trial on Annual
              <span className="inline-flex items-center gap-1.5 font-extrabold text-[12.5px] text-[var(--v2-bad)] pr-2 whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--v2-bad)]" style={{ animation: "v2-urgeBlink 1.2s ease-in-out infinite" }} />
                ends in {timeLeft.d}d {String(timeLeft.h).padStart(2, "0")}:{String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
              </span>
            </div>
          )}

          <h1 className="m-0 mb-2 font-heading text-[28px] sm:text-[34px] font-extrabold tracking-tight">
            Your notes will quiz you tonight.
          </h1>
          <p className="m-0 mb-3.5 text-[var(--v2-mut)] text-[15px]">Every plan gets everything.</p>

          {/* Trust badges */}
          <div className="flex justify-center gap-2.5 flex-wrap mb-6">
            {["No credit card", "Cancel anytime", "Money back, 30 days"].map((txt, i) => (
              <span key={i} className={cn(
                "inline-flex items-center gap-2 bg-[var(--v2-panel)] rounded-full py-2 px-4 text-[13.5px] font-bold shadow-[var(--v2-shadow)]",
                i === 0 ? "border-[1.5px] border-[var(--v2-ok)]" : "border border-[var(--v2-line)]"
              )}>
                <CheckIcon />
                {txt}
              </span>
            ))}
          </div>

          {/* Hero Widget */}
          <div className="mb-0">
            {heroWidget === "quiz" && <HeroQuiz />}
            {heroWidget === "scratch" && <HeroScratch />}
            {heroWidget === "exam-math" && <HeroExamMath />}
            {heroWidget === "explainer" && <HeroExplainer />}
          </div>

          {/* Comparison cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[760px] mx-auto mt-7 text-left">
            <div className="bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-2xl p-4 px-5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-7 h-7 shrink-0 rounded-[9px] bg-[var(--v2-nav-active)] text-[var(--v2-ink)] grid place-items-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 9a3 3 0 1 1 4.6 2.5c-1 .7-1.6 1.2-1.6 2.5" /><circle cx="12" cy="17.6" r=".4" fill="currentColor" /><circle cx="12" cy="12" r="9.5" /></svg>
                </span>
                <strong className="text-sm">"Why not just ChatGPT?"</strong>
              </div>
              <p className="m-0 text-[13px] text-[var(--v2-mut)] leading-relaxed">
                ChatGPT waits for questions. <strong className="text-[var(--v2-ink)] font-semibold">This one asks you</strong> — from your notes, before you forget.
              </p>
            </div>
            <div className="bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-2xl p-4 px-5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-7 h-7 shrink-0 rounded-[9px] bg-[var(--v2-nav-active)] text-[var(--v2-ink)] grid place-items-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"><path d="M12 2.5l7.5 3v6c0 5-3.2 8.5-7.5 10-4.3-1.5-7.5-5-7.5-10v-6z" /><path d="M8.8 12l2.2 2.2 4.2-4.6" strokeLinecap="round" /></svg>
                </span>
                <strong className="text-sm">"Who sees my notes?"</strong>
              </div>
              <p className="m-0 text-[13px] text-[var(--v2-mut)] leading-relaxed">
                <strong className="text-[var(--v2-ink)] font-semibold">Nobody.</strong> Never trains AI, never sold, encrypted. Delete everything anytime.
              </p>
            </div>
          </div>

          {/* Star rating */}
          <div className="mt-3.5 text-[13px]">
            <span className="text-amber-400 tracking-wider">★★★★★</span>{" "}
            <strong>4.9</strong>{" "}
            <span className="text-[var(--v2-mut)]">from 20,000+ students</span>
          </div>
        </div>

        {/* --- Pricing Cards --- */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch"
          style={{ animation: "v2-fadeUp .45s .08s ease both" }}
        >
          {activeTiers.map((tier: any) => {
            const liveData = prices[tier.priceId];
            return (
              <PricingCard
                key={tier.id}
                plan={tier}
                featured={tier.key === "annual"}
                onCheckout={() => openCheckout(tier.priceId, tier.discountId)}
                isLoading={loadingPriceId === tier.priceId}
                activePlanKey={activePlanKey}
                onManage={() => setSettingsOpen(true)}
                liveData={liveData}
                hasPromo={!!hasPromo}
                promoOn={promoOn}
              />
            );
          })}
        </div>

        {/* --- UGC / Testimonials --- */}
        <div className="mt-12" style={{ animation: "v2-fadeUp .45s .12s ease both" }}>
          <p className="m-0 mb-1 text-center text-[11px] font-extrabold tracking-[.14em] uppercase text-[var(--v2-mut)]">From students, on camera</p>
          <h3 className="m-0 mb-5 text-center font-heading text-[21px] font-extrabold tracking-tight">Don't take our word for it — press play</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[
              { len: "0:41", quote: "The lock-screen quiz got me before my anatomy final did.", name: "Maya", who: "Pre-med, UCLA" },
              { len: "0:28", quote: "I stopped rereading notes. It just asks me at the right time.", name: "Jonas", who: "CS, TU Munich" },
              { len: "0:35", quote: "19-day streak. My flatmates think I'm ill.", name: "Priya", who: "Law, King's College" },
            ].map((u, i) => (
              <div key={i} className="bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-2xl overflow-hidden transition-transform hover:-translate-y-[3px]">
                <div className="relative h-[180px] bg-[var(--v2-panel2)]">
                  <div className="absolute inset-0 grid place-items-center pointer-events-none">
                    <span className="w-12 h-12 rounded-full bg-black/55 backdrop-blur-[4px] grid place-items-center text-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
                    </span>
                  </div>
                  <span className="absolute right-2.5 bottom-2.5 bg-black/60 text-white text-[11px] font-bold rounded-md py-0.5 px-2 pointer-events-none">{u.len}</span>
                </div>
                <div className="p-4">
                  <p className="m-0 mb-2 text-[13.5px] leading-[1.5]">"{u.quote}"</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--v2-mut)]">
                    <strong className="text-[var(--v2-ink)]">{u.name}</strong> · {u.who}
                    <span className="ml-auto inline-flex items-center gap-1 text-[var(--v2-ok)] font-bold">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.5l5 5 10-11" /></svg>
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Value Grid --- */}
        <div className="mt-12" style={{ animation: "v2-fadeUp .45s .16s ease both" }}>
          <p className="m-0 mb-1 text-center text-[11px] font-extrabold tracking-[.14em] uppercase text-[var(--v2-mut)]">What Pro actually gets you</p>
          <h3 className="m-0 mb-5 text-center font-heading text-[21px] font-extrabold tracking-tight">One subscription, on every device you study with</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[
              {
                icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" /></svg>,
                title: "Mobile app included",
                desc: "iOS & Android. Every note, quiz and flashcard in your pocket — offline too.",
              },
              {
                icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" /></svg>,
                title: "Live AI tutoring, in real time",
                desc: "Voice sessions on mobile, twice daily: it drills you, listens, and corrects on the spot.",
              },
              {
                icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>,
                title: "Quizzes that find you",
                desc: "Schedule a quiz on any highlight — your phone pings you exactly when it's time to recall.",
              },
              {
                icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 5v6h-6M4 19v-6h6" /><path d="M20 11a8 8 0 0 0-14.5-3.5M4 13a8 8 0 0 0 14.5 3.5" /></svg>,
                title: "Progress that follows you",
                desc: "Create at your desk, revise on the bus. Streaks, scores and highlights sync instantly.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-2xl p-5">
                <span className="w-9 h-9 rounded-xl bg-[var(--v2-nav-active)] text-[var(--v2-ink)] grid place-items-center mb-3">{item.icon}</span>
                <strong className="text-sm block mb-1">{item.title}</strong>
                <p className="m-0 text-[12.5px] text-[var(--v2-mut)] leading-[1.5]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* --- FAQ --- */}
        <div className="mt-12">
          <p className="m-0 mb-1 text-center text-[11px] font-extrabold tracking-[.14em] uppercase text-[var(--v2-mut)]">Questions</p>
          <h3 className="m-0 mb-5 text-center font-heading text-[21px] font-extrabold tracking-tight">Frequently asked</h3>
          <div className="bg-[var(--v2-panel)] border border-[var(--v2-line)] rounded-[20px] overflow-hidden">
            {FAQ_DATA.map((faq, i) => (
              <div key={i} className="border-b border-[var(--v2-line)] last:border-none text-sm">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 px-6 text-left hover:bg-[var(--v2-panel2)]/50 transition-all cursor-pointer bg-transparent border-none text-[var(--v2-ink)]"
                >
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown size={20} className={cn("text-[var(--v2-mut)] transition-transform duration-300 shrink-0 ml-4", faqOpen === i && "rotate-180")} />
                </button>
                <div className={cn("grid transition-[grid-template-rows] duration-500 ease-in-out", faqOpen === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-[var(--v2-mut)] text-sm leading-relaxed m-0">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof Feed (backend-wired) */}
      <div className="fixed left-[84px] bottom-[22px] z-[80]">
        <LiveActivityFeed2 />
      </div>

      <SettingsDialog isOpen={settingsOpen} setIsOpen={setSettingsOpen} defaultTab="subscription" />
    </div>
  );
}
