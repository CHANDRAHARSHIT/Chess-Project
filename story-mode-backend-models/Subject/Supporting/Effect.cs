using System.Text.Json.Serialization;

/// <summary>
/// Effect (Parent) <see cref="Effect"/>
///     EffectStat (Child) <see cref="EffectStat"/>
///         EffectStatUsage (GC) <see cref="EffectStatUsage"/>
///         EffectStatPassive (GC) <see cref="EffectStatPassive"/>
/// 
/// Represents a class for effects that can be applied to subjects.
/// 
/// Process:
/// 1. Effect is triggered, creating a Result.
/// 2. Result is added to the Queue.
/// 3. All Results in the Queue are processed in order.
/// 
/// Example:
/// "The first time you fall below half health each fight, Shield equal to 20% » 30% » 40% » 50% of your Max Health."
/// (conditions), (action)
/// (conditions) = (The first time you fall below half health each fight)
/// (action) = (Shield equal to 20% » 30% » 40% » 50% of your Max Health.)
/// condition = subject + trigger
///          = you/Player + TriggerOnHalfHealth
///          = you/Player + PlayerStatImpact
///          = you/Player + ((Add) (Shield) (DerivedValue))
/// 
/// When an effect is run, it gets added to the Queue which the game will process once all the effects have been sequenced.
/// Running effects in isolation may cause incorrect sequencing.
/// 
/// Effects have the following structure:
/// condition => action
/// 
/// </summary>
public class Effect(EffectCondition condition, Action action, string description, object? enchantment = null)
{
    /// <summary>
    /// Any effect can be associated with an enchantment. 
    /// This creates the link between the effect and the item.
    /// </summary>
    private EnchantmentData? EnchantmentData { get; init; } =
        enchantment is null ? null :
        enchantment is EnchantmentData data ? data :
        enchantment is EEnchantment name ? new EnchantmentData(name) :
        throw new InvalidOperationException("Enchantment must be an EnchantmentData or EEnchantment.");

    /// <summary>
    /// The condition that must be met for the effect to run.
    /// Currently, only OR is supported for combining conditions.
    /// As this can be a componded set of conditions, we refer to it as a definition.
    /// </summary>
    protected EffectCondition _effectConditions = condition;

    /// <summary>
    /// The action that the effect will perform.
    /// As this can be a componded set of actions, we refer to it as a definition.
    /// If there are effects with multiple actions, those can be phrased as separate effects.
    /// </summary>
    public Action Action { get; init; } = action;

    /// <summary>
    /// The description of the effect.
    /// </summary>
    public string Description { get; init; } = description;

    /// <summary>
    /// Having a backwards reference to the owner is useful as it allows for easy accesss to the tier and other information
    /// required for the Run method.
    /// </summary>
    [JsonIgnore]
    public Placeable? EffectOwner { get; set; }

    // Properties
    public List<Condition> Conditions => _effectConditions.GetEffectConditions();
    public bool IsEnchantment => EnchantmentData != null;

    [JsonIgnore]
    public EEnchantment EnchantmentType => EnchantmentData?.Type ?? throw new InvalidOperationException("This not an enchantment.");
    [JsonIgnore]
    public bool IsEnchantmentActive => EnchantmentData?.IsActive ?? throw new InvalidOperationException("This not an enchantment.");

    /// <summary>
    /// Converts the effects into a format that the game can use.
    /// For instance, item has effect -> when left-most item is used do (X).
    /// So we find the left-most item and add an Action to it -> do (X) on use.
    /// </summary>
    /// <param name="game"></param>
    /// <exception cref="InvalidOperationException"></exception>
    internal virtual void Convert()
    {
        // Don't convert inactive enchantments.
        if (IsEnchantment && !IsEnchantmentActive)
        {
            return;
        }

        ArgumentNullException.ThrowIfNull(EffectOwner, "Owner must be set for this effect to be converted.");

        // Convert
        foreach (Condition condition in Conditions)
        {
            List<Subject> subjectsOfTheCondition = condition.GetSubjects(EffectOwner);
            foreach (Subject subject in subjectsOfTheCondition)
            {
                // The action has to be converted.
                // For example, The core: when you use an item to the left, charge me 1s
                // This loop is going over the items on the left.
                // While looping, it needs to attach: when I am used, charge The core 1s.       
                // So the action of this converted effect is to charge The core 1s.
                // The impact stays the same but the subject needs to be changed.
                ConvertedEffect convertedEffect = new(EResultPriority.Medium, condition.Trigger, Action.GetConverted(EffectOwner), Description, EffectOwner);
                subject.AddConvertedEffect(convertedEffect);
            }
        }
    }

