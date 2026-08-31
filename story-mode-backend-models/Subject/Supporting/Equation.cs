/// <summary>
/// Conditions such as:
///  - If you have one weapon
///  - For each adjacent weapon, do X
/// </summary>
public class Equation(ValueDefinition left, ValueDefinition right, EComparisonOperator op)
{
    private ValueDefinition LeftValue { get; init; } = left;
    private ValueDefinition RightValue { get; init; } = right;
    private EComparisonOperator ComparisonOperator { get; init; } = op;

    public bool IsTrue(Placeable reference)
    {
        return ComparisonOperator switch
        {
            EComparisonOperator.Equal => LeftValue.GetValue(reference) == RightValue.GetValue(reference),
            EComparisonOperator.NotEqual => LeftValue.GetValue(reference) != RightValue.GetValue(reference),
            EComparisonOperator.Greater => LeftValue.GetValue(reference) > RightValue.GetValue(reference),
            EComparisonOperator.GreaterOrEqual => LeftValue.GetValue(reference) >= RightValue.GetValue(reference),
            EComparisonOperator.Less => LeftValue.GetValue(reference) < RightValue.GetValue(reference),
            EComparisonOperator.LessOrEqual => LeftValue.GetValue(reference) <= RightValue.GetValue(reference),
            _ => throw new NotImplementedException($"Operator {ComparisonOperator} is not implemented."),
        };
    }
}