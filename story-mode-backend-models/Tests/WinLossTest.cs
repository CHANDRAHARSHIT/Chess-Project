using NUnit.Framework;

/// <summary>
/// Tests the win/loss mechanics of the game.
/// 1. No items should result in a tie.
/// 2. When both players have the Equalizer (deals and heals both players) item, the game should result in a tie.
/// 
/// 
/// 
/// (Divyam: These are stats tests. Can move them to that class.)
/// 3. Damage and heal cancel each other.
/// 4. Shielding on the same instant as the damage does not prevent the damage.
/// 5. Poison and regen cancel each other.
/// </summary>
[TestFixture]
public class WinLossTest : BaseTest
{
    /// <summary>
    /// Test with and without the sandstrom. Both cases should result in a tie.
    /// </summary>
    [Test, TestCaseSource(nameof(BoolTestCases))]
    public void GameIsTiedWithNoItems(bool DisableSandstorm)
    {
        // Arrange
        Mechanics.DisableSandstormDamage = DisableSandstorm;
        Mechanics.IntervalMS = 100;

        // Act
        Game.Run();

        // Assert
        Assert.That(Game.Result, Is.EqualTo(EGameResult.Tie));
    }

    /// <summary>
    /// 3. Damage and heal cancel each other.
    /// </summary>

    [Test]
    public void DamageAndHealCancelEachOther()
    {
        // Arrange
        Game.Place(ItemFactory.AllDamageStats); // 2s cooldown on damage
        Game.PlaceForTopSide(ItemFactory.AllHealStats); // 2s cooldown on heal

        // Act
        Game.ProgressClock(2000);

        // Assert
        Assert.That(Game.PlayerTop.HealthLost, Is.EqualTo(0));
    }

    /// <summary>
    /// 4. Shielding on the same instant as the damage does not prevent the damage.
    /// </summary>
    [Test]
    public void ShieldingAtTheSameInstantDoesNotPreventDamage()
    {
        // Arrange
        Game.Place(ItemFactory.AllDamageStats); // 2s cooldown on damage
        Game.PlaceForTopSide(ItemFactory.TestShield); // 2s cooldown on shield

        // Act
        Game.ProgressClock(2000);

        // Assert
        Assert.That(Game.PlayerTop.HealthLost, Is.GreaterThan(0));
    }

    /// <summary>
    /// 5. Poison and regen cancel each other.
    /// </summary>

    [Test]
    public void PoisonAndRegenCancelEachOther()
    {
        // Arrange
        Game.Place(ItemFactory.Poison); // 2s cooldown on poison
        Game.PlaceForTopSide(ItemFactory.Regen); // 2s cooldown on regen

        // Act
        Game.Run();

        // Assert: No damage is taken
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(Game.PlayerTop.GetStatValue(EStat.MaxHealth)));
    }


    /// <summary>
    /// 2. When both players have the Equalizer (deals and heals both players) item, the game should result in a tie.
    /// </summary>
    /// Divyam: Fix this; I had my name here but you can do this finish this one? If not, let me know what the bug is.
    // [Test]
    public void GameIsTiedWithEqualizer()
    {
        // Arrange
        Item equalizer = ItemFactory.Equalizer;
        Game.Place(equalizer); // Equalizer for bottom player
        Game.PlaceForTopSide(equalizer); // Equalizer for top player

        // Act
        Game.Run();

        // Assert
        Assert.That(Game.Result, Is.EqualTo(EGameResult.Tie));
    }
}

