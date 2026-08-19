import { BrandWordmark } from "@/components/BrandMark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LangToggle, faDigits, num, useLang } from "@/lib/i18n";
import {
  ArrowRight,
  BarChart3,
  Goal,
  GraduationCap,
  LineChart,
  Shield,
  Swords,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const FEATURES = [
  { icon: Swords, titleKey: "feat.engine.title", bodyKey: "feat.engine.body" },
  { icon: Users, titleKey: "feat.squad.title", bodyKey: "feat.squad.body" },
  { icon: Wallet, titleKey: "feat.market.title", bodyKey: "feat.market.body" },
  { icon: GraduationCap, titleKey: "feat.youth.title", bodyKey: "feat.youth.body" },
  { icon: LineChart, titleKey: "feat.finance.title", bodyKey: "feat.finance.body" },
  { icon: Trophy, titleKey: "feat.trophy.title", bodyKey: "feat.trophy.body" },
];

const STEPS = [
  { n: "01", titleKey: "step.1.title", bodyKey: "step.1.body" },
  { n: "02", titleKey: "step.2.title", bodyKey: "step.2.body" },
  { n: "03", titleKey: "step.3.title", bodyKey: "step.3.body" },
];

function ScoreboardCard() {
  const { t, lang } = useLang();
  const d = (s: string | number) => (lang === "fa" ? faDigits(s) : String(s));
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div
        className="pointer-events-none absolute -inset-10 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.55 0.14 152 / 0.35), transparent)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl border border-white/10 bg-card/90 shadow-2xl shadow-black/40 backdrop-blur"
      >
        {/* Match header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex size-2 rounded-full bg-emerald-400" />
            {t("lp.live")}
          </div>
          <div className="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-xs font-semibold tabular-nums text-emerald-400">
            {d("74'")}
          </div>
        </div>

        {/* Score */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#6CABDD]/20 text-[10px] font-black text-[#bfe3ff]">
              MCI
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Manchester City
            </span>
          </div>
          <div className="text-center">
            <div className="font-mono text-5xl font-bold tabular-nums tracking-tight text-foreground">
              {d(2)}
              <span className="mx-2 text-muted-foreground/50">–</span>
              {d(1)}
            </div>
            <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {t("lp.fullTimeLooming")}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#EF0107]/20 text-[10px] font-black text-[#ff9d9d]">
              ARS
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Arsenal
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4 border-t border-white/5 px-6 py-5">
          <div>
            <div className="mb-1.5 flex justify-between text-[11px] font-medium text-muted-foreground">
              <span className="text-emerald-400">{d("62%")}</span>
              <span>{t("mv.possession")}</span>
              <span>{d("38%")}</span>
            </div>
            <div className="flex h-1.5 gap-1 overflow-hidden rounded-full">
              <div className="w-[62%] rounded-full bg-emerald-500" />
              <div className="flex-1 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              [t("mv.shots"), "14 – 9"],
              [t("mv.onTarget"), "6 – 4"],
              [t("mv.xg"), "1.9 – 1.1"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white/[0.04] px-3 py-2.5">
                <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {d(value)}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating chips */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="absolute -left-6 top-10 hidden rounded-xl border border-white/10 bg-card/90 px-4 py-3 shadow-xl shadow-black/30 backdrop-blur md:block"
      >
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t("lp.leaguePos")}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {d(1)}
          </span>
          <span className="text-xs text-muted-foreground">/ {d(12)}</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.75 }}
        className="absolute -right-6 bottom-10 hidden rounded-xl border border-white/10 bg-card/90 px-4 py-3 shadow-xl shadow-black/30 backdrop-blur md:block"
      >
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t("lp.budget")}
        </div>
        <div className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-400">
          {lang === "fa" ? faDigits("€47.2M") : "€47.2M"}
        </div>
      </motion.div>
    </div>
  );
}

export default function Landing() {
  const { t, lang } = useLang();
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" aria-label={t("lp.home")}>
            <BrandWordmark sub={t("lp.sub")} />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              {t("lp.features")}
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              {t("lp.how")}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <LangToggle />
            <Button asChild size="sm" variant="outline" className="rounded-lg">
              <Link to="/auth?returnTo=%2Fdashboard">{t("lp.signIn")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pb-24 pt-40 sm:pt-48">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 480px at 50% -10%, oklch(0.4 0.12 155 / 0.28), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 rounded-full border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-400"
            >
              {t("lp.badge")}
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-[1.06] tracking-tight sm:text-6xl"
          >
            {t("lp.h1a")}
            <br />
            <span className="text-muted-foreground">{t("lp.h1b")}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.16 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t("lp.hero")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.24 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="rounded-xl px-7 text-base">
              <Link to="/auth?returnTo=%2Fdashboard">
                {t("lp.startCareer")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-white/10 bg-white/[0.03] px-7 text-base"
            >
              <a href="#how">{t("lp.seeHow")}</a>
            </Button>
          </motion.div>
        </div>

        <div className="relative mt-20">
          <ScoreboardCard />
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 py-12 sm:grid-cols-4">
          {[
            [num(lang, 33), t("lp.statLeagues")],
            [num(lang, 396), t("lp.statClubs")],
            [num(lang, 2), t("lp.statTrophies")],
            [num(lang, 27), t("lp.statWeeks")],
          ].map(([value, label], i) => (
            <motion.div
              key={label}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="px-4 py-2 text-center"
            >
              <div className="font-mono text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {value}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              {t("lp.featKicker")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("lp.featTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t("lp.featBody")}
            </p>
          </motion.div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.titleKey}
                {...fadeUp}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-card p-6 transition-colors duration-300 hover:border-emerald-500/30 hover:bg-card/80"
              >
                <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-emerald-500/10 text-emerald-400">
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold tracking-tight">
                  {t(f.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(f.bodyKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-white/5 bg-white/[0.02] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              {t("lp.stepsKicker")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("lp.stepsTitle")}
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-2xl border border-white/8 bg-card p-7"
              >
                <div className="font-mono text-sm font-bold tabular-nums text-emerald-400/80">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {t(s.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(s.bodyKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 sm:py-32">
        <motion.div
          {...fadeUp}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-emerald-500/20 px-8 py-16 text-center sm:px-16"
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(700px 320px at 50% 0%, oklch(0.45 0.12 155 / 0.3), transparent 70%)",
            }}
          />
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-emerald-500/15 text-emerald-400">
            <Goal className="size-7" />
          </div>
          <h2 className="mx-auto max-w-xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {t("lp.finalTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            {t("lp.finalBody")}
          </p>
          <Button asChild size="lg" className="mt-8 rounded-xl px-8 text-base">
            <Link to="/auth?returnTo=%2Fdashboard">
              {t("lp.startCareer")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <BrandWordmark markSize={26} sub="True Football Clone" />
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="size-3.5 text-emerald-400" />
              {t("lp.saveProgress")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 className="size-3.5 text-emerald-400" />
              {t("lp.pureSingle")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70">
            {t("lp.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
