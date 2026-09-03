import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from "@/features/account/useSession";
import { generateStoryMap } from "@/shared/chess/mapGenerator";
import type { StoryNode } from "./storyModeMapData";
import { OdysseyApiService, type OdysseySlotSummary } from "./api/odysseyApi";
import { toRunStateFields } from "./api/odysseyMapConverter";

export type RelicType = 'undo' | 'hint' | 'evalBar' | 'time' | 'reroll';

export const MAX_RELIC_CHARGES = 5;

export interface RunState {
  coins: number;
  
  // Inventory of equipped relics (max 5 slots)
  relics: RelicType[];
  
  undoCharges: number;
  hintCharges: number;
  evalBarCharges: number;
  timeCharges: number;
  rerollCharges: number;

  completedNodes: number[];
  currentNodeId: number;
  journeyComplete: boolean;
  mapNodes: StoryNode[];
  
  playtimeSeconds: number;
  lastUpdated: string | null;
}

const defaultState: RunState = {
  coins: 50,
  relics: [], // Empty inventory to start
  undoCharges: 0,
  hintCharges: 0,
  evalBarCharges: 0,
  timeCharges: 0,
  rerollCharges: 0,

  completedNodes: [],
  currentNodeId: -1,
  journeyComplete: false,
  mapNodes: [],
  
  playtimeSeconds: 0,
  lastUpdated: null,
};

import type { ProfileState } from './TitleScreen/SaveProfileScreen';

interface StoryModeContextType {
  runState: RunState;
  updateRunState: (updates: Partial<RunState> | ((prev: RunState) => Partial<RunState>)) => void;
  resetRun: (keepProgress?: boolean) => void;
  addCoins: (amount: number) => void;
  useCharge: (type: RelicType) => boolean;
  activeSlot: number;
  setActiveSlot: (slot: number) => void;
  getAllProfiles: () => ProfileState[];
  deleteProfile: (slotId: number) => void;
  beginNewRun: () => Promise<void>;
}

const StoryModeContext = createContext<StoryModeContextType | undefined>(undefined);

const getSlotKey = (userId: string, slotId: number) => `storyRunState_${userId}_slot_${slotId}`;

