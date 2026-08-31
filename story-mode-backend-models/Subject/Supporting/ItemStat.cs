using NUnit.Framework;

/// <summary>
/// A helper class for managing the stats of an item.
/// </summary>
public class ItemStat
{
    /// <summary>
    /// Holds a copy of the definitions for the item's stats.
    /// While there is a copy in the effects, this enables easy access.
    /// </summary>
    public Dictionary<EStat, ValueDefinition> ItemStats { get; set; }

    /// <summary>
    /// Tracks the usage stats for the item.
    /// </summary>
    private readonly Dictionary<EStat, int> _usageTotals = new()
    {
        { EStat.TimesUsed, 0 },
    };

    /// <summary>
    /// The item which owns these stats.
    /// </summary>
    private Item Owner { get; init; }

    /// <summary>
    /// Holds a copy of the definitions for the item's stats.
    /// While there is a copy in the effects, this enables easy access.
    /// </summary>
    private readonly Dictionary<EStat, ValueDefinition> _originalItemStats;

    /// <summary>
    /// Constructor for the Stats class.
    /// </summary>
    /// <param name="owner"></param>
    /// <param name="stats"></param>
    public ItemStat(Item owner, Effect[] effects)
    {
        Owner = owner;
        ItemStats = GetItemStatsAndInitializeTotals(effects);
        SetupCommonStats();
        _originalItemStats = GetCopyOfItemStats();
        // Later, get a copy of the total as new ones may have been added.
    }

    private Dictionary<EStat, ValueDefinition> GetCopyOfItemStats()
    {
        Dictionary<EStat, ValueDefinition> copy = [];
        foreach (KeyValuePair<EStat, ValueDefinition> stat in ItemStats)
        {
            ValueDefinition valueDefinition = stat.Value;
            copy.Add(stat.Key, valueDefinition.Clone());
        }

        return copy;
    }

    /// <summary>
    /// Resets the stats of the item.
    /// </summary>
    public void Reset()
    {
        ItemStats = _originalItemStats;

        // Reset the usage totals.
        // Divyam, assign a copy of the total as new ones may have been added.
        foreach (KeyValuePair<EStat, int> stat in _usageTotals)
        {
            _usageTotals[stat.Key] = 0;
        }
    }

    /// <summary>
    /// Gets the item stats from the effects and initializes the usage totals.
    /// </summary>
    /// <param name="effects"></param>
    /// <returns></returns>
    private Dictionary<EStat, ValueDefinition> GetItemStatsAndInitializeTotals(Effect[] effects)
    {
        Dictionary<EStat, ValueDefinition> itemStats = [];
        foreach (Effect effect in effects)
        {
            if (effect is EffectStat statEffect)
            {
                if (itemStats.ContainsKey(statEffect.Stat))
                {
                    throw new InvalidOperationException($"Only a single stat is supported for an item: {statEffect.Stat}");
                }

                // 1. Get the value definition for the stat.
                itemStats.Add(statEffect.Stat, statEffect.ValueDefinition);

                // 2. Initialize the usage totals for the stat, if needed.
                if (StatList.RequireTotals.Contains(statEffect.Stat))
                {
                    _usageTotals.Add(statEffect.Stat, 0);
                }
            }
        }

        return itemStats;
    }

    /// <summary>
    /// Helper method used by the constructor to set up the base stats.
    /// </summary>
    private void SetupCommonStats()
    {
        // Add the common stats.
        foreach (KeyValuePair<EStat, ValueDefinition> stat in StatList.Common)
        {
            // Only add it if it does not exist by default.
            if (!ItemStats.ContainsKey(stat.Key))
            {
                ItemStats.Add(stat.Key, stat.Value);
            }
        }

        // If this is a cooldown item,
        if (Owner is CooldownItem)
        {
            // add all internal cooldown stats;
            foreach (EStat stat in StatList.InternalCooldown)
            {
                if (ItemStats.ContainsKey(stat))
                {
                    throw new InvalidOperationException($"Internal Cooldown stats {stat} is currently not supported without default values.");
                }

                ItemStats.Add(stat, new ValueDefinitionSingle(0));
            }

            // add all common cooldown stats.
            foreach (KeyValuePair<EStat, ValueDefinition> stat in StatList.CommonCooldown)
            {
                // Only add it if it does not exist by default.
                // For instance, some items may have a base crit so they should not be initialized with default values.
                if (!ItemStats.ContainsKey(stat.Key))
                {
                    ItemStats.Add(stat.Key, stat.Value);
                }
            }
        }

        // Add the value of the item.
        // Cost is a stat common to all items and refers to the price at which it can be bought.
        // The cost is a standard value based on the item's size and tier.
        // The value by default starts at the item's cost.
        // Only selleable items should have a value
        if (Owner.IsSellable)
        {
            ItemStats.Add(EStat.Value, new ValueDefinitionTiered(StatList.ItemCosts[Owner.Size]));
        }

        // If this is a weapon,
        if (Owner.IsWeapon)
        {
            // add all common weapon stats.
            foreach (KeyValuePair<EStat, ValueDefinition> stat in StatList.CommonWeapon)
            {
                // Only add it if it does not exist by default.
                if (!ItemStats.ContainsKey(stat.Key))
                {
                    ItemStats.Add(stat.Key, stat.Value);
                }
            }
        }
    }

