/// <summary>
/// ValueDefinition (parent)
///    ValueDefinitionSingle (child) <see cref="ValueDefinitionSingle"/>
///    ValueDefinitionTiered (child) <see cref="ValueDefinitionTiered"/>
///    DerivedPlayerStatBasedValue (child) <see cref="DerivedPlayerStatBasedValue"/>
///    DerivedItemStatBasedValue (child) <see cref="DerivedItemStatBasedValue"/>
///    Count (child) <see cref="DerivedItemCountBasedValue"/>
///         DerivedItemCountWithMultiplerValue (GC) <see cref="DerivedItemCountWithMultiplerValue"/>
/// 
/// Defines a value that is commonly used to define stats.
/// These may also be used to define the impact of an action. Eg: Effect: (condition) => (action): (condition) => (lose 20% of max health)
/// So the value definition would be (20% of max health).
/// </summary>
public abstract class ValueDefinition
{
    /// <summary>
    /// Get the value of the stat.
    /// </summary>
    /// <param name="valueOwner">Derived values might require a reference to the owner.</param>
    /// <returns></returns>
    public abstract int GetValue(Placeable valueOwner);

    /// <summary>
    /// Modify the value of the stat.
    /// </summary>
    /// <param name="owner"></param>
    /// <param name="value"></param>
    /// <param name="operator"></param>
    internal abstract void ModifyValue(Item owner, int value, EOperator @operator);

    /// <summary>
    /// Get a duplicate of the current object.
    /// </summary>
    /// <returns></returns>
    internal abstract ValueDefinition Clone();

    internal virtual int GetCount(Placeable valueOwner)
    {
        throw new NotImplementedException("A count is not defined for this value.");
    }

    internal virtual bool HasCount()
    {
        return false;
    }

    /// <summary>
    /// Converts a value to a ValueDefinition.
    /// </summary>
    /// <param name="value"></param>
    /// <returns></returns>
    /// <exception cref="InvalidOperationException"></exception>
    public static ValueDefinition GetObjectAsValueDefinition(object value, object? count = null)
    {
        if (value is int intValue)
        {
            return new ValueDefinitionSingle(intValue, count != null
                ? GetObjectAsValueDefinition(count)
                : null);
        }

        if (value is int[] intArray)
        {
            return new ValueDefinitionTiered(intArray, count != null
                ? GetObjectAsValueDefinition(count)
                : null);
        }

        if (value is ValueDefinition valueDefinition)
        {
            return valueDefinition;
        }

        throw new InvalidOperationException($"Type {value.GetType()} is not supported.");
    }
}

/// <summary>
/// A basic value definition that returns a single value.
/// Typically used for HasteInternal, FreezeInternal, etc. These cooldown stats are not tiered.
/// </summary>
public class ValueDefinitionSingle : ValueDefinition
{
    /// <summary>
    /// The value for this definition.
    /// </summary>
    protected int Value { get; set; }

    public ValueDefinition? Count { get; init; }

    public ValueDefinitionSingle(int value, ValueDefinition? count = null)
    {
        Value = value;
        Count = count;
    }

    internal override ValueDefinition Clone()
    {
        return new ValueDefinitionSingle(Value, Count);
    }

    public override int GetValue(Placeable valueOwner)
    {
        return Value;
    }

    internal override int GetCount(Placeable valueOwner)
    {
        return (Count ?? throw new InvalidOperationException("Count is not defined for this value."))
            .GetValue(valueOwner);
    }

    internal override bool HasCount()
    {
        return Count != null;
    }

    internal override void ModifyValue(Item owner, int value, EOperator @operator) =>
        Value = @operator switch
        {
            EOperator.Add => Value + value,
            EOperator.Multiply => Value * value,
            EOperator.Divide => Value / value,
            EOperator.Subtract => Value - value,
            _ => throw new NotImplementedException($"Operator {@operator} is not implemented.")
        };
}

/// <summary>
/// A basic value definition that returns a value based on the tier of the owner.
/// </summary>
public class ValueDefinitionTiered(int[] values, ValueDefinition? count = null) : ValueDefinition
{
    public int[] Values { get; init; } = values;

    public ValueDefinition? Count { get; init; } = count;