export function StoryModeProvider({ children }: { children: React.ReactNode }) {
  const { session, status } = useSession();
  const [activeSlot, setActiveSlot] = useState<number>(1);
  const [runState, setRunState] = useState<RunState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  // Backend progress summaries for every slot — used by getAllProfiles() for the
  // *inactive* slots in the picker (the active slot's own progress always comes
  // from the live runState above, already backend-sourced by the load effect).
  const [slotSummaries, setSlotSummaries] = useState<OdysseySlotSummary[]>([]);

  const refreshSlotSummaries = React.useCallback(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    OdysseyApiService.getAllSlots().then(summaries => {
      if (summaries) setSlotSummaries(summaries);
    });
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setSlotSummaries([]);
      return;
    }
    refreshSlotSummaries();
  }, [status, session?.user?.id, refreshSlotSummaries]);

  // Load state when slot or user changes. Local parsing/generation is defined
  // once here (readLocal) so both the backend-first authenticated path and
  // its fallback can share the exact same "parse localStorage, or generate a
  // fresh map" logic that used to be the only path.
  useEffect(() => {
    if (status === 'loading') return;

    const readLocal = (userId: string): RunState => {
      const stored = localStorage.getItem(getSlotKey(userId, activeSlot));
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const loadedNodes = parsed.mapNodes && parsed.mapNodes.length > 0 ? parsed.mapNodes : generateStoryMap();
          return { ...defaultState, ...parsed, relics: parsed.relics || [], mapNodes: loadedNodes };
        } catch (e) {
          console.error("Failed to parse run state", e);
        }
      }
      return { ...defaultState, mapNodes: generateStoryMap(), lastUpdated: new Date().toISOString() };
    };

    if (status === 'authenticated' && session?.user?.id) {
      const userId = session.user.id;
      let cancelled = false;

      (async () => {
        // The backend is the source of truth for gameplay state once a run exists there.
        // playtimeSeconds/lastUpdated are never synced to it (see toRunStateFields), so
        // those two always come from the local copy regardless of which branch wins below.
        const backendGame = await OdysseyApiService.getSlot(activeSlot);
        if (cancelled) return;

        const local = readLocal(userId);

        if (backendGame) {
          setRunState({
            ...defaultState,
            ...toRunStateFields(backendGame),
            playtimeSeconds: local.playtimeSeconds,
            lastUpdated: local.lastUpdated,
          });
        } else {
          setRunState(local);
        }
        setIsLoaded(true);
      })();

      return () => { cancelled = true; };
    } else {
      setRunState({ ...defaultState, mapNodes: generateStoryMap() });
      setIsLoaded(true);
    }
  }, [status, session?.user?.id, activeSlot]);

  // Save state when runState changes
  useEffect(() => {
    if (!isLoaded) return;
    if (status === 'authenticated' && session?.user?.id) {
      const updatedState = { ...runState, lastUpdated: new Date().toISOString() };
      localStorage.setItem(getSlotKey(session.user.id, activeSlot), JSON.stringify(updatedState));
    }
  }, [runState, status, session?.user?.id, isLoaded, activeSlot]);

  const updateRunState = React.useCallback((updates: Partial<RunState> | ((prev: RunState) => Partial<RunState>)) => {
    setRunState(prev => {
      const resolved = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...resolved };
    });
  }, []);

  const resetRun = (keepProgress: boolean = false) => {
    const newMap = generateStoryMap();
    if (keepProgress) {
      setRunState(prev => ({
        ...defaultState,
        coins: prev.coins,
        relics: prev.relics,
        undoCharges: prev.undoCharges,
        hintCharges: prev.hintCharges,
        evalBarCharges: prev.evalBarCharges,
        timeCharges: prev.timeCharges,
        rerollCharges: prev.rerollCharges,
        playtimeSeconds: prev.playtimeSeconds,
        lastUpdated: new Date().toISOString(),
        mapNodes: newMap,
      }));
    } else {
      setRunState({ ...defaultState, mapNodes: newMap, lastUpdated: new Date().toISOString() });
      if (status === 'authenticated' && session?.user?.id) {
        localStorage.removeItem(getSlotKey(session.user.id, activeSlot));
      }
    }

    // Best-effort backend sync. The local state set above renders immediately;
    // once the backend's own post-reset state comes back, adopt it instead — the
    // player is always several screens away (title -> singleplayer -> map) by the
    // time this resolves, so swapping it in here doesn't disrupt anything on screen.
    if (status === 'authenticated' && session?.user?.id) {
      const slotId = activeSlot;
      OdysseyApiService.resetRun(slotId, keepProgress).then((game) => {
        if (game) {
          updateRunState(toRunStateFields(game));
        }
        refreshSlotSummaries();
      });
    }
  };

  const deleteProfile = (slotId: number) => {
    if (status === 'authenticated' && session?.user?.id) {
      localStorage.removeItem(getSlotKey(session.user.id, slotId));
      localStorage.removeItem(`storyProgress_${session.user.id}_slot_${slotId}`);
      if (slotId === activeSlot) {
        setRunState({ ...defaultState, mapNodes: generateStoryMap(), lastUpdated: new Date().toISOString() });
      }
      OdysseyApiService.deleteSlot(slotId).then(() => refreshSlotSummaries());
    }
  };

  /**
   * Syncs the moment a new run actually begins (Strategist screen
   * confirmed): creates the backend run only if this slot doesn't already
   * have one there — a New Game+ reset already updated the existing
   * backend row via resetRun() above, and calling startNewRun again here
   * would wipe the coins/relics it just preserved. Awaited by the caller
   * before it navigates to the map, so the backend's authoritative map
   * (adopted into mapNodes below) is in place before the player can click
   * anything on it — see the "frontend adopts backend's map" decision.
   */
  const beginNewRun = async () => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    const slotId = activeSlot;
    const existing = await OdysseyApiService.slotExists(slotId);
    if (!existing) {
      const game = await OdysseyApiService.startNewRun(slotId);
      if (!game) return;
      updateRunState(toRunStateFields(game));
      refreshSlotSummaries();
    }
    OdysseyApiService.selectCharacter(slotId, 'strategist');
  };

  const addCoins = (amount: number) => {
    setRunState(prev => ({ ...prev, coins: Math.max(0, prev.coins + amount) }));
  };

  // A relic stays in the owned inventory (relics[]) once acquired, even once its charges hit
  // 0 — it's still equipped/refillable via Rest/Merchant. Only an explicit sell removes it.
  // Matches the backend model exactly: OdysseyRelic.consume() only ever decrements charges;
  // only OdysseyGame.removeRelic() (Merchant.sell) takes it out of the inventory.
  const useCharge = (type: RelicType) => {
    const chargeKey = `${type}Charges` as keyof RunState;
    const current = runState[chargeKey] as number;
    if (current > 0) {
      setRunState(prev => ({
        ...prev,
        [chargeKey]: current - 1,
      }));
      return true;
    }
    return false;
  };

  const getAllProfiles = (): ProfileState[] => {
    const formatPlaytime = (secs: number) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatDate = (isoString: string | null) => {
      if (!isoString) return null;
      try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) {
          return isoString;
        }
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
      } catch (e) {
        return isoString;
      }
    };

    const slots = [1, 2, 3];
    const icons: ('blue' | 'green' | 'red')[] = ['blue', 'green', 'red']; // Slot 1: blue, 2: green, 3: red

    return slots.map((slot, index) => {
      let playtimeSeconds = 0;
      let updated = null;
      let progress = 0;
      
      // If looking at the currently active slot, return live data from state
      if (slot === activeSlot && isLoaded) {
        playtimeSeconds = runState.playtimeSeconds || 0;
        updated = runState.lastUpdated || null;
        if (runState.journeyComplete) {
          progress = 100;
        } else {
          progress = Math.round(((runState.completedNodes?.length || 0) / 16) * 100);
        }
      } else if (status === 'authenticated' && session?.user?.id) {
        // Inactive slots: prefer the backend's summary (the source of truth for
        // any slot this browser hasn't loaded locally), falling back to
        // localStorage only if the backend has nothing for this slot.
        const summary = slotSummaries.find(s => s.slotId === slot);
        if (summary) {
          playtimeSeconds = summary.playtimeSeconds || 0;
          updated = summary.updatedAt || null;
          progress = summary.progressPercent || 0;
        } else {
          const stored = localStorage.getItem(getSlotKey(session.user.id, slot));
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              playtimeSeconds = parsed.playtimeSeconds || 0;
              updated = parsed.lastUpdated || null;
              if (parsed.journeyComplete) {
                progress = 100;
              } else {
                progress = Math.round(((parsed.completedNodes?.length || 0) / 16) * 100);
              }
            } catch (e) {}
          }
        }
      }

      return {
        id: slot,
        playtime: playtimeSeconds > 0 ? formatPlaytime(playtimeSeconds) : null,
        updated: formatDate(updated),
        progress: Math.min(100, Math.max(0, progress)),
        icon: icons[index],
        title: `Save Profile ${slot}`
      };
    });
  };

  return (
    <StoryModeContext.Provider value={{ runState, updateRunState, resetRun, addCoins, useCharge, activeSlot, setActiveSlot, getAllProfiles, deleteProfile, beginNewRun }}>
      {children}
    </StoryModeContext.Provider>
  );
}

export function useStoryModeRun() {
  const context = useContext(StoryModeContext);
  if (context === undefined) {
    throw new Error('useStoryModeRun must be used within a StoryModeProvider');
  }
  return context;
}
