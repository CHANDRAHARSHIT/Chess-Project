import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from "@/hooks/account-useSession";
import { generateStoryMap } from "@/utils/chess-mapGenerator";
import type { StoryNode } from "@/data/storymode-storyModeMapData";

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

import type { ProfileState } from '@/components/storymode-SaveProfileScreen';

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
}

const StoryModeContext = createContext<StoryModeContextType | undefined>(undefined);

const getSlotKey = (userId: string, slotId: number) => `storyRunState_${userId}_slot_${slotId}`;

export function StoryModeProvider({ children }: { children: React.ReactNode }) {
  const { session, status } = useSession();
  const [activeSlot, setActiveSlot] = useState<number>(1);
  const [runState, setRunState] = useState<RunState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state when slot or user changes
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'authenticated' && session?.user?.id) {
      const stored = localStorage.getItem(getSlotKey(session.user.id, activeSlot));
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const loadedNodes = parsed.mapNodes && parsed.mapNodes.length > 0 ? parsed.mapNodes : generateStoryMap();
          setRunState({ ...defaultState, ...parsed, relics: parsed.relics || [], mapNodes: loadedNodes });
        } catch (e) {
          console.error("Failed to parse run state", e);
          setRunState({ ...defaultState, mapNodes: generateStoryMap(), lastUpdated: new Date().toISOString() });
        }
      } else {
        setRunState({ ...defaultState, mapNodes: generateStoryMap(), lastUpdated: new Date().toISOString() });
      }
    } else {
      setRunState({ ...defaultState, mapNodes: generateStoryMap() });
    }
    setIsLoaded(true);
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
  };

  const deleteProfile = (slotId: number) => {
    if (status === 'authenticated' && session?.user?.id) {
      localStorage.removeItem(getSlotKey(session.user.id, slotId));
      localStorage.removeItem(`storyProgress_${session.user.id}_slot_${slotId}`);
      if (slotId === activeSlot) {
        setRunState({ ...defaultState, mapNodes: generateStoryMap(), lastUpdated: new Date().toISOString() });
      }
    }
  };

  const addCoins = (amount: number) => {
    setRunState(prev => ({ ...prev, coins: Math.max(0, prev.coins + amount) }));
  };

  const useCharge = (type: RelicType) => {
    const chargeKey = `${type}Charges` as keyof RunState;
    const current = runState[chargeKey] as number;
    if (current > 0) {
      setRunState(prev => {
        const newRelics = [...prev.relics];
        const idx = newRelics.indexOf(type);
        if (idx > -1) {
          newRelics.splice(idx, 1);
        }
        return {
          ...prev,
          [chargeKey]: current - 1,
          relics: newRelics
        };
      });
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
        // Read from localstorage for inactive slots
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
    <StoryModeContext.Provider value={{ runState, updateRunState, resetRun, addCoins, useCharge, activeSlot, setActiveSlot, getAllProfiles, deleteProfile }}>
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
