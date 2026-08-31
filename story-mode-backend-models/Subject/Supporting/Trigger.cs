/// <summary>
/// Triggers are used to define conditions which are the first part of an effect.
/// 
/// Trigger (parent) <see cref="Trigger"/>
///     TriggerPermanently (child) <see cref="TriggerPermanently"/>
///     TriggerOnItemUse (child) <see cref="TriggerOnItemUse"/>
///     TriggerOnStartOfCombat (child) <see cref="TriggerOnStartOfCombat"/>
///     TriggerOnFirstTimeOccurrence (child) <see cref="TriggerOnFirstTimeOccurrence"/>
///     TriggerOnStatIncrease (child) <see cref="TriggerOnStatIncrease"/>
///     TriggerOnStatDecrease (child) <see cref="TriggerOnStatDecrease"/>
///     TriggerOnBuy (child) <see cref="TriggerOnBuy"/>
///     TriggerOnSell (child) <see cref="TriggerOnSell"/>
///     TriggerWinFight (child) <see cref="TriggerWinFight"/>
///     TriggerLoseFight (child) <see cref="TriggerLoseFight"/>
///     TriggerStartOfHour (child) <see cref="TriggerStartOfHour"/>
///     TriggerStartOfDay (child) <see cref="TriggerStartOfDay"/>
///     TriggerOnCrit (child) <see cref="TriggerOnCrit"/>
///     TriggerOnItemDestroy (child) <see cref="TriggerOnItemDestroy"/>
/// 
/// </summary>
public abstract class Trigger(Equation? equation = null)
{
    /// <summary>
    /// All triggers can be set up up with an equation.
    /// Equations are mathematical conditions. <see cref="Equation"/>
    /// </summary>
    private Equation? Equation { get; init; } = equation;

    /// <summary>
    /// Checks if the trigger is met.
    /// </summary>
    /// <param name="effectOwner"></param>
    /// <returns></returns>
    public bool IsMet(Placeable effectOwner)
    {
        return Equation == null || Equation.IsTrue(effectOwner);
    }

    /// <summary>
    /// Refactor, look at using inheritance here so we don't have to do such explicit checks.
    /// There should be a generic "matches" behavior that manages this.
    /// Possibly, this can be part of the isMet check.
    /// </summary>
    /// <param name="firstTimeFlag"></param>
    /// <returns></returns>
    public virtual bool IsFirstTimeOccurrenceTrigger(EFirstTimeFlags firstTimeFlag)
    {
        return false;
    }
}


public class TriggerPermanently(Equation? equation = null) : Trigger(equation)
{

}

public class TriggerOnItemUse(Equation? equation = null) : Trigger(equation)
{
}

public class TriggerOnStartOfCombat(Equation? equation = null) : Trigger(equation)
{
}

public class TriggerOnFirstTimeOccurrence(EFirstTimeFlags firstTimeFlag) : Trigger
{
    public EFirstTimeFlags FirstTimeFlag = firstTimeFlag;

    public override bool IsFirstTimeOccurrenceTrigger(EFirstTimeFlags firstTimeFlag)
    {
        return FirstTimeFlag == firstTimeFlag;
    }
}

public abstract class TriggerOnStatChange(EStat stat, EOperator @operator, Equation? equation = null) : Trigger(equation)
{
    public EStat Stat { get; init; } = stat;
    public EOperator Operator { get; init; } = @operator;
}

public class TriggerOnStatIncrease(EStat stat) : TriggerOnStatChange(stat, EOperator.Add)
{
}

public class TriggerOnStatDecrease : TriggerOnStatChange
{
    private static readonly List<EStat> InvalidStats = [
        EStat.HasteInternal,
        EStat.ChargeInternal,
        EStat.FreezeInternal,
        EStat.SlowInternal,
        EStat.Burn,
        EStat.Poison,
    ];

    public TriggerOnStatDecrease(EStat stat, Equation? equation = null) : base(stat, EOperator.Subtract, equation)
    {
        Stat = stat;
        // Due to the internal implementation of these stats, they are decreased per interval and therefore
        // cannot be used for an OnDecrease trigger. We would have to disable the trigger checks when
        // stats are decreased during item use if we need to allow these in the future.
        // Burn and poison have a similar issue. Burn decreases naturally and poison decreases on heal.
        // These will likely have to be excluded if we want to allow them in the future.
        if (InvalidStats.Contains(stat))
        {
            throw new ArgumentException($"The stat {stat} cannot be used for an OnDecrease trigger.");
        }
    }
}

public class TriggerOnBuy : Trigger
{
}
public class TriggerOnSell : Trigger
{
}

public class TriggerWinFight : Trigger
{
}

public class TriggerLoseFight : Trigger
{
}

public class TriggerStartOfHour : Trigger
{
}

public class TriggerStartOfDay : Trigger
{
}

// TODO-j: Fix, does nothing
public class TriggerOnCrit : Trigger
{
}

public class TriggerOnItemDestroy : Trigger
{
}