    /// <summary>
    /// Initializes the ammo stats for this item.
    /// <see cref="AmmoItem"/>
    /// </summary>
    /// <param name="ammo"></param>
    internal void InitializeAmmo(ValueDefinition ammo)
    {
        ItemStats.Add(EStat.Ammo, ammo);
        ItemStats.Add(EStat.MaxAmmo, ammo.Clone());
    }

    /// <summary>
    /// Gets the usage of the stat.
    /// </summary>
    /// <param name="targetStat"></param>
    /// <returns></returns>
    /// <exception cref="KeyNotFoundException"></exception>
    public int GetUsage(EStat targetStat)
    {
        if (_usageTotals.TryGetValue(targetStat, out int value))
        {
            return value;
        }

        throw new KeyNotFoundException($"Stat {targetStat} not found.");
    }

    /// <summary>
    /// Gets the stat value.
    /// </summary>
    /// <param name="targetStat"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentNullException"></exception>
    /// <exception cref="KeyNotFoundException"></exception>
    public int GetValue(EStat targetStat)
    {
        // Unsellable items do not have a value field. Just return 0.
        if (targetStat == EStat.Value && !Owner.IsSellable)
        {
            return 0;
        }

        if (!ItemStats.TryGetValue(targetStat, out ValueDefinition? valueDefinition))
        {
            throw new KeyNotFoundException($"Stat {targetStat} not found.");
        }

        return valueDefinition.GetValue(Owner);
    }

    /// <summary>
    /// When an item is reloaded, it may get used.
    /// </summary>
    /// <param name="operator"></param>
    /// <exception cref="InvalidOperationException"></exception>
    private void HandleAmmo(EOperator @operator)
    {
        // Ammo should not exceed the max ammo.
        // Reloading a full ammo item is still a valid action so we should not throw an exception.
        int ammo = GetValue(EStat.Ammo);
        int maxAmmo = GetValue(EStat.MaxAmmo);
        if (ammo > maxAmmo)
        {
            ModifyStat(EStat.Ammo, ammo - maxAmmo, EOperator.Subtract);
        }

        // However, using an item without ammo is invalid.
        if (ammo < 0)
        {
            throw new InvalidOperationException("Negative ammo is not allowed.");
        }

        // Check if the item was ready for use.
        if (Owner is not AmmoItem ammoItem)
        {
            throw new InvalidOperationException("This must be an ammo item.");
        }

        // If it was reloaded from 0 to 1, and the cooldown is full, use the item.
        if (@operator == EOperator.Add && ammo == 1 && ammoItem.CurrentCooldownProgress == ammoItem.Cooldown)
        {
            ammoItem.UseItem();
        }
    }

    /// <summary>
    /// Modifies the stat by the given value and operator.
    /// </summary>
    /// <param name="stat"></param>
    /// <param name="value"></param>
    /// <param name="operator"></param>
    /// <param name="initiatorStat"></param>
    /// <returns></returns>
    /// <exception cref="InvalidOperationException"></exception>
    internal bool ModifyStat(EStat stat, int value, EOperator @operator)
    {
        // Only modify values that exist.
        if (!ItemStats.TryGetValue(stat, out ValueDefinition? valueDefinition))
        {
            return false;
        }

        valueDefinition.ModifyValue(Owner, value, @operator);

        PerformActionsForSpecialStatUpdates(stat, @operator);
        QueueConvertedEffectsTriggerByStatChange(stat, @operator);

        return true;
    }

    /// <summary>
    /// Checks if the item has a stat.
    /// </summary>
    /// <param name="value"></param>
    /// <returns></returns>
    internal bool HasStat(EStat value)
    {
        return ItemStats.ContainsKey(value);
    }

    /// <summary>
    /// Helper method to perform special actions for certain stats.
    /// </summary>
    /// <param name="updatedStat"></param>
    /// <param name="operator"></param>
    private void PerformActionsForSpecialStatUpdates(EStat updatedStat, EOperator @operator)
    {
        switch (updatedStat)
        {
            case EStat.ChargeInternal:
                // Owner must be a cooldown item.
                CooldownMechanicsHandler.HandleCharge((CooldownItem)Owner);
                break;
            case EStat.Ammo:
                HandleAmmo(@operator);
                break;
                // default:
                // There aren't any special actions for this stat.
        }
    }

