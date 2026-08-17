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
import { COUNTRIES, LEAGUES } from "@/lib/game/world";
import { LangToggle, useLang } from "@/lib/i18n";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export function CareerStart() {
  const { createCareer } = useSave();
  const { user, signOut } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [nat, setNat] = useState("eng");
  const [leagueId, setLeagueId] = useState(LEAGUES[0].id);
  const [clubId, setClubId] = useState(LEAGUES[0].clubs[0].id);
  const [loading, setLoading] = useState(false);

  const league = LEAGUES.find((l) => l.id === leagueId) ?? LEAGUES[0];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const submit = async () => {
    setLoading(true);
    try {
      await createCareer({
        managerName: name.trim() || "Manager",
        managerNat: nat,
        clubId,
        lang,
      });
      toast.success(t("cs.welcome", { club: league.clubs.find((c) => c.id === clubId)?.name ?? "the club" }));
    } catch (e) {
      console.error(e);
      toast.error(t("cs.error"));
    } finally {
      setLoading(false);
    }
  };

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

        <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
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
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="inline-flex items-center gap-2">
                        <Flag nat={c.id} /> {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("cs.league")}
              </span>
              <Select value={leagueId} onValueChange={(v) => {
                setLeagueId(v);
                const l = LEAGUES.find((x) => x.id === v)!;
                setClubId(l.clubs[0].id);
              }}>
                <SelectTrigger className="mt-2 w-full">
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
            <Button
              className="mt-2 w-full rounded-xl"
              size="lg"
              onClick={submit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("cs.signingIn")}
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  {t("cs.startCareer")}
                </>
              )}
            </Button>
          </div>

          {/* Club picker */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {t("cs.chooseClub", { flag: league.flag, league: league.name })}
            </p>
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
          </div>
        </div>
      </div>
    </main>
  );
}
