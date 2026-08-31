using NUnit.Framework;


/// <summary>
/// Tests for the ValueDefinition class. <see cref="ValueDefinition"/>
/// 
/// 1. SingleValueDefinition
/// 2. TieredValueDefinition
/// 3. DerivedPlayerStatBasedValue
///     A. Test The Boulder deals MaxHealth damage to the opposing player. <see cref="TheBoulderUsesOpposingPlayerMaxHealthForDamage"/>
/// 4. DerivedItemStatBasedValue
/// 5. Count
///     DerivedItemCountWithMultiplerValue 
/// 
/// </summary>
[TestFixture]
public class ValueDefinitionTests : BaseTest
{

    /// <summary>
    /// 3A. The Boulder deals MaxHealth damage to the opposing player.
    /// </summary>
    [Test]
    public void TheBoulderUsesOpposingPlayerMaxHealthForDamage()
    {
        // Arrange
        Game game = Game.Instance;
        Mechanics.SandstormStartsAfterMS = 30000;

        // Change Max Health for both players
        game.PlayerTop.ModifyStat(EStat.MaxHealth, 600, EOperator.Add);
        game.PlayerBottom.ModifyStat(EStat.MaxHealth, 400, EOperator.Add);

        // The health remains unchanged
        int topHealth = game.PlayerTop.GetStatValue(EStat.Health);
        int bottomHealth = game.PlayerBottom.GetStatValue(EStat.Health);


        int topDamage = game.PlayerTop.GetStatValue(EStat.MaxHealth);
        int bottomDamage = game.PlayerBottom.GetStatValue(EStat.MaxHealth);

        // Place TheBoulder on both sides
        game.Place(ItemFactory.TheBoulder);
        game.PlaceForTopSide(ItemFactory.TheBoulder);

        // Act
        game.Run();

        // Assert
        int finalTopHealth = topHealth - topDamage;
        int finalBottomHealth = bottomHealth - bottomDamage;

        Assert.That(game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(finalTopHealth));
        Assert.That(game.PlayerBottom.GetStatValue(EStat.Health), Is.EqualTo(finalBottomHealth));
    }
}