    /// <summary>
    /// Queues the converted effect triggered by the stat change.
    /// </summary>
    /// <param name="updatedStat"></param>
    /// <param name="operator"></param>
    private void QueueConvertedEffectsTriggerByStatChange(EStat updatedStat, EOperator @operator)
    {
        // Regarding efficiency, given the small size of this list, looping through it multiple times is fine.
        QueueTriggersForConvertedEffects(updatedStat, Owner.ConvertedEffects, @operator);

        // When an item's stat changes, this transfers to the owning player as well.
        // For instance, if an item gains haste, then the player also gains haste.
        ArgumentNullException.ThrowIfNull(Owner.PlayerOwner, "Player owner must be set for the item.");
        QueueTriggersForConvertedEffects(updatedStat, Owner.PlayerOwner.ConvertedEffects, @operator);
    }

    /// <summary>
    /// Helper method to queue triggers for converted effects.
    /// </summary>
    /// <param name="updatedStat"></param>
    /// <param name="convertedEffects"></param>
    /// <param name="convertedEffectOwner"></param>
    /// <param name="operator"></param>
    private static void QueueTriggersForConvertedEffects(EStat updatedStat, IEnumerable<ConvertedEffect> convertedEffects, EOperator @operator)
    {
        foreach (ConvertedEffect convertedEffect in convertedEffects)
        {
            if (convertedEffect.Trigger is TriggerOnStatIncrease trigger && trigger.Stat == updatedStat && @operator == trigger.Operator)
            {
                Game.Instance.Queue.Add(
                    new ResultConvertedEffectTriggered(
                        convertedEffect.Priority, convertedEffect.Action, convertedEffect.EffectOwner));
            }
        }
    }

    /// <summary>
    /// Checks if the item is out of ammo.
    /// </summary>
    /// <returns></returns>
    internal bool IsAmmoItemAndIsOutOfAmmo()
    {
        try
        {
            return GetValue(EStat.Ammo) == 0;
        }
        catch (KeyNotFoundException)
        {
            return false;
        }
    }

    /// <summary>
    /// Increases the usage of the stat.
    /// </summary>
    /// <param name="type"></param>
    /// <param name="value"></param>
    /// <exception cref="KeyNotFoundException"></exception>
    internal void IncreaseUsage(EStat type, int value)
    {
        // Items with non stat effects can increase usage.
        // For instance, Magma Core: At the start of each fight, Burn 6 » 9 » 12 » 15.
        _usageTotals.TryAdd(type, 0);
        _usageTotals[type] += value;
    }

    /// <summary>
    /// Gets the string representation of the stats.
    /// </summary>
    /// <returns></returns>
    public override string ToString()
    {
        string usageStr = "";
        foreach (var kvp in _usageTotals)
        {
            EStat statType = kvp.Key;
            int value = kvp.Value;
            string typeStr = statType.GetAbbreviation();

            usageStr += $" ({typeStr}{value})";
        }

        string currentStr = "";
        foreach (var kvp in ItemStats)
        {
            // Skip internal
            if (StatList.InternalCooldown.Contains(kvp.Key))
            {
                continue;
            }

            ValueDefinition valueDefinition = kvp.Value;

            // If the stat is a time-based stat, add "s" to the end of the value.
            string value = StatList.TimeBased.Contains(kvp.Key) ?
                ((kvp.Value.GetValue(Owner) / 1000f).ToString("0.0") + "s") :
                kvp.Value.GetValue(Owner).ToString();

            // External cooldown stats, display the count in addition to the duration
            // if (StatList.CountBased.Contains(kvp.Key))
            // {
            // value += ", " + valueDefinition.GetCount(Owner);
            // } // TODO

            currentStr += $" ({kvp.Key.GetAbbreviation()}{value})";
        }

        return $"{currentStr}\n - Usage:{usageStr}";
    }

    /// <summary>
    /// Converts the item stats data to JSON format.
    /// </summary>
    /// <returns>The item stats data in JSON format.</returns>
    public string ToJson()
    {
        var usageDict = new Dictionary<string, int>();
        foreach (var kvp in _usageTotals)
        {
            usageDict.Add(kvp.Key.ToString(), kvp.Value);
        }

        var currentDict = new Dictionary<string, int>();
        foreach (var kvp in ItemStats)
        {
            if (StatList.InternalCooldown.Contains(kvp.Key))
            {
                continue;
            }

            currentDict.Add(kvp.Key.ToString(), kvp.Value.GetValue(Owner));
        }

        var jsonObject = new
        {
            CurrentStats = currentDict,
            UsageStats = usageDict
        };

        return System.Text.Json.JsonSerializer.Serialize(jsonObject);
    }
}

