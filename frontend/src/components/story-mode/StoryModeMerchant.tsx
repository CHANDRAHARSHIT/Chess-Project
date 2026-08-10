import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Coins, ArrowRight, RotateCcw, Package, ShoppingBag, Sparkles } from "lucide-react";
import { useStoryModeRun } from "./StoryModeContext";

interface StoryModeMerchantProps {
  onComplete: () => void;
  onRetreat: () => void;
}

type ShopItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'upgrade_hint' | 'upgrade_time' | 'upgrade_eval' | 'max_undo' | 'max_time' | 'max_eval' | 'max_hint' | 'restore_reroll' | 'restore_time' | 'restore_undo' | 'restore_hint' | 'restore_eval';
  value?: number;
};

export default function StoryModeMerchant({
  onComplete,
  onRetreat,
}: StoryModeMerchantProps) {
  const { runState, updateRunState, addCoins, useCharge } = useStoryModeRun();
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());

  // Generate available pool based on current state
  const availablePool = useMemo(() => {
    const pool: ShopItem[] = [];
    // Dynamic base pricing variance (e.g., +/- 5 coins)
    const v = (base: number) => Math.max(5, base + Math.floor(Math.random() * 11) - 5);

    if (runState.hintStrength < 3200) {
      pool.push({
        id: 'upgrade_hint',
        name: 'Engine Upgrade',
        description: `Upgrade Best Move engine from ${runState.hintStrength} to ${runState.hintStrength === 2000 ? 2500 : 3200} ELO.`,
        cost: v(50),
        type: 'upgrade_hint'
      });
    }
    
    if (runState.timeTier !== 'gold') {
      pool.push({
        id: 'upgrade_time',
        name: 'Time Crystal Upgrade',
        description: `Upgrade Time charges to ${runState.timeTier === 'bronze' ? 'Silver (Double Time)' : 'Gold (Infinite)'}.`,
        cost: v(40),
        type: 'upgrade_time'
      });
    }

    if (runState.evalBarTier !== 'gold') {
      pool.push({
        id: 'upgrade_eval',
        name: 'Eval Lens Upgrade',
        description: `Upgrade Eval charges to ${runState.evalBarTier === 'bronze' ? 'Silver (10 moves)' : 'Gold (Infinite moves)'}.`,
        cost: v(40),
        type: 'upgrade_eval'
      });
    }

    // Max Charge Upgrades
    pool.push({ id: `max_undo_${Math.random()}`, name: 'Relic: Chrono Gear', description: 'Increases Max Undo Charges by +1.', cost: v(60), type: 'max_undo' });
    pool.push({ id: `max_time_${Math.random()}`, name: 'Relic: Haste Boots', description: 'Increases Max Time Charges by +1.', cost: v(60), type: 'max_time' });
    pool.push({ id: `max_eval_${Math.random()}`, name: 'Relic: True Sight', description: 'Increases Max Eval Charges by +1.', cost: v(60), type: 'max_eval' });
    pool.push({ id: `max_hint_${Math.random()}`, name: 'Relic: Oracle Bone', description: 'Increases Max Hint Charges by +1.', cost: v(60), type: 'max_hint' });

    // Consumables (Restore Charges)
    if (runState.rerollCharges < runState.maxRerollCharges) {
      pool.push({ id: `rest_reroll_${Math.random()}`, name: 'Fate Token', description: 'Restores 1 Reroll charge.', cost: v(15), type: 'restore_reroll', value: 1 });
      if (runState.maxRerollCharges - runState.rerollCharges >= 2) {
        pool.push({ id: `rest_reroll2_${Math.random()}`, name: 'Destiny Coin', description: 'Restores 2 Reroll charges.', cost: v(25), type: 'restore_reroll', value: 2 });
      }
    }
    if (runState.timeCharges < runState.maxTimeCharges) {
      pool.push({ id: `rest_time_${Math.random()}`, name: 'Hourglass Dust', description: 'Restores 1 Time charge.', cost: v(15), type: 'restore_time', value: 1 });
    }
    if (runState.undoCharges < runState.maxUndoCharges) {
      pool.push({ id: `rest_undo_${Math.random()}`, name: 'Rewind Spring', description: 'Restores 1 Undo charge.', cost: v(15), type: 'restore_undo', value: 1 });
    }
    if (runState.hintCharges < runState.maxHintCharges) {
      pool.push({ id: `rest_hint_${Math.random()}`, name: 'Whispering Gem', description: 'Restores 1 Best Move charge.', cost: v(15), type: 'restore_hint', value: 1 });
    }
    if (runState.evalBarCharges < runState.maxEvalBarCharges) {
      pool.push({ id: `rest_eval_${Math.random()}`, name: 'Focus Prism', description: 'Restores 1 Eval Bar charge.', cost: v(15), type: 'restore_eval', value: 1 });
    }

    return pool;
  }, [runState]);

  // State to hold current random offerings
  const [offerings, setOfferings] = useState<ShopItem[]>(() => getRandomOfferings(availablePool, 3));

  function getRandomOfferings(pool: ShopItem[], count: number) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  const handleReroll = () => {
    if (runState.rerollCharges > 0) {
      const used = useCharge('reroll');
      if (used) {
        setOfferings(getRandomOfferings(availablePool, 3));
        setPurchasedIds(new Set());
      }
    }
  };

  const handlePurchase = (item: ShopItem) => {
    if (runState.coins >= item.cost) {
      // Deduct coins
      updateRunState({ coins: runState.coins - item.cost });
      setPurchasedIds(prev => new Set([...prev, item.id]));

      // Apply effect
      switch(item.type) {
        case 'upgrade_hint':
          updateRunState({ hintStrength: runState.hintStrength === 2000 ? 2500 : 3200 });
          break;
        case 'upgrade_time':
          updateRunState({ timeTier: runState.timeTier === 'bronze' ? 'silver' : 'gold' });
          break;
        case 'upgrade_eval':
          updateRunState({ evalBarTier: runState.evalBarTier === 'bronze' ? 'silver' : 'gold' });
          break;
        case 'max_undo':
          updateRunState({ maxUndoCharges: runState.maxUndoCharges + 1 });
          break;
        case 'max_time':
          updateRunState({ maxTimeCharges: runState.maxTimeCharges + 1 });
          break;
        case 'max_eval':
          updateRunState({ maxEvalBarCharges: runState.maxEvalBarCharges + 1 });
          break;
        case 'max_hint':
          updateRunState({ maxHintCharges: runState.maxHintCharges + 1 });
          break;
        case 'restore_reroll':
          updateRunState({ rerollCharges: Math.min(runState.maxRerollCharges, runState.rerollCharges + (item.value || 1)) });
          break;
        case 'restore_time':
          updateRunState({ timeCharges: Math.min(runState.maxTimeCharges, runState.timeCharges + (item.value || 1)) });
          break;
        case 'restore_undo':
          updateRunState({ undoCharges: Math.min(runState.maxUndoCharges, runState.undoCharges + (item.value || 1)) });
          break;
        case 'restore_hint':
          updateRunState({ hintCharges: Math.min(runState.maxHintCharges, runState.hintCharges + (item.value || 1)) });
          break;
        case 'restore_eval':
          updateRunState({ evalBarCharges: Math.min(runState.maxEvalBarCharges, runState.evalBarCharges + (item.value || 1)) });
          break;
      }
    }
  };

  const handleSell = () => {
    // Placeholder for selling relics
    addCoins(10);
  };

  return (
    <motion.div
      className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[800px] h-[500px] bg-gradient-to-t from-yellow-500/10 via-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0"
      />

      <motion.div
        className="relative z-10 max-w-2xl w-full flex flex-col items-center gap-6 py-8 px-4 sm:px-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-md mx-auto shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <div className="flex items-center justify-between w-full border-b border-yellow-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-brand-text">Wandering Merchant</h2>
              <p className="text-xs text-brand-secondary">"Got some rare items on sale, stranger."</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 bg-yellow-500/20 px-3 py-1.5 rounded-lg border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-mono font-bold text-yellow-100">{runState.coins} Coins</span>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-semibold text-brand-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Wares for Sale
            </h3>
            
            <button 
              onClick={handleReroll}
              disabled={runState.rerollCharges <= 0}
              className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded bg-brand-surface/50 border border-brand-border/50 text-brand-secondary hover:text-brand-text hover:border-brand-accent/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reroll ({runState.rerollCharges}/{runState.maxRerollCharges})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {offerings.map(item => {
              const isPurchased = purchasedIds.has(item.id);
              const canAfford = runState.coins >= item.cost;
              
              return (
                <div 
                  key={item.id} 
                  className={`flex flex-col gap-2 p-3 rounded-xl border ${isPurchased ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10'} transition-all`}
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-yellow-200 mb-1 leading-tight">{item.name}</h4>
                    <p className="text-xs text-brand-secondary leading-snug">{item.description}</p>
                  </div>
                  
                  {isPurchased ? (
                    <div className="text-xs font-mono font-bold text-green-400 text-center py-1.5 bg-green-500/10 rounded">
                      Purchased
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford}
                      className={`flex items-center justify-center gap-1.5 w-full py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        canAfford 
                          ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/40' 
                          : 'bg-brand-surface text-brand-secondary border border-brand-border/40 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3 h-3" />
                      {item.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full flex justify-between items-center pt-4 border-t border-brand-border/30 mt-2">
          <button
            onClick={handleSell}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all text-xs font-medium cursor-pointer"
          >
            <Package className="w-3 h-3" />
            Sell Junk (+10 Coins)
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onRetreat}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border/60 text-brand-secondary hover:text-brand-text hover:border-brand-accent/40 transition-all text-xs font-medium cursor-pointer"
            >
              Leave
            </button>
            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 hover:border-green-500/60 transition-all text-sm font-medium cursor-pointer"
            >
              Continue Journey
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DEV Only: Skip Button */}
        {(import.meta.env.DEV && import.meta.env.VITE_ENABLE_STORY_DEV_TOOLS !== 'false') && (
          <div className="mt-4 p-2 rounded border border-dashed border-yellow-500/50 bg-yellow-500/10 flex justify-center opacity-80 hover:opacity-100 transition-opacity w-full">
            <span className="text-[10px] text-yellow-500 font-mono self-center mr-2">DEV:</span>
            <button onClick={onComplete} className="px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-[10px] font-mono hover:bg-green-500/40 cursor-pointer">Skip Merchant</button>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
}
