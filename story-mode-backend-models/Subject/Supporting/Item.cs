using System.Text.Json;

/// <summary>
/// Placeable (Parent)
///     Item (Child) 
///         CooldownItem (Grandchild)
///              AmmoItem (Great-grandchild)
///         InstantItem (Grandchild)
/// </summary>
public abstract class Item : Placeable
{
    /// <summary>
    /// Manages the enchantments of the item.
    /// </summary>
    private ItemEnchantment Enchantments { get; init; }

    /// <summary>
    /// The item types: Ammo, Armor, Cooldown, Damage, etc.
    /// </summary>
    public HashSet<EItem> ItemTypes { get; init; }

    /// <summary>
    /// The size of the item: Small, Medium, Large.
    /// </summary>
    public ESize Size { get; init; }

    /// <summary>
    /// The number of slots that this item occupies.
    /// </summary>
    public int SlotSize => (int)Size;

    /// <summary>
    /// Instant items can also have stats but not as many.
    /// For instance, they would never have any cooldown stats or crit chance.
    /// </summary>
    public ItemStat Stats { get; set; }

    /// <summary>
    /// Whether the item has been destroyed.
    /// </summary>
    public bool IsDestroyed { get; set; } = false;

    // Properties
    public bool IsCooldownItem => this is CooldownItem;
    public bool IsSellable => !IsOfType(EItem.Unsellable);
    public bool IsWeapon => IsOfType(EItem.Weapon);
    public bool IsNonWeapon => IsOfType(EItem.NonWeapon);
    public int MaxEnchantments => Enchantments.MaxEnchantments;

    // Convenience functions
    internal override int GetStatValue(EStat statType) { return Stats.GetValue(statType); }
    public int GetUsage(EStat type) { return Stats.GetUsage(type); }
    internal override void ModifyStat(EStat stat, int value, EOperator @operator, Placeable? initiator = null, EStat? initiatorStat = null) { Stats.ModifyStat(stat, value, @operator); }
    internal override void IncreaseUsage(EStat type, int value) { Stats.IncreaseUsage(type, value); }
    internal void Destroy() { DestructionHandler.Destroy(this); }
    internal Item Enchant(EEnchantment type) { return Enchantments.Enchant(type); }
    internal EEnchantment[] GetActiveEnchantments() { return Enchantments.GetActiveEnchantments(); }
    internal EEnchantment[] GetInactiveEnchantments() { return Enchantments.GetInactiveEnchantments(); }


    /// <summary>
    /// Setup an item.
    /// </summary>
    protected Item(
        EItem[] types, ESize size, string name, ETier startingTier, ECollection collection, Effect[] effects)
        : base(name, startingTier, collection, effects)
    {
        Enchantments = new ItemEnchantment(this, effects);
        ItemTypes = [.. types];
        Size = size;
        Stats = new ItemStat(this, effects);
    }

    /// <summary>
    /// Upgrades the item to the next tier.
    /// Skills can also be upgraded so this function lives in the base class.
    /// </summary>
    public new Item Upgrade()
    {
        Item item = base.Upgrade() as Item ?? throw new InvalidOperationException("Upgrade did not return a valid Item.");
        return item;
    }

    /// <summary>
    /// Checks if the item is of the specified type.
    /// </summary>
    /// <param name="itemType"></param>
    /// <returns></returns>
    /// <exception cref="NotImplementedException"></exception>
    internal bool IsOfType(EItem itemType)
    {
        return ItemTypes.Contains(itemType);
    }

    /// <summary>
    /// Adds types to the item.
    /// </summary>
    /// <param name="addTypes"></param>
    /// <exception cref="NotImplementedException"></exception>
    internal void AddTypes(EItem[] addTypes)
    {
        ItemTypes.UnionWith(addTypes);
    }

    /// <summary>
    /// This cannlt handle derived stats. Use <see cref="GetDerivedStatsString()"/> for that.
    /// </summary>
    /// <returns></returns>
    public override string ToString()
    {
        string itemTypesString = string.Join(", ", ItemTypes);
        return $"{base.ToString()} ({itemTypesString})({Size.ToString()[0]})\n -{Stats}";
    }

    public void Reset()
    {
        // Divyam: Add other resets
        // Enchantments.Reset();
        Stats.Reset();
        // IsDestroyed = false;
    }

    /// <summary>
    /// Converts the item data to JSON format.
    /// </summary>
    /// <returns>The item data in JSON format.</returns>
    public string ToJson()
    {
        var itemJson = new
        {
            Name,
            Size = Size.ToString(),
            Stats = JsonSerializer.Deserialize<object>(Stats.ToJson())
        };

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
        };

        return JsonSerializer.Serialize(itemJson, options);
    }
}
