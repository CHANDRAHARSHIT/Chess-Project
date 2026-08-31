/// <summary>
/// Represents a skill that can be placed on the skill deck.
/// </summary>
public class Skill(string name, ETier startingTier, ECollection collection, Effect[] effects) : Placeable(name, startingTier, collection, effects)
{
    /// <summary>
    /// Skills do not have stats.
    /// </summary>
    /// <param name="statType"></param>
    /// <returns></returns>
    /// <exception cref="InvalidOperationException"></exception>
    internal override int GetStatValue(EStat statType)
    {
        throw new NotImplementedException();
    }

    internal override void ModifyStat(EStat stat, int v, EOperator @operator, Placeable? initiator = null, EStat? initiatorStat = null)
    {
        throw new NotImplementedException();
    }

    internal override void IncreaseUsage(EStat value, int v)
    {
        // throw new InvalidOperationException("Currently, skills are not set up to track usage.");
    }

    /// <summary>
    /// Upgrades the placeable and returns it.
    /// </summary>
    /// <returns></returns>
    /// <exception cref="System.Exception"></exception>
    public override Skill Upgrade()
    {
        return (base.Upgrade() as Skill) ?? throw new InvalidOperationException("This item is likely fully upgraded.");
    }
}





