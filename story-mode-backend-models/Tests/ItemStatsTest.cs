using NUnit.Framework;

/// <summary>
/// Tests stats.
/// 
/// (Divyam)
/// I am writing a new structure for stats. Implement these tests in the new structure. Add tests as needed.
/// 
/// 1. Player targetting stats
///    A. Burn
///    B. Poison
///    C. Damage
///    D. Heal
///    E. Shield
///    F. Regeneration
/// 
/// 2. Item targetting stats
///    A. Internal cooldown stats are handled in CooldownTest <see cref="CooldownTest"/>
///    B. External cooldown stats are handled in CooldownTest <see cref="CooldownTest"/>
///   
/// 3. Permanent Stats (stats with no active effects)
///    A. Crit chance
///       I.    Instant items don't gain crit chance.
///       II.   Cooldown items gain crit chance.
///       III.  Critical hit doubles its Damage, Heal, Shield, Burn, Regeneration, and Poison.
///       IV.   Stats unaffected by crit chance: All cooldown stats
///       V.    When a stat crits, all other stats of the item also crit.
///       VI.   (Unknown mechanic) Item with 2 stats that crit counts as 2 crit triggers.
///
///    B. Crit damage
///    C. Lifesteal
///    D. Multicast
///       I.    Triggers are activated per multicast.
///       II.   Multicast is not affect ammo usage.
///       III.  All instances of a multicast crit.
///       
///    E. Ammo
///    F. Value
/// 
/// Old structure:
/// 1. Test that using the item increases the corresponding totals. <see cref="TestUsageTotalsAreUpdated"/>
/// 2. Test that the correct damage is applied to the player from burn, poison, and damage and player 
///     damage totals are updated. <see cref="TestCorrectDamageIsAppliedAndPlayerDamageTotalsAreUpdated"/>
/// 3. Test multicast. <see cref="TestMulticast"/>
/// 4. ... (Divyam: Add the description for the tests you've added.)
/// 
/// (Divyam: Add test) Test that derived stats work. Use Abacus which shields off adjacent item values. Use the core as 
/// one of the adjacent items as it does not have a value (so its value is 0).
/// 
/// (Divyam) Add a test for reload: If an item with full ammo is reloaded, the ammo should not increase.
/// (Divyam) Add other tests for ammo, its gets used; item at 0 ammo should be used (its cooldown stays full and it will get used immediately when reloaded)
/// When an item is realoaded, it gets used immediately without waiting for any cooldown progress (if the item's cooldown was full)
/// </summary>

[TestFixture]
public class ItemStatsTest : BaseTest
{
    /// <summary>
    /// 1. Test that using the item increases the corresponding totals.
    /// </summary>
    [Test]
    public void TestUsageTotalsAreUpdated()
    {
        // Raushan: JSON
        Item testItem = ItemFactory.AllDamageStats; // 2s cooldown

        // Arrange
        Game.Place(testItem);

        // Act & Assert
        // Progress to the first use of the item
        Game.ProgressClock(2000);
        Assert.That(testItem.GetUsage(EStat.TimesUsed), Is.EqualTo(1));
        Assert.That(testItem.GetUsage(EStat.Damage), Is.EqualTo(1));
        Assert.That(testItem.GetUsage(EStat.Burn), Is.EqualTo(10));

        // Act & Assert
        // Progress to the second use of the item
        Game.ProgressClock(2000);
        Assert.That(testItem.GetUsage(EStat.TimesUsed), Is.EqualTo(2));
        Assert.That(testItem.GetUsage(EStat.Damage), Is.EqualTo(2));
        Assert.That(testItem.GetUsage(EStat.Poison), Is.EqualTo(20));
    }