    /// <summary>
    /// Get a duplicate of the current object.
    /// </summary>
    /// <returns></returns>
    internal override ValueDefinition Clone()
    {
        return new ValueDefinitionTiered((int[])Values.Clone(), Count);
    }

    public override int GetValue(Placeable valueOwner)
    {
        return Values[(int)valueOwner.Tier];
    }

    internal override int GetCount(Placeable valueOwner)
    {
        return (Count ?? throw new InvalidOperationException("Count is not defined for this value."))
            .GetValue(valueOwner);
    }

    internal override bool HasCount()
    {
        return Count != null;
    }

    internal override void ModifyValue(Item owner, int value, EOperator @operator) =>
        Values[(int)owner.Tier] = @operator switch
        {
            EOperator.Add => Values[(int)owner.Tier] + value,
            EOperator.Multiply => Values[(int)owner.Tier] * value,
            EOperator.Divide => Values[(int)owner.Tier] / value,
            EOperator.Subtract => Values[(int)owner.Tier] - value,
            _ => throw new NotImplementedException($"Operator {@operator} is not implemented.")
        };
}

/// <summary>
/// When the value is derived from a player stat.
/// </summary>
public class DerivedPlayerStatBasedValue(SubjectPlayer subjectPlayer, EStat statType, int[] values, EOperator op, int[]? baseValues = null) : ValueDefinition
{
    /// <summary>
    /// Final stat value = Derived value + Base value
    /// Other operators are not supported.
    /// </summary>
    private ValueDefinitionTiered BaseValues { get; init; } = new ValueDefinitionTiered(baseValues ?? DefaultBaseValues);

    /// <summary>
    /// Default base values.
    /// </summary>
    private static readonly int[] DefaultBaseValues = [0, 0, 0, 0];

    private SubjectPlayer SubjectPlayer { get; init; } = subjectPlayer;
    private EStat StatType { get; init; } = statType;
    private int[] Values { get; init; } = values;
    private EOperator Operator { get; init; } = op;

    /// <summary>
    /// We are modifying the base values.
    /// </summary>
    /// <param name="owner"></param>
    /// <param name="value"></param>
    /// <param name="operator"></param>
    internal override void ModifyValue(Item owner, int value, EOperator @operator)
    {
        BaseValues.ModifyValue(owner, value, @operator);
    }

    internal override ValueDefinition Clone()
    {
        return new DerivedPlayerStatBasedValue(
            subjectPlayer: SubjectPlayer,
            statType: StatType,
            values: (int[])Values.Clone(),
            op: Operator
        );
    }

    public override int GetValue(Placeable valueOwner)
    {
        // Get the player from the subject.
        Player player = SubjectPlayer.GetSubjects(valueOwner)[0] as Player
            ?? throw new InvalidOperationException("No valid Player found.");

        // Start with the base value.
        int value = BaseValues.GetValue(valueOwner);

        // Add the stat value of the player.
        value += player.GetStatValue(StatType);
        int factor = Values[(int)valueOwner.Tier];

        if (factor == 0 && Operator == EOperator.Divide)
        {
            throw new NotImplementedException("A stat was incorrectly set up as it resulted in a divide by zero.");
        }

        return Operator switch
        {
            EOperator.Add => value + factor,
            EOperator.Multiply => value * factor,
            EOperator.Divide => value / factor,
            EOperator.Subtract => value - factor,
            EOperator.Percentage => value * factor / 100,
            _ => throw new NotImplementedException($"Operator {Operator} is not implemented."),
        };
    }
}

