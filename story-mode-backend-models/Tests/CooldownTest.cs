using NUnit.Framework;

/// <summary>
/// Tests the cooldown mechanics of the game.
/// 
/// (Divyam: Restructure these tests. Also use <see cref="testname"/> alongside the descriptions
/// 
/// 1. Haste
///    A. InternalHaste doubles the cooldown.
///    B. ExternalHaste excludes instant items.
///    C. Hasted items still take a minimum of 1s to use. (Later: Fix. we don't know this mechanic works)
///    D. Targetting selects unhasted items.
/// 
/// 2. Slow
///    A. InternalSlow halves the cooldown.
///    B. ExternalSlow excludes instant items.
///    C. Targetting selects unslowed items.
/// 
/// 3. Charge
///   A. InternalCharge increases cooldown and overflow is wasted.
///   B. ExternalCharge excludes instant items.
/// 
/// 4. Freeze
///    A. InternalFreeze prevents use.
///    B. InternalFreeze prevents cooldown progress.
///    C. Item is used as soon as it is unfrozen.
///    D. Instant items can be frozen but olny if there are no other options.
///    E. Targetting selects unfrozen items.
/// 
/// 5. Combinations
///    A. Haste and slow cancel each other.
///    B. Charging a frozen item does not use it.
///    C. Haste, slow, and freeze counters should always decrease.
/// 
/// 6. Internal cooldown
///    A. Items are not triggered more than every 0.2s.
///    B. Power drill has a separate pool for each trigger type.
///    
/// 7. Cooldown
///    A. An items cooldown is not reduced below 1s.
/// 
/// 
/// Old: Can remove this:
/// 1. Haste and Slow cancel each other (Divyam: Add these)
/// 2. Freeze prevents use.
/// 3. Charge increases cooldown, but use is prevented when frozen, has no overflow, 
///    charging and using an item at the same instant does not waste the charge.
/// 4. Haste doubles; slow halves.   
/// 5. Item with 1s cooldown is hasted, then it still takes 1s to use. (skip)
/// 6. 1.2 s item is hasted, what happens? (skip)
/// 
/// (Divyam: Add test: )
/// 
/// </summary>

[TestFixture]
public class CooldownTest : BaseTest
{
    /// <summary>
    /// 1. Haste and Slow cancel each other.
    /// </summary>
    [Test]
    public void TestHasteAndSlowCancelEachOther()
    {
        // Arrange
        CooldownItem hasteItem = (CooldownItem)ItemFactory.HasteOpponentItems;
        CooldownItem slowItem = (CooldownItem)ItemFactory.SlowItem;
        CooldownItem simpleItem = (CooldownItem)ItemFactory.SimpleItem; // 20s cooldown

        Game.Place(hasteItem);
        Game.Place(slowItem);
        Game.PlaceForTopSide(simpleItem);

        // Act
        Game.ProgressClock(2500);

        // Assert: The cooldown should be unchanged
        Assert.That(simpleItem.CurrentCooldownProgress, Is.EqualTo(2500));
    }

    /// <summary>
    /// 2. Freeze prevents use.
    /// </summary>
    [Test]
    public void TestFreezePreventsUse()
    {
        // Arrange
        CooldownItem freezeItem = (CooldownItem)ItemFactory.FreezeItem;
        CooldownItem simpleItem = (CooldownItem)ItemFactory.SimpleItem; // 20s cooldown

        Game.Place(freezeItem);
        Game.PlaceForTopSide(simpleItem);

        // Act
        Game.ProgressClock(20000);

        // Assert
        Assert.That(simpleItem.GetUsage(EStat.TimesUsed), Is.EqualTo(0)); // Since the item is frozen it cant be used.
    }

    /// <summary>
    /// 3.A Charge increases cooldown, but use is prevented when frozen, has no overflow,
    /// </summary>
    [Test]
    public void TestChargeIncreasesCooldownIsPreventedByFreeze()
    {
        // Arrange
        CooldownItem chargeItem = (CooldownItem)ItemFactory.ChargeItem;
        CooldownItem freezeItem = (CooldownItem)ItemFactory.FreezeItem;
        CooldownItem simpleItem = (CooldownItem)ItemFactory.SimpleItem; // 20s cooldown

        Game.Place(chargeItem);
        Game.Place(freezeItem);
        Game.PlaceForTopSide(simpleItem);

        // Act
        Game.ProgressClock(2000);

        // Assert
        Assert.That(simpleItem.CurrentCooldownProgress, Is.EqualTo(3000)); // The cooldown should be increased by 1000 since the item is charged 1s.
        Assert.That(chargeItem.GetUsage(EStat.TimesUsed), Is.EqualTo(1));

        Game.ProgressClock(2000);

        // Assert
        Assert.That(chargeItem.GetUsage(EStat.TimesUsed), Is.EqualTo(2));
        Assert.That(simpleItem.CurrentCooldownProgress, Is.EqualTo(4000)); // The cooldown should be affected by only the charge and not by game progress since it is frozen.

        // Act
        Game.ProgressClock(10000);

        // Assert
        Assert.That(simpleItem.GetUsage(EStat.TimesUsed), Is.EqualTo(0)); // Since the item is frozen it cant be used.
    }

    /// <summary>
    /// 3.B Charging and using an item at the same instant does not waste the charge.
    /// </summary>
    [Test]
    public void TestChargeAndUseAtTheSameInstantDoesNotWasteCharge()
    {
        // Arrange
        CooldownItem chargeItem = (CooldownItem)ItemFactory.ChargeItem;
        CooldownItem testTool = (CooldownItem)ItemFactory.TestTool; // 2s cooldown

        Game.Place(chargeItem);
        Game.PlaceForTopSide(testTool);

        // Act
        Game.ProgressClock(2000);

        // Assert
        Assert.That(testTool.GetUsage(EStat.TimesUsed), Is.EqualTo(1)); // The item should be used.
        Assert.That(testTool.CurrentCooldownProgress, Is.EqualTo(1000)); // The charge should not be used.
    }

    /// <summary>
    /// 4.A. Haste doubles; slow halves.
    /// </summary>
    [Test]
    public void TestHasteDoubles()
    {
        // Arrange
        CooldownItem hasteItem = (CooldownItem)ItemFactory.HasteOpponentItems;
        CooldownItem simpleItem = (CooldownItem)ItemFactory.SimpleItem; // 20s cooldown

        Game.Place(hasteItem);
        Game.PlaceForTopSide(simpleItem);

        // Act
        Game.ProgressClock(5000);

        // Assert
        Assert.That(simpleItem.CurrentCooldownProgress, Is.EqualTo(8000)); // The cooldown should be doubled since the item is hasted.

        // Act
        Game.ProgressClock(6000);

        // Assert
        Assert.That(simpleItem.CurrentCooldownProgress, Is.EqualTo(0));
        Assert.That(simpleItem.GetUsage(EStat.TimesUsed), Is.EqualTo(1)); // The item should be used in 11 seconds. instead of 20,
    }

    /// <summary>
    /// 4.B. slow halves.
    /// </summary>
    [Test]
    public void TestSlowHalves()
    {
        // Arrange
        CooldownItem slowItem = (CooldownItem)ItemFactory.SlowItem; // 2s cooldown
        CooldownItem simpleItem = (CooldownItem)ItemFactory.SimpleItem; // 20s cooldown

        Game.Place(slowItem);
        Game.PlaceForTopSide(simpleItem);

        // Act
        Game.ProgressClock(3000);

        // Assert: Progress should only increase by half the amount after the slowing item was used.
        Assert.That(simpleItem.CurrentCooldownProgress, Is.EqualTo(2500));
    }
}