    /// <summary>
    /// 2. Test that the correct damage is applied to the player from burn, poison, and damage and player damage totals are updated.
    /// </summary>
    [Test]
    public void TestCorrectDamageIsAppliedAndPlayerDamageTotalsAreUpdated()
    {
        Item testItem = ItemFactory.AllDamageStats; // 2s cooldown

        // Arrange
        Game.Place(testItem);
        int startingHealth = Game.PlayerTop.GetStatValue(EStat.Health);

        // Act & Assert
        // Progress to the first use of the item
        Game.ProgressClock(2000);
        int healthLostFromDamage = 1;
        int healthLostFromPoison = 0;
        int healthLostFromBurn = 0;
        int expectedHealth = startingHealth - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));

        // Act & Assert
        // Progress to the first tick when burn should be applied
        Game.ProgressClock(500);
        healthLostFromDamage = 1;
        healthLostFromPoison = 0;
        healthLostFromBurn = 10;
        expectedHealth = startingHealth - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));

        // Act & Assert
        // Progress to the first tick when poison should be applied
        Game.ProgressClock(500);
        healthLostFromDamage = 1;
        Assert.That(Game.PlayerTop.GetTotal(EStat.Damage), Is.EqualTo(1));
        healthLostFromPoison = 10;
        Assert.That(Game.PlayerTop.GetTotal(EStat.Poison), Is.EqualTo(10));
        healthLostFromBurn = 19;
        // Burn should have dissipated by now
        Assert.That(Game.PlayerTop.GetTotal(EStat.Burn), Is.EqualTo(19));
        expectedHealth = startingHealth - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));

        // Act & Assert
        // Progress to the next second.
        Game.ProgressClock(1000);
        healthLostFromDamage = 2;
        healthLostFromPoison = 20;
        healthLostFromBurn = 34;
        expectedHealth = startingHealth - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));
    }

    /// <summary>
    /// 3. Test multicast. (Divyam: Assert that single ammo is used)
    /// </summary>
    // [Test] // Divyam: Fix
    public void TestMulticast()
    {
        Item testItem = ItemFactory.AllDamageStats; // 2s cooldown

        // Arrange
        // testItem.Enchant(EEnchantment.Shiny);
        Game.Place(testItem);

        // Act & Assert
        // Progress to the first use of the item
        Game.ProgressClock(2000);
        Assert.That(testItem.GetUsage(EStat.TimesUsed), Is.EqualTo(2));
        Assert.That(testItem.GetUsage(EStat.Damage), Is.EqualTo(2));
        Assert.That(testItem.GetUsage(EStat.Burn), Is.EqualTo(2));
        Assert.That(testItem.GetUsage(EStat.Burn), Is.EqualTo(2));
    }

    /// <summary>
    /// 4.A. Test that correct damage is appkied when player is healed.
    /// </summary>
    [Test]
    public void TestCorrectDamageWhenHealingIsApplied()
    {
        Item testItem = ItemFactory.AllDamageStats; // 2s cooldown
        Item testHealItem = ItemFactory.AllHealStats; // 2s cooldown

        // Arrange
        Game.Place(testItem);
        Game.PlaceForTopSide(testHealItem);
        int startingHealth = Game.PlayerTop.GetStatValue(EStat.Health);

        // Act & Assert
        // Progress to the first use of the item
        Game.ProgressClock(2000);
        int healthLostFromDamage = 1;
        int healthLostFromPoison = 0;
        int healthLostFromBurn = 0;
        int healthGainedFromHeal = 1;
        int expectedHealth = startingHealth - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn + healthGainedFromHeal;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));

        // Act & Assert
        // Progress to the first tick when burn should be applied
        Game.ProgressClock(500);
        healthLostFromBurn = 10 - 1; // reduced 10% by heal
        expectedHealth = startingHealth - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn + healthGainedFromHeal;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));

        // Act & Assert
        // Progress to the first tick when poison should be applied
        Game.ProgressClock(500);
        healthLostFromDamage = 1;
        Assert.That(Game.PlayerTop.GetTotal(EStat.Damage), Is.EqualTo(1));
        healthLostFromPoison = 10 - 1; //  reduced 10% by heal
        Assert.That(Game.PlayerTop.GetTotal(EStat.Poison), Is.EqualTo(9));
        healthLostFromBurn = 9 + 8; // 1 burn tick reduced 
        Assert.That(Game.PlayerTop.GetTotal(EStat.Burn), Is.EqualTo(17));
        healthGainedFromHeal = 1;
        Assert.That(Game.PlayerTop.GetTotal(EStat.Heal), Is.EqualTo(1));
        expectedHealth = startingHealth - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn + healthGainedFromHeal + 1;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));

        // Act & Assert
        // Progress to the next second.
        Game.ProgressClock(1000);
        healthLostFromDamage = 2;
        healthLostFromPoison = 18; // 9 + 9 
        healthLostFromBurn = 30; // 17 + 13 
        healthGainedFromHeal = 2;
        expectedHealth = startingHealth - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn + healthGainedFromHeal + 2;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));
    }

    /// <summary>
    /// 4.B. Test that correct damage is applied when player is shielded.
    /// </summary>
    [Test]
    public void TestCorrectDamageWhenShielded()
    {
        Item testDamageItem = ItemFactory.AllDamageStats; // 2s cooldown
        Item testShield = ItemFactory.TestShield; // 2s cooldown

        // Arrange
        Game.Place(testDamageItem);
        Game.PlaceForTopSide(testShield);
        int startingHealth = Game.PlayerTop.GetStatValue(EStat.Health);

        // Act & Assert
        // Progress to the first use of both items
        Game.ProgressClock(2000);
        int healthLostFromDamage = 1;
        int healthLostFromPoison = 0;
        int healthLostFromBurn = 0;
        int shieldGainedFromItem = 0;
        int expectedHealth = startingHealth + shieldGainedFromItem - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn;
        shieldGainedFromItem = 1;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));

        // Act & Assert
        // Progress to the first tick when burn should be applied
        Game.ProgressClock(500);
        healthLostFromBurn = 10 - 5; // reduced 50% by shield
        expectedHealth = startingHealth + shieldGainedFromItem - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));

        // Act & Assert
        // Progress to the first tick when poison should be applied
        Game.ProgressClock(500);
        healthLostFromDamage = 1;
        Assert.That(Game.PlayerTop.GetTotal(EStat.Damage), Is.EqualTo(1));
        healthLostFromPoison = 10;
        Assert.That(Game.PlayerTop.GetTotal(EStat.Poison), Is.EqualTo(10));
        healthLostFromBurn = 5 + 10 - 2;

        Assert.That(Game.PlayerTop.GetTotal(EStat.Burn), Is.EqualTo(13));
        shieldGainedFromItem = 0;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Shield), Is.EqualTo(0));
        expectedHealth = startingHealth + shieldGainedFromItem - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));

        // Act & Assert
        // Progress to the next second.
        Game.ProgressClock(1000);
        healthLostFromDamage = 2;
        healthLostFromPoison = 20;
        healthLostFromBurn = 28;
        expectedHealth = startingHealth + shieldGainedFromItem - healthLostFromDamage - healthLostFromPoison - healthLostFromBurn;
        shieldGainedFromItem = 1;
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(expectedHealth));
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Shield), Is.EqualTo(shieldGainedFromItem));
    }

    /// <summary>
    /// 5. Test that derived stats work. Use Abacus which shields off of adjacent item values. Use AllDamageStats as
    /// one of the adjacent items as it does not have a value (so its value is 0).
    /// </summary>
    [Test]
    public void TestDerivedStats()
    {
        // the core has by default 4 value since its not "unsellable" which automatically applies it a value based on its size. in this case, . so using other item instead.
        Item abacus = ItemFactory.Abacus;
        Item allDamageStats = ItemFactory.AllDamageStats;

        // Arrange
        Game.Place(abacus);
        Game.Place(allDamageStats);

        // Act & Assert
        // Progress to the first use of the item
        // Game.ProgressClock(4000);
        // Assert.That(Game.PlayerBottom.GetStatValue(EStat.Shield), Is.EqualTo(0)); 
        // // Error:  Since AllDamageStats has no value, its giving throwing an exception
        // System.Collections.Generic.KeyNotFoundException : Stat Value not found. should be 0. 

    }
}