    /// <summary>
    /// Returns a string that represents the current object.
    /// </summary>
    /// <returns>A string that represents the current object.</returns>
    public override string ToString()
    {
        return $"{Description}";
    }
}

/// <summary>
/// Parent class for stat effects.
/// </summary>
/// <param name="conditions"></param>
/// <param name="action"></param>
/// <param name="description"></param>
/// <param name="stat"></param>
public abstract class EffectStat : Effect
{
    /// <summary>
    /// The stat that the effect defines.
    /// </summary>
    public EStat Stat { get; init; }

    /// <summary>
    /// The value definition of the stat.
    /// </summary>
    public ValueDefinition ValueDefinition => (Action.Impact as ImpactStat)?.ValueDefinition
        ?? throw new InvalidOperationException("Action.Impact must be a StatImpact.");


    /// <summary>
    /// Creates a stat effect.
    /// </summary>
    /// <param name="condition"></param>
    /// <param name="action"></param>
    /// <param name="description"></param>
    /// <param name="stat"></param>
    /// <exception cref="InvalidOperationException"></exception>
    public EffectStat(EffectConditionSingle condition, Action action, string description, EStat stat, Object? enchantment = null)
        : base(condition, action, description, enchantment)
    {
        // Validation
        if (action.Impact is not ImpactStat)
        {
            throw new InvalidOperationException("Stat effects must have a StatImpact.");
        }

        Stat = stat;
    }

    internal override void Convert()
    {
        // Don't convert inactive enchantments.
        if (IsEnchantment && !IsEnchantmentActive)
        {
            return;
        }

        // Validation
        ArgumentNullException.ThrowIfNull(EffectOwner, "Owner must be set for this effect to be converted.");

        Subject subject = EffectOwner;
        EResultPriority priority = GetPriorityBasedOnStat(Stat);
        ConvertedEffect convertedEffect = new(priority, new TriggerOnItemUse(), Action.GetConverted(EffectOwner), Description, EffectOwner);
        subject.AddConvertedEffect(convertedEffect);
    }

    private static EResultPriority GetPriorityBasedOnStat(EStat stat)
    {
        // For now, all stats have a low priority.
        return EResultPriority.Low;
    }
}

/// <summary>
/// Represents an effect that defined an item stat.
/// 
/// </summary>
public class EffectStatUsage : EffectStat
{
    public EffectStatUsage(string description, EStat stat, Action action, object? enchantment = null)
        : base(
            condition: EffectCondition.WhenIAmUsed,
            // The action is a stat impact on any subject.
            action: action,
            description: description,
            stat: stat,
            enchantment: enchantment
        )
    {
        // The action must be a stat impact.
        if (action.Impact is not ImpactStatModify statImpact)
        {
            throw new InvalidOperationException("Action.Impact must be a StatImpact.");
        }

        // Stats used on items need to exclude certain items.
        // For instance, slow, haste, etc. can only be applied to cooldown items
        // so the subject definition neeeds to be updated to to exclude those items.
        // Excluding items without those stats will exclude all cooldown items.
        if (StatList.ItemBased.Contains(stat))
        {
            SubjectSelector subject = action.Subject;
            if (subject is not SubjectItems selector)
            {
                throw new InvalidOperationException("Subject must be an item selector.");
            }

            selector.ItemFilter.AddExcludeItemWithoutThisStat(statImpact.Stat);
        }

        // Validations
        if (!StatList.PlayerBased.Contains(stat) && !StatList.ItemBased.Contains(stat))
        {
            throw new InvalidOperationException($"Stat {stat} is not a valid usage stat.");
        }

    }
}

/// <summary>
/// Permanent stats are those with no on use effects.
/// </summary>
public class EffectStatPassive : EffectStat
{
    public EffectStatPassive(string description, EStat stat, ValueDefinition value, object? enchantment = null)
        : base(
            condition: EffectCondition.Permanent,
            action: new Action(
                subject: new SubjectThisItem(),
                impact: new ImpactStat(
                    stat: stat,
                    valueDefinition: value
                )
            ),
            description: description,
            stat: stat,
            enchantment: enchantment
        )
    {
        if (!StatList.Permanent.Contains(stat))
        {
            throw new InvalidOperationException($"Stat {stat} is not a valid passive stat.");
        }
    }
}

/// <summary>
/// Stats can be linked to enchantments.
/// </summary>
/// <param name="type"></param>
public readonly struct EnchantmentData(EEnchantment type, bool isActive = false)
{
    public EEnchantment Type { get; init; } = type;
    public bool IsActive { get; init; } = isActive;
}