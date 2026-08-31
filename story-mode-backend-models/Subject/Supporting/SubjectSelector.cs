/// <summary>
/// Since subjects haven't been added to the game yet, we use these definitions to represent them.
///
/// SubjectDefinition (parent) <see cref="SubjectSelector"/>
///     SubjectPlayer (child) <see cref="SubjectPlayer"/>
///         SubjectPlayerOwner (grandchild) <see cref="SubjectPlayerOwner"/>
///         SubjectPlayerOpposing (grandchild) <see cref="SubjectOpposingPlayer"/>
///         SubjectPlayerBoth (grandchild) <see cref="SubjectBothPlayers"/>
///         
///     SubjectItems (child) <see cref="SubjectItems"/>
///         SubjectItemsWithoutDirection (grandchild) <see cref="SubjectItemsWithoutDirectionRelativeToItem"/>
///         SubjectItemsOnBothPlaymats (grandchild) <see cref="SubjectItemsOnBothPlaymats"/>
///         SubjectItemsWithDirectionRelativeToItem (grandchild) <see cref="SubjectItemsWithDirectionRelativeToItem"/>
///         SubjectThisItem (child) <see cref="SubjectThisItem"/>
///   
///     InternalSubjectItem (child) <see cref="InternalSubjectItem"/>
///
/// This class hold the definition for selecting subjects.
/// The definition may contain a single subject.
/// Since the subjects can only be determined at runtime, we hold the definition of this set,
/// and then we can get the actual subjects at runtime.
///
/// Refactor: These conversions are not intuitive. There may be a generic way to handle these.
/// Effects are broken up into (condition) => (action)
/// The subject can appear on either side. So it can appear as part of the condition or the action.
/// When an effect is converted, we need to convert the action. (Conditions do not require conversion.)
/// When the action is converted, the subject definition needs to be converted.
/// For instance, when (condition) => haste (me)
/// So when we convert this action (haste (me)), we need to replace (me) with the actual item.
/// That is what the InternalSubjectItem class does.
/// </summary>
public abstract class SubjectSelector
{
    /// <summary>
    /// Returns a converted subject set used to handle effect conversions.
    /// Not every Set requireds a conversion.
    /// For those that don't, return the current set.
    /// </summary>
    /// <returns></returns>
    internal abstract SubjectSelector GetConverted(Placeable effectOwner);

    /// <summary>
    /// A reference point is needed to get subjects.
    /// The item that owns this effect is typically the reference item.
    /// </summary>
    /// <param name="effectOwner"></param>
    /// <returns></returns>
    internal abstract List<Subject> GetSubjects(Placeable effectOwner);
}


public abstract class SubjectPlayer : SubjectSelector
{
}

/// <summary>
/// A single player is the subject.
/// The player owns the reference item.
/// </summary>
public class SubjectPlayerOwner : SubjectPlayer
{
    /// <summary>
    /// The player who owns this item is the subject.
    /// </summary>
    /// <param name="reference"></param>
    /// <returns></returns>
    internal override List<Subject> GetSubjects(Placeable effectOwner)
    {
        ArgumentNullException.ThrowIfNull(effectOwner.PlayerOwner, "The player owner must be set.");
        return [effectOwner.PlayerOwner];
    }

    /// <summary>
    /// There is no conversion needed for this.
    /// </summary>
    /// <param name="owner"></param>
    /// <returns></returns>
    internal override SubjectSelector GetConverted(Placeable effectOwner)
    {
        return this;
    }
}

/// <summary>
/// A single opponent is a subject.
/// </summary>
public class SubjectOpposingPlayer : SubjectPlayer
{
    /// <summary>
    /// The opponent is the subject.
    /// </summary>
    /// <param name="reference"></param>
    /// <returns></returns>
    internal override List<Subject> GetSubjects(Placeable effectOwner)
    {
        ArgumentNullException.ThrowIfNull(
            effectOwner.PlayerOwner,
            "The player owner must be set for this placeable: " + effectOwner.Name
        );

        Player opposingPlayer =
            effectOwner.PlayerOwner == Game.Instance.PlayerBottom
                ? Game.Instance.PlayerTop
                : Game.Instance.PlayerBottom;

        return [opposingPlayer];
    }

    /// <summary>
    /// There is no conversion needed for this.
    /// </summary>
    /// <param name="owner"></param>
    /// <returns></returns>
    internal override SubjectSelector GetConverted(Placeable effectOwner)
    {
        return this;
    }
}

