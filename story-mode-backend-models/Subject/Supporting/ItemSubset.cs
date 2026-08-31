/// <summary>
/// Subset (parent) <see cref="ItemSubset"/>
///       ItemSubsetSingle (child) <see cref="ItemSubsetSingle"/>
///       ItemSubsetTiered (child) <see cref="ItemSubsetTiered"/>
///       
/// A subset definition for getting a subset of items from an ordered list.
/// </summary>
public abstract class ItemSubset
{
    /// <summary>
    /// Get the value of the subset.
    /// </summary>
    /// <param name="effectOwnerTier"></param>
    /// <returns></returns>
    public abstract ESubset GetValue(ETier effectOwnerTier);

    /// <summary>
    /// Implicitly converts a subset value to a subset.
    /// </summary>
    /// <param name="value"></param>
    public static implicit operator ItemSubset(ESubset value)
    {
        return new ItemSubsetSingle(value);
    }

    /// <summary>
    /// Implicitly converts a subset values to a tiered subset.
    /// </summary>
    /// <param name="values"></param>
    public static implicit operator ItemSubset(ESubset[] values)
    {
        return new ItemSubsetTiered(values);
    }

    /// <summary>
    /// Applies the subset definition to the items and gets a subset of items.
    /// </summary>
    /// <param name="items"></param>
    /// <param name="subset"></param>
    /// <returns></returns>
    /// <exception cref="InvalidOperationException"></exception>
    public List<Item> Apply(List<Item> items, ETier effectOwnerTier)
    {
        ESubset subset = GetValue(effectOwnerTier);

        if (items.Count == 0)
        {
            return items;
        }

        switch (subset)
        {
            case ESubset.All:
                return items;

            case ESubset.Leftmost:
                return [items[0]];

            case ESubset.Rightmost:
                return [items[^1]];

            case ESubset.OneRandom:
            case ESubset.TwoRandom:
            case ESubset.ThreeRandom:
            case ESubset.FourRandom:
            case ESubset.FiveRandom:
            case ESubset.SixRandom:
            case ESubset.SevenRandom:
            case ESubset.EightRandom:
            case ESubset.NineRandom:
            case ESubset.TenRandom:
                // OneRandom = 1, TwoRandom = 2, ThreeRandom = 3, etc.
                int quantity = (int)subset;

                if (quantity >= items.Count)
                {
                    return items;
                }

                return [.. items
                    .OrderBy(_ => Guid.NewGuid()) // Assign a random GUID to each item, effectively shuffling the list
                    .Take(quantity)]; // Convert the result into a new List<Item>

            default:
                throw new InvalidOperationException($"The subset {subset} is not implemented.");
        }
    }

    internal static ItemSubset GetObjectAsSubset(object count)
    {
        return count switch
        {
            int i => new ItemSubsetSingle(ESubsetGetter.GetEnum(i)),
            short u => new ItemSubsetSingle(ESubsetGetter.GetEnum(u)),
            int[] arr => new ItemSubsetTiered(ESubsetGetter.GetEnum(arr)),
            _ => throw new ArgumentOutOfRangeException($"Invalid type for subset: {count.GetType()}.")
        };
    }
}

/// <summary>
/// A single value definition.
/// </summary>
public class ItemSubsetSingle(ESubset subset) : ItemSubset
{
    private ESubset Subset { get; init; } = subset;

    public override ESubset GetValue(ETier effectOwnerTier)
    {
        return Subset;
    }
}

/// <summary>
/// A tiered value definition.
/// </summary>
public class ItemSubsetTiered(ESubset[] subsets) : ItemSubset
{
    private ESubset[] Subsets { get; init; } = subsets;

    public override ESubset GetValue(ETier effectOwnerTier)
    {
        return Subsets[(int)effectOwnerTier];
    }
}
