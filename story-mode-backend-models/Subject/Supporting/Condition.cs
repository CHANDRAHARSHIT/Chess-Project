/// <summary>
/// Condition (Parent) <see cref="Condition"/>
///   ConditionWithSubject (Child) <see cref="ConditionWithSubject"/>
///   
/// All conditions have a trigger. The trigger represents when the condition should be checked.
/// For instance, start of combat trigger indicates that the condition should be checked at the start of combat.
/// A permanent trigger indicates that the condition should be checked before combat starts.
///
/// Effect:
/// condition => action
///
/// Conditions can be further broken down to:
/// When (subject) are (triggered)
///
/// All conditions can be defined this way:
/// Examples:
/// When (I) am (hasted)
/// When (I) am (used)
/// When (Items) are (used)
/// When (Player) (doesSomeAction) (additionalConditionsForAction)
/// When (Opponent) (doesSomeAction) (additionalConditionsForAction)
///
/// Items can be further broken down to:
/// Items => (Direction) (Type)
///     When (all) (cores) ...
///     when (all-other) (techs) ...
///
/// One of the most complex conditions was for a Pyg item:
/// When you purchase a item with a new type, (action)
/// So this condition had to track the purchase history.
/// </summary>
/// <remarks>
/// Creates a new Condition with the specified trigger.
/// </remarks>
/// <param name="trigger"></param>
public class Condition(Trigger trigger)
{
    /// <summary>
    /// All conditions have a trigger.
    /// </summary>
    public Trigger Trigger { get; init; } = trigger;

    public virtual List<Subject> GetSubjects(Placeable reference)
    {
        return [];
    }
}

/// <summary>
/// A condition with a subject.
/// </summary>
/// <remarks>
/// Creates a new Condition with the specified subject and trigger.
/// </remarks>
/// <param name="subject"></param>
/// <param name="trigger"></param>
public class ConditionWithSubject(SubjectSelector subject, Trigger trigger) : Condition(trigger)
{
    /// <summary>
    /// Conditions such as "When (Weapons) are (triggered)" has a subject: Weapons
    /// </summary>
    private SubjectSelector EffectSubjectSelector { get; init; } = subject;

    /// <summary>
    /// Get the subjects of the condition.
    /// </summary>
    /// <param name="reference"></param>
    /// <returns></returns>
    public override List<Subject> GetSubjects(Placeable reference)
    {
        return EffectSubjectSelector.GetSubjects(reference);
    }
}