/// <summary>
/// Both players are subjects.
/// </summary>
public class SubjectBothPlayers : SubjectPlayer
{
    /// <summary>
    /// The opponent is the subject.
    /// </summary>
    /// <param name="reference"></param>
    /// <returns></returns>
    internal override List<Subject> GetSubjects(Placeable effectOwner)
    {
        return [Game.Instance.PlayerBottom, Game.Instance.PlayerTop];
    }

    /// <summary>
    /// There is no conversion needed for this.
    /// </summary>
    /// <param name="owner"></param>
    /// <returns></returns>
    internal override SubjectSelector GetConverted(Placeable effectOwner)
    {
        return this;
    }
}

public class SubjectPlayerWithStatComparison : SubjectPlayer
{
    private readonly EStat _statType;
    private readonly EComparisonOperator _comparisonType;

    /// <summary>
    /// Constructor to specify the stat type and comparison type.
    /// </summary>
    /// <param name="statType"></param>
    /// <param name="comparisonType"></param>
    public SubjectPlayerWithStatComparison(EStat statType, EComparisonOperator comparisonType)
    {
        _statType = statType;
        _comparisonType = comparisonType;
    }

    /// <summary>
    /// Gets the player based on the specified stat and comparison type.
    /// </summary>
    internal override List<Subject> GetSubjects(Placeable effectOwner)
    {
        Player playerBottom = Game.Instance.PlayerBottom;
        Player playerTop = Game.Instance.PlayerTop;

        int bottomStatValue = playerBottom.GetStatValue(_statType);
        int topStatValue = playerTop.GetStatValue(_statType);

        // Determine the target player based on the comparison type
        Player? targetPlayer = _comparisonType switch
        {
            EComparisonOperator.Less => bottomStatValue < topStatValue ? playerBottom : playerTop,
            EComparisonOperator.Greater => bottomStatValue > topStatValue ? playerBottom : playerTop,
            EComparisonOperator.Equal => bottomStatValue == topStatValue ? playerBottom : null,
            _ => throw new InvalidOperationException("Invalid comparison type."),
        };

        // Return the target player if found, otherwise return an empty list
        return targetPlayer != null ? [targetPlayer] : [];
    }

    /// <summary>
    /// There is no conversion needed for this.
    /// </summary>
    /// <param name="owner"></param>
    /// <returns></returns>
    internal override SubjectSelector GetConverted(Placeable effectOwner)
    {
        return this;
    }
}

/// <summary>
/// This is a parent class for all multiple item selections.
/// </summary>
public abstract class SubjectItems(ItemFilter? filter = null) : SubjectSelector
{
    /// <summary>
    /// All items can have the default set of filters applied.
    /// </summary>
    public ItemFilter ItemFilter { get; init; } = filter ?? new ItemFilter([]);

    internal abstract List<Item> GetItems(Placeable effectOwner);

    internal override List<Subject> GetSubjects(Placeable effectOwner)
    {
        return [.. GetItems(effectOwner).Cast<Subject>()];
    }
}

/// <summary>
/// Subject set is a collection of items defined by:
/// 1. First, pick the playmat, then
/// 2. Apply a type filter on the items.
/// 3. Apply a tier filter on the items.
/// 4. Apply a size filter on the items.
/// 5. Apply a quantity filter on the items.
/// 6. Exclude self if needed.
/// </summary>
public class SubjectItemsWithoutDirectionRelativeToItem : SubjectItems
{
    // Filters
    public bool IsOpponentPlaymat { get; init; }
    public bool ExcludeSelf { get; init; }
    public bool ExcludeOwnersCollection { get; init; } = false;
    public ItemSubset Subset { get; init; }

    public SubjectItemsWithoutDirectionRelativeToItem(
        bool isOpponentPlaymat = false, ItemFilter? filter = null, bool excludeSelf = false, bool fromOtherHeroes = false, EStat? excludeItemsWithoutThisStat = null,
        // The subset defintion may be set directly. If 'subsets' is provided, the 'subset' is ignored.
        ItemSubset? subset = null, ESubset[]? subsets = null,
        // The filter parameters may be set directly. If these are provided the 'filter' is ignored.
        EItem[]? types = null, ETier[]? tiers = null, ESize[]? sizes = null,
        // Or, they may be provided as single values.
        EItem? type = null, ETier? tier = null, ESize? size = null
    )
    {
        IsOpponentPlaymat = isOpponentPlaymat;
        ExcludeSelf = excludeSelf;
        ExcludeOwnersCollection = fromOtherHeroes;
        Subset = subset ?? ESubset.All;

        // Use types, type or [] if not provided.
        // Similarly for tiers and sizes.
        ItemFilter = new ItemFilter(
            types ?? (type is not null ? [type.Value] : []),
            tiers ?? (tier is not null ? [tier.Value] : []),
            sizes ?? (size is not null ? [size.Value] : []),
            [], // collections
            excludeItemsWithoutThisStat
        );

        // Use the filter directly if that is provided
        if (filter != null)
        {
            ItemFilter = filter;
        }


        // The subset definition may be set directly. If 'subsets' is provided, the 'subset' is ignored.
        if (subsets is not null)
        {
            Subset = new ItemSubsetTiered(subsets);
        }
    }

