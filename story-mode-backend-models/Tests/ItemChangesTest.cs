
using NUnit.Framework;

/// <summary>
/// Divyam: Add additional tests for upgrade and enchantment.
/// The ones for enchantment are incomplete placeholders.
/// Tests changes that can be made to items:
/// 1. Upgrade an item.
///     A. Test tier and stats are updated. <see cref="TestItemIsUpgraded"/>
///     B. ...
/// 2. Enchanting an item
///     A. Items can only hold a limited number of enchantments. <see cref="TestItemCannotExceedMaxEnchantments"/>
///     B. All enchantments can be applied <see cref="TestEnchantmentIsAppliedToItem"/>
[TestFixture]
public class ItemChangesTest : BaseTest
{

    /// <summary>
    /// Tests that an item is upgraded to the next tier.
    /// </summary>
    [Test]
    public void TestItemIsUpgraded()
    {
        // Arrange
        Item testItem = ItemFactory.AllDamageStats; // 2s cooldown
        Game.Place(testItem);

        // Act
        Game.ProgressClock(2000);

        // Assert
        Assert.That(testItem.Tier, Is.EqualTo(ETier.Silver)); // Silver tier by default
        Assert.That(testItem.GetStatValue(EStat.Damage), Is.EqualTo(1)); // Damage = 1 on silver tier
        Assert.That(testItem.GetStatValue(EStat.Burn), Is.EqualTo(10)); // Burn = 1 on silver tier
        Assert.That(testItem.GetStatValue(EStat.Poison), Is.EqualTo(10)); // Poison = 1 on silver tier

        // Act
        testItem.Upgrade();
        Game.ProgressClock(2000);

        // Assert
        Assert.That(testItem.Tier, Is.EqualTo(ETier.Gold)); // Upgraded to Gold tier
        Assert.That(testItem.GetStatValue(EStat.Damage), Is.EqualTo(2)); // Damage = 2 on gold tier
        Assert.That(testItem.GetStatValue(EStat.Burn), Is.EqualTo(20)); // Burn = 2 on gold tier
        Assert.That(testItem.GetStatValue(EStat.Poison), Is.EqualTo(20)); // Poison = 2 on gold tier
    }


    /// <summary>
    /// 2A Items can only hold a limited number of enchantments.
    /// </summary>
    [Test]
    public void TestItemCannotExceedMaxEnchantments()
    {
        // Arrange
        Item testItem = ItemFactory.AllEnchantments;

        // Act
        Game.Place(testItem);

        // Assert: All enchantments are inactive to start with
        Assert.That(testItem.GetActiveEnchantments().Length, Is.EqualTo(0));
        Assert.That(testItem.GetInactiveEnchantments().Length, Is.EqualTo(2));
    }

    /// <summary>
    /// 2B Tests that an enchantment is applied to an item.
    /// </summary>
    // [Test]
    public void TestEnchantmentIsAppliedToItem()
    {
        // Arrange
        Item testItem = ItemFactory.AllEnchantments; // 2s cooldown

        // Act
        testItem.Enchant(EEnchantment.Shiny);
        Game.Place(testItem);

        // Assert
        // Assert.That(testItem.GetActiveEnchantments()[0], Is.EqualTo(EEnchantment.Shiny));
        Assert.That(testItem.GetStatValue(EStat.Multicast), Is.EqualTo(1));
    }
}