/// <summary>
/// ItemSelector (main class) <see cref="ItemSelector"/>
/// Subset (helper/parent) <see cref="ItemSubset"/>
///    SingleSubset (child) <see cref="ItemSubsetSingle"/>
///    TieredSubset (child) <see cref="ItemSubsetTiered"/>
/// ItemFilter (helper class) <see cref="ItemFilter"/>
/// 
/// This class is used to select items based on the filters provided.
/// // TOD-j: Both these classes can be combined into a single class.
/// </summary>
public static class ItemSelector
{
    /// <summary>
    /// Get items based on the filters provided.
    /// </summary>
    /// <param name="filters"></param>
    /// <param name="effectOwner"></param>
    /// <param name="convertedEffectOwner"></param>
    /// <returns></returns>
    /// <exception cref="InvalidOperationException"></exception>
    public static List<Item> GetItems(SubjectItemsWithoutDirectionRelativeToItem filters, Placeable effectOwner)
    {
        // 1. First, pick the playmat, then
        // 2. Apply type/tier/size/collection/stat filter on the items.
        // 3. Exclude the effect owner if required.
        // 4. Exclude the owner's collection if required.
        // Refactor: 3 and 4 can be moved to the item filter
        // Last step: Apply a subset filter on the items.

        // 1. Playmat
        ArgumentNullException.ThrowIfNull(effectOwner.PlayerOwner, "The player owner must be set for this placeable: " + effectOwner.Name);
        Player owner = effectOwner.PlayerOwner;
        // Player opponent = owner == Game.Instance.PlayerBottom ? Game.Instance.PlayerTop : Game.Instance.PlayerBottom;
        Playmat playmat = filters.IsOpponentPlaymat ?
            (owner == Game.Instance.PlayerBottom ? Game.Instance.PlayerTop : Game.Instance.PlayerBottom).Playmat : owner.Playmat;
        List<Item> items = playmat.Items;

        // 2. Filter for type/tier/size/collection/excludeStat
        items = filters.ItemFilter.Filter(items);

        // 3. Exclude self
        if (filters.ExcludeSelf && effectOwner is Item placeableItem)
        {
            items.Remove(placeableItem);
        }

        // 4. Exclude the owner's collection
        if (filters.ExcludeOwnersCollection)
        {
            items.RemoveAll(item => item.Collection == owner.Collection);
        }

        // Last step: Subset: Should be the last filter applied.
        items = filters.Subset.Apply(items, effectOwner.Tier);

        return items;
    }
}


/// <summary>
/// Helper class to filter items.
/// </summary>
/// <param name="types">Include items of these types.</param>
/// <param name="tiers">Include items of these tiers.</param>
/// <param name="sizes">Include items of these sizes.</param>
/// <param name="collections">Include items of these collections.</param>
public class ItemFilter(EItem[]? types = null, ETier[]? tiers = null, ESize[]? sizes = null, ECollection[]? collections = null, EStat? excludeItemWithoutThisStat = null)
{
    public EItem[] Types { get; init; } = types ?? [];
    public ETier[] Tiers { get; init; } = tiers ?? [];
    public ESize[] Sizes { get; init; } = sizes ?? [];
    public ECollection[] Collections { get; init; } = collections ?? [];
    public EStat? ExcludeItemWithoutThisStat { get; set; } = excludeItemWithoutThisStat;

    /// <summary>
    /// Convinience constructor for single values.
    /// </summary>
    /// <param name="type"></param>
    /// <param name="tier"></param>
    /// <param name="size"></param>
    public ItemFilter(EItem? type = null, ETier? tier = null, ESize? size = null, ECollection? collection = null)
        : this(types: type.HasValue ? [type.Value] : [], tiers: tier.HasValue ? [tier.Value] : [], sizes: size.HasValue ? [size.Value] : [], collections: collection.HasValue ? [collection.Value] : [])
    {
    }

    /// <summary>
    /// Filters the items based on the filters provided.
    /// </summary>
    /// <param name="items"></param>
    /// <returns></returns>
    public List<Item> Filter(List<Item> items)
    {
        return [.. items
            .Where(item => !ExcludeItemWithoutThisStat.HasValue || item.Stats.HasStat(ExcludeItemWithoutThisStat.Value))
            .Where(item =>
                (Types.Length == 0 || Types.Any(type => item.IsOfType(type))) &&
                (Tiers.Length == 0 || Tiers.Any(tier => item.Tier == tier)) &&
                (Sizes.Length == 0 || Sizes.Any(size => item.Size == size)) &&
                (Collections.Length == 0 || Collections.Any(collection => item.Collection == collection))
            )
        ];
    }

    /// <summary>
    /// This is mainly used to set up stats such as haste, slow, etc. which need to exclude instant items.
    /// </summary>
    /// <param name="excludeItemWithoutThisStat"></param>
    /// <exception cref="InvalidOperationException"></exception>
    internal void AddExcludeItemWithoutThisStat(EStat excludeItemWithoutThisStat)
    {
        if (ExcludeItemWithoutThisStat.HasValue)
        {
            throw new InvalidOperationException("Mutiple stat exclusions are currently not supported. Update this to use an array.");
        }

        ExcludeItemWithoutThisStat = excludeItemWithoutThisStat;
    }
}