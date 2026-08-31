/// <summary>
/// The Action for the effect.
/// 
/// Action <see cref="Action"/>
///      Slow <see cref="Slow"/>
///      Freeze <see cref="Freeze"/>
///      Haste <see cref="Haste"/>
///      Damage <see cref="Damage"/>
///
/// Effect: Condition + Action
/// Actions: Subject + Impact
/// </summary>
/// <remarks>
/// Creates a new Action with the specified subject and impact.
/// </remarks>
/// <param name="subject"></param>
/// <param name="impact"></param>
public class Action(SubjectSelector subject, Impact impact)
{
    /// <summary>
    /// The subject of the action.
    /// </summary>
    public SubjectSelector Subject { get; init; } = subject;

    /// <summary>
    /// The impact of the action.
    /// </summary>
    public Impact Impact { get; init; } = impact;

    /// <summary>
    /// Applies the impact on the subjects.
    /// </summary>
    /// <param name="effectOwner"></param>
    public void Run(Placeable effectOwner)
    {
        // Loop through the subjects
        foreach (Subject subject in Subject.GetSubjects(effectOwner))
        {
            // Apply the impact
            Impact.ApplyOnSubject(subject, effectOwner);
        }
    }

    /// <summary>
    /// Returns a converted action.
    /// </summary>
    /// <returns></returns>
    internal Action GetConverted(Placeable effectOwner)
    {
        // The impact is the same, but the subject is different.
        return new Action(Subject.GetConverted(effectOwner), Impact);
    }
}

/// <summary>
/// There are commonly applied stat based actions.
/// </summary>
/// <remarks>
/// For most definitions, we only need two values to define this effect.
/// </remarks>
/// <param name="count"></param>
/// <param name="duration"></param>
public class Slow(object count, object duration) : Action(
        // Slow targets a specified number of items in the opponent's playmat.
        new SubjectItemsWithoutDirectionRelativeToItem(
                isOpponentPlaymat: true,
                subset: ItemSubset.GetObjectAsSubset(count)
            ),
        // Slows by a specified duration.
        new ImpactStatModify(
                impactedStat: EStat.SlowInternal,
                initiatorStat: EStat.SlowExternal,
                valueDefinition: ValueDefinition.GetObjectAsValueDefinition(count: count, value: duration),
                op: EOperator.Add
            )
        )
{
}

/// <summary>
/// There are commonly applied stat based actions.
/// </summary>
/// <remarks>
/// For most definitions, we only need two values to define this effect.
/// </remarks>
/// <param name="count"></param>
/// <param name="duration"></param>
public class Freeze(object count, object duration) : Action(
    // Freeze targets a specified number of items in the opponent's playmat.
    new SubjectItemsWithoutDirectionRelativeToItem(
        isOpponentPlaymat: true,
        subset: ItemSubset.GetObjectAsSubset(count)
    ),
    // Freeze by a specified duration.
    new ImpactStatModify(
        impactedStat: EStat.FreezeInternal,
        initiatorStat: EStat.FreezeExternal,
        valueDefinition: ValueDefinition.GetObjectAsValueDefinition(count: count, value: duration),
        op: EOperator.Add
    )
)
{
}

/// <summary>
/// There are commonly applied stat based actions.
/// </summary>
/// <remarks>
/// For most definitions, we only need two values to define this effect.
/// </remarks>
/// <param name="count"></param>
/// <param name="duration"></param>
public class Haste(object count, object duration) : Action(
    // Haste targets a specified number of items in the player's playmat.
    new SubjectItemsWithoutDirectionRelativeToItem(
        subset: ItemSubset.GetObjectAsSubset(count)
    ),
    // Haste by a specified duration.
    new ImpactStatModify(
        impactedStat: EStat.HasteInternal,
        initiatorStat: EStat.HasteExternal,
        valueDefinition: ValueDefinition.GetObjectAsValueDefinition(count: count, value: duration),
        op: EOperator.Add
    )
)
{
}

/// <summary>
/// A commonly applied stat based action for damage.
/// </summary>
/// <param name="amount"></param>
public class Damage(ValueDefinition value) : Action(
        // Damages the opponent.
        new SubjectOpposingPlayer(),
        new ImpactStatModify(
                impactedStat: EStat.Health,
                initiatorStat: EStat.Damage,
                valueDefinition: value,
                op: EOperator.Subtract
            )
        )
{
    public Damage(int amount) : this(new ValueDefinitionSingle(amount)) { }

    public Damage(int[] amounts) : this(new ValueDefinitionTiered(amounts)) { }
}

