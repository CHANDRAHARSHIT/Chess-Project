/// <summary>
/// This class handles the cooldown mechanics.
/// Cooldown involves: Charge, Haste, Slow, Freeze, Ammo.
///
/// 
/// Pending:
/// If an item is charged at the same time it completes its use, does it charge? And: Yes
/// (Divyam: Ensure there is a test for this)
/// </summary>
public class CooldownItem : Item
{
    /// <summary>
    /// The current cooldown progress of the item in milliseconds.
    /// </summary>
    public int CurrentCooldownProgress { get; set; } = 0;

    /// <summary>
    /// The cooldown threshold of the item in milliseconds. The item is used when the cooldown reaches this threshold.
    /// This is calculated based on the current tier of the item.
    /// </summary>
    public int Cooldown => Stats.GetValue(EStat.CooldownInternal);

    /// <summary>
    /// Constructor for the CooldownItem class.
    /// </summary>
    public CooldownItem(EItem[] types, ESize size, string name, ETier startingTier, ECollection collection, Effect[] effects)
        : base(types, size, name, startingTier, collection, effects)
    {
    }

    /// <summary>
    /// Increases the cooldown of the item.
    /// The final amount that the cooldown progresses can exceed the interval.
    /// </summary>
    public void IncreaseCooldownByOneInterval()
    {
        // First, validate the current value.
        // Due to slow mechanics, the progress can be half an interval, so we multiply it by 2.
        if (CurrentCooldownProgress * Mechanics.SlowDivisionFactor % Mechanics.IntervalMS != 0)
        {
            throw new InvalidOperationException("The cooldown progress must be a multiple of the interval.");
        }

        // The cooldown is being increased by one interval.
        int duration = Mechanics.IntervalMS;


        // Handle freeze.
        // If an item is frozen, it cannot progress its cooldown (except through charge)
        // Frozen items still lose haste and slow counters.
        bool isFrozen = false;
        int freezeDuration = GetStatValue(EStat.FreezeInternal);
        if (freezeDuration > 0)
        {
            ModifyStat(EStat.FreezeInternal, Mechanics.IntervalMS, EOperator.Subtract);
            duration = 0;
            isFrozen = true;
        }

        // Apply haste.
        if (GetStatValue(EStat.HasteInternal) > 0)
        {
            ModifyStat(EStat.HasteInternal, Mechanics.IntervalMS, EOperator.Subtract);

            // Skip the duration changes for haste if an item is frozen.
            if (!isFrozen)
            {
                duration *= Mechanics.HasteMultiplicationFactor;
            }
        }

        // Apply slow.
        if (GetStatValue(EStat.SlowInternal) > 0)
        {
            ModifyStat(EStat.SlowInternal, Mechanics.IntervalMS, EOperator.Subtract);

            // Skip the duration changes for slow if an item is frozen.
            if (!isFrozen)
            {
                duration /= Mechanics.SlowDivisionFactor;
            }
        }

        // Finally, progress the cooldown.
        // This accounts for other additional mechanics like: Ammo
        IncreaseCooldown(duration);

        // Use the item, if the cooldown has reached the threshold.
        // Later, this will need to account for internal cooldowns.
        // Items can be used a maximum of 5 times per second.
        if (CurrentCooldownProgress >= Cooldown)
        {
            // Trigger the use of the item.
            UseItem();
            ResetCooldown();
        }

        // Through normal progression, the item cannot be used more than once per interval.
        // If it an ammo item that ran out of ammo, its cooldown will be held at the threshold.
        if (CurrentCooldownProgress > Cooldown)
        {
            throw new InvalidOperationException("The interval is likely too large.");
        }
    }


    /// <summary>
    /// Generates results and adds them to the queue for processing.
    /// All the processing in this function must be done through the queue.
    /// The queue itself should not be calling this function. It is setup to be called during the clock progression for the game.
    /// </summary>
    public virtual void UseItem()
    {
        // Destroyed items cannot be used
        if (IsDestroyed)
        {
            return;
        }

        // When an item is used, don't reset its cooldown as this may have been trigger via effects.

        // Item is used 1 additional time per multicast.
        for (int i = 0; i < Stats.GetValue(EStat.Multicast) + 1; i++)
        {
            UseItemOnce();
        }
    }

    /// <summary>
    /// Uses the item once. 
    /// When multicasted, this should be called per cast.
    /// </summary>
    private void UseItemOnce()
    {
        // Increase the usage count.
        IncreaseUsage(EStat.TimesUsed, 1);

        // To use an item, trigger Converted effects with an OnUse trigger.
        // This will also handle the stat applications of the item.
        foreach (ConvertedEffect convertedEffect in ConvertedEffects)
        {
            if (convertedEffect.Trigger is TriggerOnItemUse)
            {
                Game.Instance.Queue.Add(new ResultConvertedEffectTriggered(convertedEffect));
            }
        }

        // Console.WriteLine($"{this.Name} was used at {Game.Instance.GetElapsedTime() / 1000.0:0.0}s.");
    }

    /// <summary>
    /// Increases the cooldown of the item by the given value.
    /// The progress cannot exceed the cooldown threshold.
    /// </summary>
    /// <param name="amount"></param>
    /// <param name="item"></param>
    public void IncreaseCooldown(int amount)
    {
        CurrentCooldownProgress += amount;

        if (CurrentCooldownProgress > Cooldown)
        {
            CurrentCooldownProgress = Cooldown;
        }
    }

    /// <summary>
    /// Resets the cooldown of the item.
    /// </summary>
    public void ResetCooldown()
    {
        CurrentCooldownProgress = 0;
    }

    /// <summary>
    /// Decreases the cooldown of the item by the given value, if able.
    /// </summary>
    public void DecreaseCooldown(int value)
    {
        CurrentCooldownProgress -= value;

        if (CurrentCooldownProgress < 0)
        {
            throw new InvalidOperationException("The cooldown cannot be negative.");
        }
    }
}
