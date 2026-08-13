import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from '../../hooks/useSession';

export type RelicType = 'undo' | 'hint' | 'evalBar' | 'time' | 'reroll';

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
          setRunState({ ...defaultState, ...parsed, relics: parsed.relics || [] });
        } catch (e) {
          console.error("Failed to parse run state", e);
        }
      }
    } else {
      setRunState(defaultState);
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
      }));
    } else {
      setRunState(defaultState);
      if (status === 'authenticated' && session?.user?.id) {
        localStorage.removeItem(`storyRunState_${session.user.id}`);
      }
    }
  };

  const addCoins = (amount: number) => {
    setRunState(prev => ({ ...prev, coins: Math.max(0, prev.coins + amount) }));
  };

  const useCharge = (type: RelicType) => {
    let used = false;
    setRunState(prev => {
      const chargeKey = `${type}Charges` as keyof RunState;
      const current = prev[chargeKey] as number;
      if (current > 0) {
        used = true;
        return { ...prev, [chargeKey]: current - 1 };
      }
      return prev;
    });
    return used;
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
