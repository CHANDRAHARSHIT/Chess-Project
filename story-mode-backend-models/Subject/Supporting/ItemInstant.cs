/// <summary>
/// Instant items do not have a cooldown.
/// </summary>
public class ItemInstant : Item
{
    public ItemInstant(EItem[] types, ESize size, string name, ETier startingTier, ECollection collection, Effect[] effects)
        : base(types, size, name, startingTier, collection, effects)
    {

    }

    public override string ToString()
    {
        return base.ToString();
    }
}
