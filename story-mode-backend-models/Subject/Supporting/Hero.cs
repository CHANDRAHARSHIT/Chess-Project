/// <summary>
/// Class structure:
/// Player (parent)
///    - Hero (child) <see cref="Hero"/>
///    - Monster (child) <see cref="Monster"/>
/// </summary>
public class Hero : Player
{
    public Hero(ECollection hero, PlayerStats? stats = null) : base(name: hero.ToString(), collection: hero, stats: stats)
    {
    }

    public Hero(ECollection hero, Playmat playmat, Chest chest, SkillDeck skillDeck, PlayerStats stats) : base(name: hero.ToString(), collection: hero, playmat: playmat, chest: chest, skillDeck: skillDeck, stats: stats)
    {
    }
}
