/// <summary>
/// Centralized location for all stat lists used throughout the codebase.
/// </summary>
public static class StatList
{
    // Also the ones in item and player stats.
    public static readonly EStat[] PlayerBased = [
        EStat.Damage,
        EStat.Burn,
        EStat.Poison,
        EStat.Heal,
        EStat.Regeneration,
        EStat.Shield,
    ];

    public static readonly EStat[] ItemBased = [
        EStat.HasteExternal,
        EStat.SlowExternal,
        EStat.FreezeExternal,
        EStat.ChargeExternal,
    ];

    /// <summary>
    /// These have no on use application.
    /// </summary>
    public static readonly EStat[] Permanent = [
        EStat.CritChance,
        EStat.Multicast,
        EStat.Lifesteal,
        EStat.CritDamageMultiplier,
        EStat.CooldownInternal,
        EStat.Ammo,
        EStat.MaxAmmo,
        EStat.Income,
    ];

    /// <summary>
    /// Stats that require totals.
    /// </summary>
    public static readonly List<EStat> RequireTotals =
    [
        EStat.Damage,
        EStat.Burn,
        EStat.Poison,
        EStat.Heal,
        EStat.Shield,
    ];

    /// <summary>
    /// Stats common to all items
    /// </summary>
    public static readonly Dictionary<EStat, ValueDefinition> Common = new()
    {
        { EStat.MaxEnchantments, new ValueDefinitionSingle(1) }
    };

    /// <summary>
    /// The cost of the item. This is different from its value which can change.
    /// The cost of the item depends on the tier and size.
    /// The cost is a standard value based on the item's size and tier.
    /// </summary>
    public static readonly Dictionary<ESize, int[]> ItemCosts = new()
    {
        { ESize.Small, [2, 4, 8, 16] },
        { ESize.Medium, [4, 8, 16, 32] },
        { ESize.Large, [8, 16, 32, 64] }
    };

    /// <summary>
    /// The internal cooldown stats.
    /// </summary>
    public static readonly EStat[] InternalCooldown = [
        EStat.ChargeInternal,
        EStat.HasteInternal,
        EStat.SlowInternal,
        EStat.FreezeInternal,
    ];

    // TODO-j: Remove this, as these are not really cunt based, you can can have haste to left or haste to right without a count
    public static readonly EStat[] CountBased = [
        EStat.ChargeExternal,
        EStat.HasteExternal,
        EStat.SlowExternal,
        EStat.FreezeExternal,
    ];

    /// <summary>
    /// The common cooldown stats.
    /// </summary>
    public static readonly Dictionary<EStat, ValueDefinition> CommonCooldown = new()
    {
        { EStat.Multicast, new ValueDefinitionTiered([0, 0, 0, 0]) },
        { EStat.CritChance, new ValueDefinitionTiered([0, 0, 0, 0]) }
    };

    /// <summary>
    /// The common weapon stats.
    /// </summary>
    public static readonly Dictionary<EStat, ValueDefinition> CommonWeapon = new()
    {
        { EStat.CritDamageMultiplier, new ValueDefinitionSingle(1) },
        { EStat.Lifesteal, new ValueDefinitionSingle(0) },
    };

    /// <summary>
    /// Stats that are time-based. By default, all time ih the game is milliseconds.
    /// </summary>
    public static readonly List<EStat> TimeBased =
    [
        EStat.CooldownInternal,
        EStat.ChargeExternal,
        EStat.HasteExternal,
        EStat.SlowExternal,
        EStat.FreezeExternal,
        EStat.CooldownExternal,
        EStat.ChargeInternal,
        EStat.HasteInternal,
        EStat.SlowInternal,
        EStat.FreezeInternal,
    ];
}