    internal override List<Item> GetItems(Placeable effectOwner)
    {
        return ItemSelector.GetItems(this, effectOwner);
    }

    /// <summary>
    /// There is no conversion needed for this.
    /// </summary>
    /// <param name="owner"></param>
    /// <returns></returns>
    internal override SubjectSelector GetConverted(Placeable effectOwner)
    {
        return this;
    }
}

/// <summary>
/// Selects items on both playmats.
/// </summary>
public class SubjectItemsOnBothPlaymats(ItemFilter? filter = null) : SubjectItems(filter)
{
    /// <summary>
    /// The items on both playmats are subjects.
    /// </summary>
    /// <param name="reference"></param>
    /// <returns></returns>
    internal override List<Item> GetItems(Placeable effectOwner)
    {
        List<Item> items = Game.Instance.PlayerTop.Playmat.Items;
        items.AddRange(Game.Instance.PlayerBottom.Playmat.Items);
        return [.. ItemFilter.Filter(items)];
    }


    /// <summary>
    /// There is no conversion needed for this.
    /// </summary>
    /// <param name="owner"></param>
    /// <returns></returns>
    internal override SubjectSelector GetConverted(Placeable effectOwner)
    {
        return this;
    }
}

/// <summary>
/// For selecting items in a direction relative to a reference item.
/// </summary>
/// <param name="direction"></param>
/// <param name="items"></param>
/// <param name="filter"></param>
public class SubjectItemsWithDirectionRelativeToItem(EDirectionRelativeToItem direction, SubjectItems items, ItemFilter? filter = null) : SubjectItems(filter)
{
    private EDirectionRelativeToItem Direction { get; init; } = direction;

    private SubjectItems Items { get; init; } = items;

    internal override List<Item> GetItems(Placeable effectOwner)
    {
        List<Item> items = Items.GetItems(effectOwner);
        List<Item> result = [];

        foreach (Item item in items)
        {
            // Get the items in the direction relative to the reference item.
            List<Item> itemsInDirection = DirectionHandler.GetItemsRelativeToReferenceItem(Direction, item);

            // Filter out items that are not allowed.
            itemsInDirection = ItemFilter.Filter(itemsInDirection);

            result.AddRange(itemsInDirection);
        }

        return result;
    }

    internal override SubjectSelector GetConverted(Placeable effectOwner)
    {
        return this;
    }
}

/// <summary>
/// This subject definition would be held under an effect which is owns by an item or skill.
/// The subject refers to this item or skill.
/// </summary>
public class SubjectThisItem : SubjectItems
{
    internal override List<Item> GetItems(Placeable effectOwner)
    {
        if (effectOwner is not Item)
        {
            throw new InvalidOperationException("Skills are currently not supported.");
        }

        return [(Item)effectOwner];
    }

    /// <summary>
    /// This converts to a single subject item.
    /// </summary>
    /// <returns></returns>
    internal override SubjectSelector GetConverted(Placeable effectOwner)
    {
        return new InternalSubjectItem(effectOwner as Item ?? throw new Exception("The effect owner is not an item."));
    }
}

/// <summary>
/// This is an internal class that helps with the conversions.
/// </summary>
internal class InternalSubjectItem : SubjectSelector
{
    public Item Item { get; init; }

    public InternalSubjectItem(Item item)
    {
        Item = item;
    }

    /// <summary>
    /// </summary>
    /// <param name="reference"></param>
    /// <returns></returns>
    internal override List<Subject> GetSubjects(Placeable effectOwner)
    {
        // A reference placeable is not needed for this.
        return [Item];
    }

    /// <summary>
    /// There is no conversion needed for this.
    /// </summary>
    /// <param name="owner"></param>
    /// <returns></returns>
    internal override SubjectSelector GetConverted(Placeable effectOwner)
    {
        throw new NotImplementedException(
            "This should not be converted. "
                + "Since it is used as the result of a conversion, converting this would mean converting an effect twice."
        );
    }
}