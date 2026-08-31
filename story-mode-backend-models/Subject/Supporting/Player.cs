using System.Text.Json;

/// <summary>
/// Main class that holds all the information about the player.
/// 
/// Player (parent)
///    - Hero (child)
///    - Monster (child)
///    - Empty (child)
/// </summary>
public abstract class Player : Subject
{
    /// <summary>
    /// Stores the items that are in play.
    /// </summary>
    public readonly Playmat Playmat;

    /// <summary>
    /// Items in storage are kept in the chest.
    /// They may have passive effects that influence the game.
    /// </summary>
    public readonly Chest Chest;

    /// <summary>
    /// The skills are stored here.
    /// </summary>
    public readonly SkillDeck SkillDeck;

    /// <summary>
    /// The stats of the player.
    /// </summary>
    private readonly PlayerStats Stats;

    /// <summary>
    /// The collection that this player belongs to.
    /// Some collections are also hero collections: Dooley, Vanessa. 
    /// So these are used as hero names.
    /// </summary>
    public ECollection Collection { get; init; }

    // Properties
    // Remove this: Jimmy
    public int HealthLost => GetStatValue(EStat.MaxHealth) - GetStatValue(EStat.Health);

    // Convenience methods
    internal override int GetStatValue(EStat statType) { return Stats.GetStatValue(statType); }
    internal override void ModifyStat(EStat stat, int value, EOperator @operator, Placeable? initiator = null, EStat? initiatorStat = null)
    { Stats.ModifyStat(stat, value, @operator, initiator, initiatorStat); }
    internal Dictionary<EStat, int> GetStats() { return Stats.GetStats(); }
    internal Dictionary<EStat, int> GetTotals() { return Stats.GetTotals(); }
    internal int GetTotal(EStat stat) { return Stats.GetTotal(stat); }
    internal void TakeDamage(int value) { Stats.TakeDamage(value); }
    internal void Heal(int value) { Stats.Heal(value); }

    /// <summary>
    /// Constructor: Sets up a player with the given items, skills, and stats.
    /// </summary>
    /// <param name="name"></param>
    /// <param name="playmat"></param>
    /// <param name="chest"></param>
    /// <param name="skillDeck"></param>
    /// <param name="stats"></param>
    public Player(string name, ECollection collection, Playmat? playmat = null, Chest? chest = null, SkillDeck? skillDeck = null, PlayerStats? stats = null)
        : base(name)
    {
        Collection = collection;
        Playmat = playmat ?? new Playmat();
        Chest = chest ?? new Chest();
        SkillDeck = skillDeck ?? new SkillDeck();
        Stats = stats ?? new PlayerStats();
        Stats.Player = this;
    }

    /// <summary>
    /// Resets the player's properties to their default values.
    /// </summary>
    public void Reset()
    {
        // This should reset the items to their original state instead of clearing them.
        Playmat.Reset();
        Stats.Reset();
        ConvertedEffects.Clear(); // Clearing the converted effects.
        // SkillDeck.Reset(); // Divyam: Add this
    }

    /// <summary>
    /// Gets the as a string.
    /// </summary>
    /// <returns></returns>
    /// 
    public override string ToString()
    {
        return $"{Name}\n{Stats}\n{Playmat}\n{SkillDeck}";
    }

    /// <summary>
    /// Converts the player data to JSON format.
    /// </summary>
    /// <returns>The player data in JSON format.</returns>
    public virtual string ToJson()
    {
        // if (this is EmptyPlayer)
        // {
        //     return JsonSerializer.Serialize(new { Message = "Player has not been set." }, new JsonSerializerOptions { WriteIndented = true });
        // }

        var playerJson = new
        {
            Name,
            Stats = JsonSerializer.Deserialize<object>(Stats.ToJson()),
            Playmat = JsonSerializer.Deserialize<object>(Playmat.ToJson()),
            SkillDeck = JsonSerializer.Deserialize<object>(SkillDeck.ToJson())
        };

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
        };

        return JsonSerializer.Serialize(playerJson, options);
    }
}