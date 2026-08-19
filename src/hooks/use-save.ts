import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

/** Reactive access to the user's career save plus all game mutations. */
export function useSave() {
  const save = useQuery(api.saves.mySave);

  const createCareer = useMutation(api.saves.createCareer);
  const advanceWeek = useMutation(api.saves.advanceWeek);
  const skipToNextMatch = useMutation(api.saves.skipToNextMatch);
  const finishMatch = useMutation(api.saves.finishMatch);
  const setTactics = useMutation(api.saves.setTactics);
  const setTraining = useMutation(api.saves.setTraining);
  const buyPlayer = useMutation(api.saves.buyPlayer);
  const transferListPlayer = useMutation(api.saves.transferListPlayer);
  const unlistPlayer = useMutation(api.saves.unlistPlayer);
  const acceptOffer = useMutation(api.saves.acceptOffer);
  const rejectOffer = useMutation(api.saves.rejectOffer);
  const upgradeStadium = useMutation(api.saves.upgradeStadium);
  const upgradeSponsor = useMutation(api.saves.upgradeSponsor);
  const promoteYouth = useMutation(api.saves.promoteYouth);
  const releaseYouth = useMutation(api.saves.releaseYouth);
  const interactPlayer = useMutation(api.saves.interactPlayer);
  const dispatchScout = useMutation(api.saves.dispatchScout);
  const startNextSeason = useMutation(api.saves.startNextSeason);

  return {
    save,
    isLoading: save === undefined,
    createCareer,
    advanceWeek,
    skipToNextMatch,
    finishMatch,
    setTactics,
    setTraining,
    buyPlayer,
    transferListPlayer,
    unlistPlayer,
    acceptOffer,
    rejectOffer,
    upgradeStadium,
    upgradeSponsor,
    promoteYouth,
    releaseYouth,
    interactPlayer,
    dispatchScout,
    startNextSeason,
  };
}
