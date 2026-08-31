/// <summary>
/// Class structure:
/// Player (parent)
///    - Hero (child)
///    - Monster (child)
///    - Empty (child)
/// </summary>
/// <remarks>
/// Constructor for the monster.
/// </remarks>
/// <param name="day"></param>
/// <param name="name"></param>
/// <param name="playmat"></param>
/// <param name="chest"></param>
/// <param name="skillDeck"></param>
/// <param name="stats"></param>
public class Monster : Player
{
    /// <summary>
    /// The day the monster appears.
    /// </summary>
    public int Day { get; init; }

    /// <summary>
    /// Constructor for the monster.
    /// </summary>
    /// <param name="day"></param>
    /// <param name="name"></param>
    /// <param name="playmat"></param>
    /// <param name="chest"></param>
    /// <param name="skillDeck"></param>
    /// <param name="stats"></param>
    public Monster(int day, string name, Playmat playmat, Chest chest, SkillDeck skillDeck, PlayerStats stats)
        : base(name, ECollection.Monster, playmat, chest, skillDeck, stats)
    {
        Day = day;
        playmat.CenterItemsPlacedToLeft();
    }

    public override string ToJson()
    {
        return base.ToJson();
    }
}