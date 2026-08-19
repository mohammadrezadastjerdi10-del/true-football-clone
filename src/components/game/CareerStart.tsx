import { BrandWordmark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSave } from "@/hooks/use-save";
import { Crest, Flag } from "@/components/game/shared";
import { useAuth } from "@/hooks/use-auth";
import { ALL_COUNTRIES, LEAGUES } from "@/lib/game/world";
import { LangToggle, useLang } from "@/lib/i18n";
import { Dices, Loader2, LogOut, PencilRuler, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type Mode = "standard" | "quick" | "custom";

const COLOR_PRESETS = [
  { p1: "#10B981", p2: "#FFFFFF" },
  { p1: "#1D4ED8", p2: "#FFFFFF" },
  { p1: "#DC2626", p2: "#FFFFFF" },
  { p1: "#F59E0B", p2: "#111111" },
  { p1: "#0EA5E9", p2: "#FFFFFF" },
  { p1: "#7C3AED", p2: "#FFFFFF" },
  { p1: "#EA580C", p2: "#111111" },
  { p1: "#0D9488", p2: "#FFFFFF" },
];

const CAPACITIES = [5000, 12000, 24000, 40000];
const TIER_BUDGETS = [80_000_000, 45_000_000, 25_000_000, 15_000_000];

export function CareerStart() {
  const { createCareer } = useSave();
  const { user, signOut } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("standard");
  const [name, setName] = useState(user?.name ?? "");
  const [nat, setNat] = useState("eng");
  const [leagueId, setLeagueId] = useState(LEAGUES[0].id);
  const [clubId, setClubId] = useState(LEAGUES[0].clubs[0].id);
  const [loading, setLoading] = useState(false);

  // Custom club fields
  const [clubName, setClubName] = useState("");
  const [shortName, setShortName] = useState("");
  const [customNat, setCustomNat] = useState("eng");
  const [colors, setColors] = useState(COLOR_PRESETS[0]);
  const [stadiumName, setStadiumName] = useState("");
  const [capacity, setCapacity] = useState(12000);
  const [tier, setTier] = useState(3);
  const [academy, setAcademy] = useState(1);
  const [board, setBoard] = useState(55);

  const league = LEAGUES.find((l) => l.id === leagueId) ?? LEAGUES[0];
  const weakestClub = useMemo(
    () => [...league.clubs].sort((a, b) => b.tier - a.tier)[0],
    [league],
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const start = async (opts: { custom?: boolean }) => {
    if (opts.custom) {
      if (!clubName.trim() || !shortName.trim()) {
        toast.error(t("cs.required"));
        return;
      }
    }
    setLoading(true);
    try {
      await createCareer({
        managerName: name.trim() || "Manager",
        managerNat: nat,
        clubId: opts.custom ? weakestClub.id : clubId,
        lang,
        custom: opts.custom
          ? {
              name: clubName.trim(),
              short: shortName.trim().toUpperCase().slice(0, 4),
              country: customNat,
              p1: colors.p1,
              p2: colors.p2,
              stadium: stadiumName.trim() || t("cs.defaultStadium"),
              capacity,
              tier,
              academy,
              board,
            }
          : undefined,
      });
      toast.success(t("cs.welcome", { club: opts.custom ? clubName.trim() : league.clubs.find((c) => c.id === clubId)?.name ?? "the club" }));
    } catch (e) {
      console.error(e);
      toast.error(t("cs.error"));
    } finally {
      setLoading(false);
    }
  };

  const shuffle = () => {
    const pool = league.clubs;
    setClubId(pool[Math.floor(Math.random() * pool.length)].id);
  };

  const modeCards: { id: Mode; icon: React.ReactNode; title: string; sub: string }[] = [
    { id: "standard", icon: <ShieldCheck className="size-5" />, title: t("cs.mode.standard"), sub: t("cs.mode.standardSub") },
    { id: "quick", icon: <Dices className="size-5" />, title: t("cs.mode.quick"), sub: t("cs.mode.quickSub") },
    { id: "custom", icon: <PencilRuler className="size-5" />, title: t("cs.mode.custom"), sub: t("cs.mode.customSub") },
  ];

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <BrandWordmark sub={t("cs.sub")} />
          <div className="flex items-center gap-3">
            <LangToggle />
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="size-4" />
              {t("hdr.signout")}
            </Button>
          </div>
        </header>

        <div className="mt-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            {t("cs.newCareer")}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("cs.takeJob")}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {t("cs.intro")}
          </p>
        </div>

        {/* Mode picker */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {modeCards.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                mode === m.id
                  ? "border-emerald-500/50 bg-emerald-500/[0.07]"
                  : "border-white/8 bg-card hover:border-white/20"
              }`}
            >
              <div className={`flex items-center gap-2 text-sm font-semibold tracking-tight ${mode === m.id ? "text-emerald-300" : "text-foreground"}`}>
                {m.icon}
                {m.title}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{m.sub}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Manager details */}
          <div className="space-y-5 rounded-2xl border border-white/8 bg-card p-6 h-fit">
            <div>
              <label htmlFor="manager-name" className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("cs.managerName")}
              </label>
              <Input
                id="manager-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("cs.yourName")}
                className="mt-2"
                maxLength={24}
              />
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("cs.nationality")}
              </span>
              <Select value={nat} onValueChange={setNat}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_COUNTRIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="inline-flex items-center gap-2">
                        <Flag nat={c.id} /> {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="mt-2 w-full rounded-xl"
              size="lg"
              onClick={() => start({ custom: mode === "custom" })}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("cs.signingIn")}
                </>
              ) : (
                <>
                  {mode === "custom" ? <PencilRuler className="size-4" /> : <ShieldCheck className="size-4" />}
                  {mode === "custom" ? t("cs.startCustom") : t("cs.startCareer")}
                </>
              )}
            </Button>
          </div>

          {/* Right panel */}
          {mode === "custom" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/8 bg-card p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("cs.customIntro")}{" "}
                  <span className="text-foreground">
                    {t("cs.customTakesSlot", { club: weakestClub.name })}
                  </span>
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-card p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                    {t("cs.identity")}
                  </p>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("cs.clubName")}
                    </label>
                    <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="mt-2" maxLength={28} placeholder="FC Northbridge" />
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("cs.shortName")}
                    </label>
                    <Input value={shortName} onChange={(e) => setShortName(e.target.value)} className="mt-2" maxLength={4} placeholder="NBR" />
                  </div>
                  <div className="mt-4">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("cs.colors")}
                    </span>
                    <div className="mt-2.5 flex flex-wrap gap-2.5">
                      {COLOR_PRESETS.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setColors(c)}
                          aria-label={`${c.p1} / ${c.p2}`}
                          className={`size-9 rounded-xl ring-2 transition-all ${
                            colors.p1 === c.p1 && colors.p2 === c.p2
                              ? "ring-emerald-400 scale-105"
                              : "ring-white/10 hover:ring-white/30"
                          }`}
                          style={{ background: c.p1, color: c.p2 }}
                        >
                          <span className="flex size-full items-center justify-center text-[10px] font-black">
                            {shortName.trim() ? shortName.trim().toUpperCase().slice(0, 2) : "FC"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-card p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                    {t("cs.home")}
                  </p>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("cs.customCountry")}
                    </label>
                    <Select value={customNat} onValueChange={setCustomNat}>
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_COUNTRIES.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="inline-flex items-center gap-2">
                              <Flag nat={c.id} /> {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("cs.stadiumName")}
                    </label>
                    <Input value={stadiumName} onChange={(e) => setStadiumName(e.target.value)} className="mt-2" maxLength={32} placeholder={t("cs.defaultStadium")} />
                  </div>
                  <div className="mt-4">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("cs.capacity")}
                    </span>
                    <Select value={String(capacity)} onValueChange={(v) => setCapacity(Number(v))}>
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAPACITIES.map((c) => (
                          <SelectItem key={c} value={String(c)}>
                            {c.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-card p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                    {t("cs.squad")}
                  </p>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("cs.squadStrength")}
                    </span>
                    <Select value={String(tier)} onValueChange={(v) => setTier(Number(v))}>
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((x) => (
                          <SelectItem key={x} value={String(x)}>
                            {t(`cs.tierOpt${x}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("cs.academy")}
                    </span>
                    <Select value={String(academy)} onValueChange={(v) => setAcademy(Number(v))}>
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3].map((x) => (
                          <SelectItem key={x} value={String(x)}>
                            {t(`cs.academyOpt${x}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("cs.boardExpect")}
                    </span>
                    <Select value={String(board)} onValueChange={(v) => setBoard(Number(v))}>
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          { v: 45, k: "boardOpt1" },
                          { v: 55, k: "boardOpt2" },
                          { v: 65, k: "boardOpt3" },
                          { v: 75, k: "boardOpt4" },
                        ].map((o) => (
                          <SelectItem key={o.v} value={String(o.v)}>
                            {t(`cs.${o.k}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t("cs.budgetPreview")}
                    </div>
                    <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                      €{(TIER_BUDGETS[tier - 1] / 1_000_000).toFixed(0)}M
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-card p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                    {t("cs.preview")}
                  </p>
                  <div className="flex items-center gap-4">
                    <Crest
                      club={{ id: "custom-preview", name: clubName || "Your Club", short: shortName || "FC", league: league.id, country: customNat, p1: colors.p1, p2: colors.p2, stadium: stadiumName || "", tier }}
                      size={64}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold tracking-tight">
                        {clubName || t("cs.yourClub")}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        <Flag nat={customNat} /> {t("cs.previewLine", { league: league.name, stadium: stadiumName || t("cs.defaultStadium"), cap: capacity.toLocaleString() })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  {t("cs.chooseClub", { flag: league.flag, league: league.name })}
                </p>
                <div className="flex items-center gap-3">
                  {mode === "quick" && (
                    <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={shuffle}>
                      <Dices className="size-4" />
                      {t("cs.shuffle")}
                    </Button>
                  )}
                  <Select value={leagueId} onValueChange={(v) => {
                    setLeagueId(v);
                    const l = LEAGUES.find((x) => x.id === v)!;
                    setClubId(l.clubs[0].id);
                  }}>
                    <SelectTrigger className="w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAGUES.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          <span className="inline-flex items-center gap-2">
                            <Flag nat={l.countryId} /> {l.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {league.clubs.map((club) => {
                  const selected = club.id === clubId;
                  return (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => setClubId(club.id)}
                      className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? "border-emerald-500/50 bg-emerald-500/[0.07]"
                          : "border-white/8 bg-card hover:border-white/20"
                      }`}
                    >
                      <Crest club={club} size={46} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold tracking-tight">
                          {club.name}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {t("cs.clubTier", { stadium: club.stadium, tier: club.tier })}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {mode === "quick" && (
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {t("cs.quickHint")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
