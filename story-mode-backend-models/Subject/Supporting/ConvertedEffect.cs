/// <summary>
/// Converted effects must be linked to a Subject.
/// When any action is performed on that Subject, we loop through its list of ConvertedEffects and run those that match the trigger.
/// For instance, an item might have have a ConvertedEffect: When I am hasted, do (X).
/// When the item's haste stat is increased, we would trigger (X).
/// </summary>
/// <remarks>
/// Creates a new ConvertedEffect with the specified trigger, action, description, and effect owner.
/// </remarks>
/// <param name="priority"></param>
/// <param name="trigger"></param>
/// <param name="action"></param>
/// <param name="description"></param>
/// <param name="effectOwner"></param>
public class ConvertedEffect(EResultPriority priority, Trigger trigger, Action action, string description, Placeable effectOwner)
{
    /// <summary>
    /// The priority determines the sequence this will take when being processed.
    /// </summary>
    public EResultPriority Priority { get; init; } = priority;

    /// <summary>
    /// The trigger of the converted effect.
    /// </summary>
    public Trigger Trigger { get; init; } = trigger;

    /// <summary>
    /// The action of the converted effect.
    /// </summary>
    public Action Action { get; init; } = action;

    /// <summary>
    /// The description of the converted effect.
    /// </summary>
    public string Description { get; init; } = description;

    /// <summary>
    /// The owner of the effect.
    /// The main purpose of this is that actions may contain a set of values [1,2,3,4] and we need to select the correct one
    /// based on the owner's tier.
    /// </summary>
    public Placeable EffectOwner { get; internal set; } = effectOwner;

    /// <summary>
    /// Add the converted effect to the queue.
    /// </summary>
    internal void AddToQueue()
    {
        ResultConvertedEffectTriggered result = new(this);
        Game.Instance.Queue.Add(result);
    }

    /// <summary>
    /// Get the string representation of the ConvertedEffect.
    /// </summary>
    /// <returns></returns>
    public override string ToString()
    {
        return $"Converted: {Description}";
    }
}