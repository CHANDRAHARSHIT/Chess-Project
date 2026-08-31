/// <summary>
/// Placeable (Parent)
///     Item (Child) 
///         CooldownItem (Grandchild)
///         InstantItem (Grandchild)
///
/// Skills and Items are called placeables because they can be placed on the containers: Playmat, Chest, and SkillDeck.
/// </summary>
public abstract class Placeable : Subject
{
    /// <summary>
    /// The minimum tier that the item can be.
    /// </summary>
    public ETier StartingTier { get; init; }

    /// <summary>
    /// The current tier of the placeable.
    /// The current tier of the item. This can never be lower than the starting tier.
    /// </summary>
    public ETier Tier { get; private set; }

    /// <summary>
    /// The players who owns this placeable.
    /// </summary>
    public Player? PlayerOwner { get; set; }

    /// <summary>
    /// The collection that the placeable belongs to.
    /// Usually refers to the hero that the item belongs to.
    /// </summary>
    public ECollection Collection { get; init; }

    /// <summary>
    /// The effects that the placeable has.
    /// </summary>
    public List<Effect> Effects { get; init; }

    /// <summary>
    /// Constructor for the placeable.
    /// </summary>
    /// <param name="name"></param>
    /// <param name="startingTier"></param>
    /// <param name="collection"></param>
    /// <param name="effects"></param>
    protected Placeable(string name, ETier startingTier, ECollection collection, Effect[] effects) : base(name)
    {
        StartingTier = startingTier;
        Tier = startingTier;
        Collection = collection;
        Effects = [.. effects];
        Effects.ForEach(Effect => Effect.EffectOwner = this);
    }

    /// <summary>
    /// Adds an effect to the placeable.
    /// </summary>
    /// <param name="effect"></param>
    public void AddEffect(Effect effect)
    {
        Effects.Add(effect);
    }

    /// <summary>
    /// Upgrades the placeable and returns it.
    /// </summary>
    /// <returns></returns>
    /// <exception cref="System.Exception"></exception>
    public virtual Placeable Upgrade()
    {
        Tier = Tier switch
        {
            ETier.Bronze => ETier.Silver,
            ETier.Silver => ETier.Gold,
            ETier.Gold => ETier.Diamond,
            ETier.Diamond => throw new System.Exception($"{Name} is already at the highest tier."),
            _ => throw new System.Exception("Invalid tier.")
        };

        return this;
    }

    /// <summary>
    /// Increases the usage of the stat.
    /// </summary>
    /// <param name="value"></param>
    /// <param name="v"></param>
    internal abstract void IncreaseUsage(EStat value, int v);

    /// <summary>
    /// Get the string representation of the placeable.
    /// </summary>
    /// <returns></returns>
    public override string ToString()
    {
        return $"{Name}";
    }
}