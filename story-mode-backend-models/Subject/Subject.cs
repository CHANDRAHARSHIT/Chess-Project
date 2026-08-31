/// <summary>
/// The top most class in the hierarchy. 
/// 
/// Subject (Parent)  - stats is at this level
///   Player (Child)
///       Hero (GC)
///       Monster (GC)
///   Placeable (Child)
///       Skill (GC)
///       Item (GC)
///          CooldownItem (GGC)
///          InstantItem (GGC)
///          
/// </summary>
public abstract class Subject(string name)
{
    /// <summary>
    /// The name of the subject.
    /// </summary>
    public string Name { get; init; } = name;

    /// <summary>
    /// The converted effects that the placeable has.
    /// </summary>
    public List<ConvertedEffect> ConvertedEffects = [];

    /// <summary>
    /// Adds a converted effect to the placeable.
    /// </summary>
    /// <param name="effect"></param>
    public void AddConvertedEffect(ConvertedEffect effect)
    {
        ConvertedEffects.Add(effect);
    }

    /// <summary>
    /// Gets the stat value of the subject.
    /// </summary>
    /// <param name="statType"></param>
    /// <returns></returns>
    internal abstract int GetStatValue(EStat statType);

    /// <summary>
    /// Modifies the stat associated with this subject.
    /// </summary>
    /// <param name="stat"></param>
    /// <param name="v"></param>
    /// <param name="operator"></param>
    /// <param name="initiator"></param>
    /// <param name="initiatorStat"></param>
    internal abstract void ModifyStat(EStat stat, int v, EOperator @operator, Placeable? initiator = null, EStat? initiatorStat = null);
}