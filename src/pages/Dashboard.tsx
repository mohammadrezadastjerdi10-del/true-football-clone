import { BrandWordmark } from "@/components/BrandMark";
import { CareerStart } from "@/components/game/CareerStart";
import { ClubTab } from "@/components/game/ClubTab";
import { MatchView } from "@/components/game/MatchView";
import { OverviewTab } from "@/components/game/OverviewTab";
import { ScoutingTab } from "@/components/game/ScoutingTab";
import { SquadTab } from "@/components/game/SquadTab";
import { TacticsTab } from "@/components/game/TacticsTab";
import { TrainingTab } from "@/components/game/TrainingTab";
import { TransfersTab } from "@/components/game/TransfersTab";
import { Crest } from "@/components/game/shared";
import { Button } from "@/components/ui/button";
import { useSave } from "@/hooks/use-save";
import { useAuth } from "@/hooks/use-auth";
import { leagueById } from "@/lib/game/world";
import { clubDefOf } from "@/lib/game/sim";
import type { NextEvent } from "@/lib/game/types";
import { fmtMoney } from "@/lib/game/format";
import { LangToggle, num, useLang } from "@/lib/i18n";
import {
  ArrowLeftRight,
  Binoculars,
  Building2,
  Dumbbell,
  Home,
  Loader2,
  LogOut,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

type TabId = "overview" | "squad" | "tactics" | "training" | "scouting" | "transfers" | "club";

const TABS: { id: TabId; labelKey: string; icon: typeof Home }[] = [
  { id: "overview", labelKey: "nav.overview", icon: Home },
  { id: "squad", labelKey: "nav.squad", icon: Users },
  { id: "tactics", labelKey: "nav.tactics", icon: SlidersHorizontal },
  { id: "training", labelKey: "nav.training", icon: Dumbbell },
  { id: "scouting", labelKey: "nav.scouting", icon: Binoculars },
  { id: "transfers", labelKey: "nav.transfers", icon: ArrowLeftRight },
  { id: "club", labelKey: "nav.club", icon: Building2 },
];

export default function Dashboard() {
  const { save, isLoading } = useSave();
  const { signOut } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("overview");
  const [matchEv, setMatchEv] = useState<NextEvent | null>(null);
  const [restart, setRestart] = useState(false);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!save || restart) {
    return <CareerStart />;
  }

  const data = save.data;

  if (data.phase === "sacked") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-card p-8 text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <LogOut className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("sacked.title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("sacked.body", { club: clubDefOf(data, data.clubId).name })}
          </p>
          <Button className="mt-6 w-full rounded-xl" size="lg" onClick={() => setRestart(true)}>
            {t("sacked.newCareer")}
          </Button>
        </div>
      </main>
    );
  }

  const club = clubDefOf(data, data.clubId);
  const league = leagueById(data.clubId);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandWordmark markSize={30} />
            <span className="hidden h-5 w-px bg-white/10 sm:block" />
            <div className="hidden items-center gap-2.5 sm:flex">
              <Crest club={club} size={28} />
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight">{club.short}</p>
                <p className="text-[10px] text-muted-foreground">
                  {t("hdr.leagueLine", { league: league.name, label: data.label })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 md:flex">
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {t("hdr.week")}
              </span>
              <span className="font-mono text-sm font-bold tabular-nums">{num(lang, data.week)}</span>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5 sm:flex">
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-400/80">
                {t("hdr.budget")}
              </span>
              <span className={cn("font-mono text-sm font-bold tabular-nums", data.balance < 0 ? "text-red-400" : "text-emerald-300")}>
                {fmtMoney(data.balance)}
              </span>
            </div>
            <LangToggle />
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={handleSignOut} aria-label={t("hdr.signout")}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="sticky top-16 z-20 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-medium transition-colors",
                tab === tb.id
                  ? "border-emerald-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tb.icon className="size-4" />
              {t(tb.labelKey)}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {matchEv ? (
          <MatchView
            save={data}
            ev={matchEv}
            onClose={() => setMatchEv(null)}
          />
        ) : tab === "overview" ? (
          <OverviewTab save={data} onPlayMatch={setMatchEv} />
        ) : tab === "squad" ? (
          <SquadTab save={data} />
        ) : tab === "tactics" ? (
          <TacticsTab save={data} />
        ) : tab === "training" ? (
          <TrainingTab save={data} />
        ) : tab === "scouting" ? (
          <ScoutingTab save={data} />
        ) : tab === "transfers" ? (
          <TransfersTab save={data} />
        ) : (
          <ClubTab save={data} />
        )}
      </main>
    </div>
  );
}