/// <summary>
/// A derived value that is based on the items in a direction.
/// Final stat value = Derived value + Base value
/// </summary>
public class DerivedItemStatBasedValue(
    SubjectItems itemSelection, EStat statType, int[] values, EOperator op, int[]? baseValues = null
) : ValueDefinition
{
    /// <summary>
    /// Final stat value = Derived value + Base value
    /// Other operators are not supported.
    /// </summary>
    private ValueDefinitionTiered BaseValues { get; init; } = new ValueDefinitionTiered(baseValues ?? DefaultBaseValues);

    /// <summary>
    /// Default base values.
    /// </summary>
    private static readonly int[] DefaultBaseValues = [0, 0, 0, 0];

    /// <summary>
    /// The direction to use when selecting items.
    /// </summary>
    private SubjectItems ItemSelection { get; init; } = itemSelection;

    /// <summary>
    /// The same stat is applied to all items.
    /// </summary>
    private EStat StatType { get; init; } = statType;

    private int[] Values { get; init; } = values;
    private EOperator Operator { get; init; } = op;

    /// <summary>
    /// Gets the value of the derived stat.
    /// </summary>
    /// <param name="valueOwner"></param>
    /// <param name="game"></param>
    /// <returns></returns>
    /// <exception cref="NotImplementedException"></exception>
    public override int GetValue(Placeable valueOwner)
    {
        // Start with the base value.
        int total = BaseValues.GetValue(valueOwner);

        // Now start adding the stat values.
        // By default, sum the stat values.
        foreach (Subject subject in ItemSelection.GetSubjects(valueOwner))
        {
            total += subject.GetStatValue(StatType);
        }

        int factor = Values[(int)valueOwner.Tier];

        if (factor > total && Operator == EOperator.Subtract)
        {
            throw new NotImplementedException("Negative values are not supported.");
        }

        if (factor == 0 && Operator == EOperator.Divide)
        {
            throw new NotImplementedException("A stat was incorrectly set up as it resulted in a divide by zero.");
        }

        return Operator switch
        {
            EOperator.Add => total + factor,
            EOperator.Multiply => total * factor,
            EOperator.Divide => total / factor,
            EOperator.Subtract => total - factor,
            EOperator.Percentage => total * factor / 100,
            _ => throw new NotImplementedException($"Operator {Operator} is not implemented."),
        };
    }

    /// <summary>
    /// We are modifying the base values.
    /// </summary>
    /// <param name="owner"></param>
    /// <param name="value"></param>
    /// <param name="operator"></param>
    internal override void ModifyValue(Item owner, int value, EOperator @operator)
    {
        BaseValues.ModifyValue(owner, value, @operator);
    }

    internal override ValueDefinition Clone()
    {
        // Divyam: Fix, this item selection needs to be cloned.   
        return new DerivedItemStatBasedValue(
            itemSelection: ItemSelection,
            statType: StatType,
            values: (int[])Values.Clone(),
            op: Operator,
            baseValues: (int[])BaseValues.Values.Clone()
        );
    }
}

/// <summary>
/// A value definition that returns the count of subjects.
/// Later, this can be combined with the above class.
/// </summary>
/// <param name="itemSelection"></param>
public class DerivedItemCountBasedValue(SubjectItems itemSelection, ECount count = ECount.NumberOfItems) : ValueDefinition
{
    /// <summary>
    /// The direction to use when selecting items.
    /// </summary>
    private ECount Count { get; init; } = count;

    protected SubjectItems ItemSelection { get; init; } = itemSelection;

    public override int GetValue(Placeable valueOwner)
    {
        if (Count == ECount.NumberOfItems)
        {
            return ItemSelection.GetSubjects(valueOwner).Count;
        }

        if (Count == ECount.UniqueTypes)
        {
            HashSet<EItem> uniqueTypes = [];
            foreach (Item subject in ItemSelection.GetItems(valueOwner))
            {
                foreach (EItem type in subject.ItemTypes)
                {
                    uniqueTypes.Add(type);
                }
            }
        }

        throw new NotImplementedException($"Count type {Count} is not implemented.");
    }

    internal override void ModifyValue(Item owner, int value, EOperator @operator)
    {
        throw new InvalidOperationException("Currently not set up. Should add a base and set this up.");
    }

    internal override ValueDefinition Clone()
    {
        // Divyam: Fix, this item selection needs to be cloned.
        return new DerivedItemCountBasedValue(ItemSelection);
    }
}

public class DerivedItemCountWithMultiplerValue(SubjectItems itemSelection, int[] multipliers)
    : DerivedItemCountBasedValue(itemSelection)
{
    private int[] Values { get; init; } = multipliers;

    public override int GetValue(Placeable valueOwner)
    {
        return ItemSelection.GetSubjects(valueOwner).Count;
    }

    internal override void ModifyValue(Item owner, int value, EOperator @operator)
    {
        throw new InvalidOperationException("Currently not set up. Should add a base and set this up.");
    }

    internal override ValueDefinition Clone()
    {
        // Divyam: Fix, this item selection needs to be cloned.
        return new DerivedItemCountWithMultiplerValue(ItemSelection, Values);
    }
}