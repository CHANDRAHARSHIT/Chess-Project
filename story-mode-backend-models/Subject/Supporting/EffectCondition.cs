/// <summary>
/// EffectCondition (parent) <see cref="EffectCondition"/>.
///     MutipleOrConditions (child) <see cref="EffectConditionMutipleOr"/>
///     SingleCondition (child) <see cref="EffectConditionSingle"/>
/// </summary>
/// 
public abstract class EffectCondition
{
    /// <summary>
    /// Common when I am used condition.
    /// </summary>
    public static readonly EffectConditionSingle WhenIAmUsed = new(
        new ConditionWithSubject(
            subject: new SubjectThisItem(),
            trigger: new TriggerOnItemUse()
        )
    );

    /// <summary>
    /// Common start of combat condition.
    /// </summary>
    public static readonly EffectConditionSingle StartOfCombat = new(new TriggerOnStartOfCombat());

    /// <summary>
    /// Common trigger permanently condition.
    /// </summary>
    public static readonly EffectConditionSingle Permanent = new(new TriggerPermanently());

    public static readonly EffectConditionSingle StartOfDay = new(new TriggerStartOfDay());
    public static readonly EffectConditionSingle StartOfHour = new(new TriggerStartOfHour());

    /// <summary>
    /// Get the effect conditions.
    /// </summary>
    /// <returns></returns>
    public abstract List<Condition> GetEffectConditions();
}

/// <summary>
/// Creates a new ConditionDefinition with the specified conditions.
/// </summary>
/// <param name="conditions"></param>
public class EffectConditionMutipleOr : EffectCondition
{
    /// <summary>
    /// The conditions that must be met for the effect to run.
    /// </summary>
    public List<Condition> Conditions { get; init; }

    /// <summary>
    /// These should only be set up under single conditions.
    /// </summary>
    private static readonly List<Trigger> _disallowedTriggers = [
        new TriggerOnStartOfCombat(),
        new TriggerPermanently(),
    ];

    /// <summary>
    /// Specifies how the conditions should be evaluated.
    /// A default value of Or is used for now.
    /// </summary>
    public EBooleanOperator Operator { get; init; } = EBooleanOperator.Or;

    public EffectConditionMutipleOr(Condition[] conditions)
    {
        // Check for disallowed triggers.
        foreach (Condition condition in conditions)
        {
            Trigger trigger = condition.Trigger;
            if (_disallowedTriggers.Contains(trigger))
            {
                throw new InvalidOperationException($"The trigger {trigger} is not allowed in a compound condition.");
            }
        }

        Conditions = [.. conditions];
    }

    public override List<Condition> GetEffectConditions()
    {
        return Conditions;
    }
}

/// <summary>
/// Creates a new ConditionDefinition with the specified conditions.
/// </summary>
/// <param name="condition"></param>
public class EffectConditionSingle(Condition condition) : EffectCondition
{
    /// <summary>
    /// The condition that must be met for the effect to run.
    /// </summary>
    public Condition Condition { get; init; } = condition;

    /// <summary>
    /// Certain condition just require a trigger to be met.
    /// These are conditions without a subject.
    /// </summary>
    /// <param name="trigger"></param>
    public EffectConditionSingle(Trigger trigger) : this(new Condition(trigger))
    {
    }

    /// <summary>
    /// Gets the effect condition.
    /// </summary>
    /// <returns></returns>
    public override List<Condition> GetEffectConditions()
    {
        return [Condition];
    }
}