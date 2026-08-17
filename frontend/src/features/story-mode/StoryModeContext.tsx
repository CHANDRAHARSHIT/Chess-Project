import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from "@/features/account/useSession";
import { generateStoryMap } from "@/shared/chess/mapGenerator";
import type { StoryNode } from "./storyModeMapData";

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
};

interface StoryModeContextType {
  runState: RunState;
  updateRunState: (updates: Partial<RunState>) => void;
  resetRun: (keepProgress?: boolean) => void;
  addCoins: (amount: number) => void;
  useCharge: (type: RelicType) => boolean;
}

const StoryModeContext = createContext<StoryModeContextType | undefined>(undefined);

export function StoryModeProvider({ children }: { children: React.ReactNode }) {
  const { session, status } = useSession();
  const [runState, setRunState] = useState<RunState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'authenticated' && session?.user?.id) {
      const stored = localStorage.getItem(`storyRunState_${session.user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const loadedNodes = parsed.mapNodes && parsed.mapNodes.length > 0 ? parsed.mapNodes : generateStoryMap();
          setRunState({ ...defaultState, ...parsed, relics: parsed.relics || [], mapNodes: loadedNodes });
        } catch (e) {
          console.error("Failed to parse run state", e);
          setRunState({ ...defaultState, mapNodes: generateStoryMap() });
        }
      } else {
        setRunState({ ...defaultState, mapNodes: generateStoryMap() });
      }
    } else {
      setRunState({ ...defaultState, mapNodes: generateStoryMap() });
    }
    setIsLoaded(true);
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (!isLoaded) return;
    if (status === 'authenticated' && session?.user?.id) {
      localStorage.setItem(`storyRunState_${session.user.id}`, JSON.stringify(runState));
    }
  }, [runState, status, session?.user?.id, isLoaded]);

  const updateRunState = (updates: Partial<RunState>) => {
    setRunState(prev => ({ ...prev, ...updates }));
  };

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
        mapNodes: newMap,
      }));
    } else {
      setRunState({ ...defaultState, mapNodes: newMap });
      if (status === 'authenticated' && session?.user?.id) {
        localStorage.removeItem(`storyRunState_${session.user.id}`);
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

  return (
    <StoryModeContext.Provider value={{ runState, updateRunState, resetRun, addCoins, useCharge }}>
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
