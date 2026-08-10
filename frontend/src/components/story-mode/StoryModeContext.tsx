import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from '../../hooks/useSession';

export type UpgradeTier = 'bronze' | 'silver' | 'gold';

export interface RunState {
  coins: number;
  xp: number;
  level: number;
  statPoints: number; // Earned on level up to increase max charges
  
  undoCharges: number;
  maxUndoCharges: number;
  
  hintCharges: number;
  maxHintCharges: number;
  hintStrength: number; // e.g. 2000, 2500, 3200
  
  evalBarCharges: number;
  maxEvalBarCharges: number;
  evalBarTier: UpgradeTier;
  
  timeCharges: number;
  maxTimeCharges: number;
  timeTier: UpgradeTier;
  
  rerollCharges: number;
  maxRerollCharges: number;

  completedNodes: number[];
  currentNodeId: number;
  journeyComplete: boolean;
}

const defaultState: RunState = {
  coins: 0,
  xp: 0,
  level: 1,
  statPoints: 0,

  // Start with 0 charges so players have to use Rest Site. Or 3?
  // "Assuming the player used everything before entering..." - let's start with 0 so the first rest site is useful.
  undoCharges: 0,
  maxUndoCharges: 3,

  hintCharges: 0,
  maxHintCharges: 3,
  hintStrength: 2000,

  evalBarCharges: 0,
  maxEvalBarCharges: 3,
  evalBarTier: 'bronze',

  timeCharges: 0,
  maxTimeCharges: 3,
  timeTier: 'bronze',

  rerollCharges: 0,
  maxRerollCharges: 3,

  completedNodes: [],
  currentNodeId: -1,
  journeyComplete: false,
};

interface StoryModeContextType {
  runState: RunState;
  updateRunState: (updates: Partial<RunState>) => void;
  resetRun: () => void;
  addCoins: (amount: number) => void;
  useCharge: (type: 'undo' | 'hint' | 'evalBar' | 'time' | 'reroll') => boolean;
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
          setRunState({ ...defaultState, ...parsed });
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

  const resetRun = () => {
    setRunState(defaultState);
    if (status === 'authenticated' && session?.user?.id) {
      localStorage.removeItem(`storyRunState_${session.user.id}`);
    }
  };

  const addCoins = (amount: number) => {
    setRunState(prev => ({ ...prev, coins: Math.max(0, prev.coins + amount) }));
  };

  const useCharge = (type: 'undo' | 'hint' | 'evalBar' | 'time' | 'reroll') => {
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
