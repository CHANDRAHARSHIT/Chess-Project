/// <summary>
/// Impact (Parent) <see cref="Impact"/>
///    ImpactStat (Child) <see cref="ImpactStatModify"/>
///         ImpactHaste (GC) <see cref="ImpactHaste"/>
///         ImpactFreeze (GC) <see cref="ImpactFreeze"/>
///         ImpactSlow (GC) <see cref="ImpactSlow"/>
///         ImpactCharge (GC) <see cref="ImpactCharge"/>
///    ImpactItem (Child) <see cref="ImpactItem"/>
///    ImpactItemDestroy (Child) <see cref="ImpactItemDestroy"/>
///    ImpactItemUse (Child) <see cref="ImpactItemUse"/>
///    ImpactItemGain (Child) <see cref="ImpactItemGain"/>
/// 
/// </summary>
public abstract class Impact
{
    public EStat? InitiatorStat { get; init; }

    internal abstract void ApplyOnSubject(Subject affectedSubject, Placeable owner);
}

/// <summary>
/// Stat related impacts.
/// </summary>
public class ImpactStat : Impact
{
    public EStat Stat { get; init; }
    public ValueDefinition ValueDefinition { get; set; }

    public ImpactStat(EStat stat, ValueDefinition valueDefinition)
    {
        Stat = stat;
        ValueDefinition = valueDefinition;
    }

    /// <summary>
    /// Applies the impact to the subject.
    /// </summary>
    /// <param name="affectedSubject"></param>
    /// <param name="effectOwner"></param>
    internal override void ApplyOnSubject(Subject affectedSubject, Placeable effectOwner)
    {
        throw new InvalidOperationException("This should have already been added via the ItemStats constructor.");
    }
}

/// <summary>
/// Modifies a stat on the subject.
/// </summary>
public class ImpactStatModify : ImpactStat
{
    public EOperator Operator { get; init; }

    public ImpactStatModify(EStat impactedStat, ValueDefinition valueDefinition, EOperator op, EStat? initiatorStat = null)
        : base(impactedStat, valueDefinition)
    {
        Operator = op;
        InitiatorStat = initiatorStat;
    }

    /// <summary>
    /// Applies the impact to the subject.
    /// </summary>
    /// <param name="affectedSubject"></param>
    /// <param name="effectOwner"></param>
    internal override void ApplyOnSubject(Subject affectedSubject, Placeable effectOwner)
    {
        ArgumentNullException.ThrowIfNull(affectedSubject, "The affected subject must be set.");

        affectedSubject.ModifyStat(Stat, ValueDefinition.GetValue(effectOwner), Operator, effectOwner, InitiatorStat);
    }
}

public class ImpactHaste(ValueDefinition valueDefinition) : ImpactStatModify(EStat.HasteInternal, valueDefinition, EOperator.Add, EStat.HasteExternal)
{
}

public class ImpactFreeze(ValueDefinition valueDefinition) : ImpactStatModify(EStat.FreezeInternal, valueDefinition, EOperator.Add, EStat.FreezeExternal)
{
}

public class ImpactSlow(ValueDefinition valueDefinition) : ImpactStatModify(EStat.SlowInternal, valueDefinition, EOperator.Add, EStat.SlowExternal)
{
}

public class ImpactCharge(ValueDefinition valueDefinition) : ImpactStatModify(
    impactedStat: EStat.ChargeInternal,
    valueDefinition: valueDefinition,
    op: EOperator.Add,
    initiatorStat: EStat.ChargeExternal)
{
}

/// <summary>
/// Impact non-stat attributes of the item: types, tier, etc.
/// </summary>
public class ImpactItem(EItem[]? addTypes = null, EItem[]? removeTypes = null) : Impact
{
    private EItem[] AddTypes { get; init; } = addTypes ?? [];
    private EItem[] RemoveTypes { get; init; } = removeTypes ?? [];

    internal override void ApplyOnSubject(Subject affectedSubject, Placeable owner)
    {
        if (affectedSubject is not Item item)
        {
            throw new InvalidOperationException("ImpactItem can only be applied to an item.");
        }

        if (AddTypes.Length > 0)
        {
            item.AddTypes(AddTypes);
        }

        if (RemoveTypes.Length > 0)
        {
            throw new NotImplementedException("Removing types is not implemented yet.");
        }
    }
}

/// <summary>
/// Destroys an item.
/// </summary>
internal class ImpactItemDestroy : Impact
{
    internal override void ApplyOnSubject(Subject affectedSubject, Placeable owner)
    {
        if (affectedSubject is not Item item)
        {
            throw new InvalidOperationException("Destruction can only be applied to an item.");
        }

        item.Destroy();
    }
}

public class ImpactItemUse : Impact
{
    internal override void ApplyOnSubject(Subject affectedSubject, Placeable owner)
    {
        if (affectedSubject is not CooldownItem cooldownItem)
        {
            throw new InvalidOperationException("Use can only be applied to a cooldown item.");
        }

        cooldownItem.UseItem();
    }
}

public class ImpactItemGain : Impact
{
    internal override void ApplyOnSubject(Subject affectedSubject, Placeable owner)
    {
        if (affectedSubject is not Player)
        {
            throw new InvalidOperationException("Gain can only be applied to a player.");
        }

        // Not implemented yet.
    }
}