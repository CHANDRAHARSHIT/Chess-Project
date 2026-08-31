public class AmmoItem : CooldownItem
{
    public AmmoItem(string name, EItem[] types, ESize size, ETier startingTier, ECollection collection, Effect[] effects)
    : base(types, size, name, startingTier, collection, effects)
    {
    }

    public override void UseItem()
    {
        // If empty, do not use the item.
        if (GetStatValue(EStat.Ammo) == 0)
        {
            return;
        }

        // Otherwise, decrease the ammo and use the item.
        // Use the stat class to modify as that will handle any related mechanics or events.
        Stats.ModifyStat(EStat.Ammo, 1, EOperator.Subtract);
        base.UseItem();
    }
}