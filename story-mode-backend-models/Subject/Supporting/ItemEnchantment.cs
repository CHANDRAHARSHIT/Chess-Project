public class ItemEnchantment
{
    /// <summary>
    /// The item that the enchantment is applied to.
    /// </summary>
    protected Item Item { get; init; }

    /// <summary>
    /// The maximum number of enchantments that can be applied to the item.
    /// Currently, this is set to 1.
    /// </summary>
    public int MaxEnchantments => Item.GetStatValue(EStat.MaxEnchantments);

    private Dictionary<EEnchantment, Effect> ActiveEnchantments { get; init; }
    private Dictionary<EEnchantment, Effect> InactiveEnchantments { get; init; }

    public ItemEnchantment(Item item, Effect[] effects)
    {
        Item = item;
        ActiveEnchantments = [];
        InactiveEnchantments = [];

        foreach (Effect effect in effects)
        {
            if (effect.IsEnchantment)
            {
                EEnchantment type = effect.EnchantmentType;
                bool isActive = effect.IsEnchantmentActive;

                if (isActive)
                {
                    if (ActiveEnchantments.ContainsKey(type))
                    {
                        throw new InvalidOperationException("Duplicate definitions are not allowed.");
                    }

                    ActiveEnchantments.Add(type, effect);
                }
                else
                {
                    if (InactiveEnchantments.ContainsKey(type))
                    {
                        throw new InvalidOperationException("Duplicate definitions are not allowed.");
                    }

                    InactiveEnchantments.Add(type, effect);
                }
            }

        }
    }

    public Item Enchant(EEnchantment type)
    {
        if (ActiveEnchantments.ContainsKey(type))
        {
            throw new InvalidOperationException($"The enchantment {type} is already active on this item.");
        }

        if (!InactiveEnchantments.ContainsKey(type))
        {
            throw new InvalidOperationException($"The enchantment {type} is not available for this item.");
        }

        // Remove an enchantment if there is no room.
        if (ActiveEnchantments.Count == MaxEnchantments)
        {
            // Remove the first enchantment.
            EEnchantment removedEnchantment = ActiveEnchantments.Keys.First();
            ActiveEnchantments.Remove(removedEnchantment);
            InactiveEnchantments.Add(removedEnchantment, ActiveEnchantments[removedEnchantment]);
        }

        return Item;
    }

    internal EEnchantment[] GetActiveEnchantments()
    {
        return [.. ActiveEnchantments.Keys];
    }

    internal EEnchantment[] GetInactiveEnchantments()
    {
        return [.. InactiveEnchantments.Keys];
    }
}