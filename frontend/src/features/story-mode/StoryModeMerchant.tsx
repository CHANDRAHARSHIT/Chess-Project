import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Coins, ArrowRight, RotateCcw, Package, ShoppingBag, Sparkles } from "lucide-react";
import { useStoryModeRun, MAX_RELIC_CHARGES } from "./StoryModeContext";
import type { RelicType } from "./StoryModeContext";

interface StoryModeMerchantProps {
  onComplete: () => void;

}

type ShopItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: RelicType;
};

export default function StoryModeMerchant({
  onComplete,
}: StoryModeMerchantProps) {
  const { runState, updateRunState, useCharge } = useStoryModeRun();
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isRerolling, setIsRerolling] = useState(false);

  const handleQuantityChange = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  const relicData = [
    { type: 'undo' as RelicType, name: 'Relic of Undo', description: '+1 to max Undos.' },
    { type: 'hint' as RelicType, name: 'Relic of Oracle', description: '+1 to max Hints.' },
    { type: 'evalBar' as RelicType, name: 'Relic of Truth', description: '+1 to max Eval Bars.' },
    { type: 'time' as RelicType, name: 'Relic of Haste', description: '+1 to max Time uses.' },
    { type: 'reroll' as RelicType, name: 'Moirai\'s Thread', description: '+1 to max Rerolls.' },
  ];

  // Generate available pool based on current state
  const availablePool = useMemo(() => {
    const pool: ShopItem[] = [];
    const v = (base: number) => Math.max(5, base + Math.floor(Math.random() * 11) - 5);

    relicData.forEach(r => {
      pool.push({
        id: `${r.type}_${Math.random()}`,
        name: r.name,
        description: r.description,
        cost: v(20), // 20 base cost per charge
        type: r.type,
      });
    });

    return pool;
  }, []);

  // State to hold current random offerings
  const [offerings, setOfferings] = useState<ShopItem[]>(() => getRandomOfferings(availablePool, 3));

  function getRandomOfferings(pool: ShopItem[], count: number) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  const handleReroll = () => {
    if (runState.rerollCharges > 0 && !isRerolling) {
      setIsRerolling(true);
      
      // Delay to let items fade out
      setTimeout(() => {
        const used = useCharge('reroll');
        if (used) {
          setOfferings(getRandomOfferings(availablePool, 3));
          setPurchasedIds(new Set());
          setQuantities({});
        }
        
        // Wait a tiny bit before fading new items in
        setTimeout(() => setIsRerolling(false), 50);
      }, 400);
    }
  };

  const handlePurchase = (item: ShopItem) => {
    const qty = quantities[item.id] || 1;
    const currentCharges = (runState[`${item.type}Charges`] as number) || 0;
    
    // Prevent exceeding max charges (5)
    const actualQty = Math.min(qty, MAX_RELIC_CHARGES - currentCharges);
    if (actualQty <= 0) return;

    const totalCost = item.cost * actualQty;
    
    if (runState.coins >= totalCost) {
      if (!runState.relics.includes(item.type) && runState.relics.length >= MAX_SLOTS) {
        return; // No slots available for a new relic
      }
      
      const newRelics = runState.relics.includes(item.type) 
        ? runState.relics 
        : [...runState.relics, item.type];
      
      updateRunState({ 
        coins: runState.coins - totalCost,
        relics: newRelics,
        [`${item.type}Charges`]: currentCharges + actualQty
      });
      setPurchasedIds(prev => new Set([...prev, item.id]));
    }
  };

  const handleSell = (type: RelicType) => {
    const sellPrice = 25; // fixed sell price
    const newRelics = [...runState.relics];
    const idx = newRelics.indexOf(type);
    if (idx > -1) {
      newRelics.splice(idx, 1);
    }
    
    const currentCharges = (runState[`${type}Charges`] as number) || 0;

    updateRunState({ 
      relics: newRelics, 
      coins: runState.coins + sellPrice,
      [`${type}Charges`]: Math.max(0, currentCharges - 1)
    });
  };

  const ownedRelics = runState.relics.map(type => relicData.find(r => r.type === type)).filter(Boolean) as typeof relicData;

  const MAX_SLOTS = 5;

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
            <div className="text-xs font-mono text-brand-secondary mt-1">
              Slots: {runState.relics.length} / {MAX_SLOTS}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full flex gap-2 border-b border-brand-border/30 pb-2">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-2 text-sm font-bold rounded-t-lg transition-all ${
              activeTab === 'buy' 
                ? 'bg-yellow-500/20 text-yellow-300 border-b-2 border-yellow-400' 
                : 'text-brand-secondary hover:text-brand-text'
            }`}
          >
            Buy Relics
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-2 text-sm font-bold rounded-t-lg transition-all ${
              activeTab === 'sell' 
                ? 'bg-yellow-500/20 text-yellow-300 border-b-2 border-yellow-400' 
                : 'text-brand-secondary hover:text-brand-text'
            }`}
          >
            Sell Relics
          </button>
        </div>

        <div className="w-full flex flex-col gap-4">
          {activeTab === 'buy' ? (
            <>
              <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-semibold text-brand-text flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" /> Wares for Sale
                </h3>
                
                <button 
                  onClick={handleReroll}
                  disabled={runState.rerollCharges <= 0 || isRerolling}
                  className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded bg-brand-surface/50 border border-brand-border/50 text-brand-secondary hover:text-brand-text hover:border-brand-accent/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reroll ({runState.rerollCharges}/{MAX_RELIC_CHARGES})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {offerings.map((item, idx) => {
                  const isPurchased = purchasedIds.has(item.id);
                  const qty = quantities[item.id] || 1;
                  const currentCharges = (runState[`${item.type}Charges`] as number) || 0;
                  const totalCost = item.cost * qty;
                  const canAfford = runState.coins >= totalCost;
                  const canAffordNext = runState.coins >= item.cost * (qty + 1);
                  const slotsFull = !runState.relics.includes(item.type) && runState.relics.length >= MAX_SLOTS;
                  const maxBuyable = MAX_RELIC_CHARGES - currentCharges;
                  const canBuy = canAfford && !slotsFull && !isPurchased && maxBuyable > 0;
                  
                  return (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={
                        isRerolling 
                          ? { opacity: 0, y: -40, scale: 0.8, filter: "blur(4px)" } 
                          : { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" }
                      }
                      transition={{ 
                        duration: 0.3,
                        delay: isRerolling ? idx * 0.05 : idx * 0.1
                      }}
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
                        <>
                          <div className="flex items-center justify-between bg-black/20 rounded p-1 mb-1 border border-brand-border/30">
                            <button 
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={qty <= 1}
                              className="w-6 h-6 flex items-center justify-center rounded bg-brand-surface hover:bg-brand-surface/80 text-brand-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-bold text-yellow-300">
                              {qty} {qty === 1 ? 'Use' : 'Uses'}
                            </span>
                            <button 
                              onClick={() => handleQuantityChange(item.id, 1)}
                              disabled={!canAffordNext || qty >= maxBuyable}
                              className="w-6 h-6 flex items-center justify-center rounded bg-brand-surface hover:bg-brand-surface/80 text-brand-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              +
                            </button>
                          </div>
                          
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={!canBuy}
                            className={`flex items-center justify-center gap-1.5 w-full py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                              canBuy 
                                ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/40' 
                                : 'bg-brand-surface text-brand-secondary border border-brand-border/40 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3 h-3" />
                            {maxBuyable === 0 ? "MAXED" : totalCost}
                          </button>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              {runState.relics.length >= MAX_SLOTS && (
                <p className="text-xs text-red-400 text-center mt-2">Your Relic Slots are full! Sell a relic to buy another.</p>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3 min-h-[160px]">
              <h3 className="text-sm font-semibold text-brand-text flex items-center gap-2 px-1">
                <Package className="w-4 h-4 text-yellow-400" /> Your Inventory ({runState.relics.length}/{MAX_SLOTS})
              </h3>
              
              {ownedRelics.length === 0 ? (
                <div className="flex items-center justify-center flex-1 text-sm text-brand-secondary border border-dashed border-brand-border/40 rounded-xl">
                  You have no relics to sell.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ownedRelics.map(relic => (
                    <div key={relic.type} className="flex items-center justify-between p-3 rounded-xl border border-brand-border/40 bg-brand-surface/30">
                      <div>
                        <h4 className="text-sm font-bold text-brand-text leading-tight">{relic.name}</h4>
                      </div>
                      <button
                        onClick={() => handleSell(relic.type)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-surface border border-brand-border text-xs font-mono font-bold text-brand-text hover:border-yellow-500/50 hover:text-yellow-400 transition-all cursor-pointer"
                      >
                        Sell <span className="text-green-400">+25</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onComplete}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl border border-brand-border text-brand-text hover:border-brand-accent hover:text-brand-accent transition-all cursor-pointer"
        >
          Leave Shop <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
