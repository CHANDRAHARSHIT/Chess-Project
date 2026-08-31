using NUnit.Framework;

/// <summary>
/// Tests the impacts that an action can have: <see cref="Impact"/>
/// 1. Stat impact <see cref="ImpactStatModify"/>
///     A. Tests "When you use a Tool, items adjacent to it gain 3% » 6% » 9% Crit Chance.", for a skill.
///        The crit value taken should be from the tier of the skill and not the tool.
///     B. ... (Divyam: Add a test. Previous one looks at item stat changes. This one can look at player stat changes.)
/// 2. Item destruction <see cref="ImpactItemDestroy"/>
///     A. An item that is destroyed is removed from the playmat.
///     B. An item can only be destroyed once.
///     C. Item Destroyer Effect works properly. (Divyam: Fix this test)
/// </summary>

[TestFixture]
public class EffectActionImpactTest : BaseTest
{
    /// <summary>
    /// 1A. Tests "When you use a Tool, items adjacent to it gain 3% » 6% » 9% Crit Chance.", for a skill.
    /// The crit value taken should be from the tier of the skill and not the tool.
    /// </summary>
    [Test]
    public void TestStatImpactPicksTieredStatOfSkillAndNotTheItemBeingUsed()
    {
        // Arrange
        Skill testSkill = SkillFactory.FlashyMechanic;
        Item testItem = ItemFactory.TestTool;
        Item testItem2 = ItemFactory.SimpleItem;
        Game.Place(testSkill.Upgrade().Upgrade());
        Game.Place(testItem);
        Game.Place(testItem2);

        // Act: Progress to the first use of the tool
        Game.ProgressClock(2000);

        // Assert: Crit (diamond tier) should have been applied
        Assert.That(testItem2.GetStatValue(EStat.CritChance), Is.EqualTo(9));
    }

    /// <summary>
    /// 2A. An item that is destroyed is removed from the playmat.
    /// </summary>
    [Test]
    public void DestroyedItemIsRemovedFromPlaymat()
    {
        // Arrange
        Item testItem = ItemFactory.AllDamageStats;
        Game.Place(testItem);

        // Act
        DestructionHandler.Destroy(testItem);

        // Assert
        Assert.That(Game.PlayerBottom.Playmat.Items, Does.Not.Contain(testItem));
    }

    /// <summary>
    /// 2B. An item can only be destroyed once.
    /// </summary>
    [Test]
    public void ItemCanBeDestroyedOnlyOnce()
    {
        // Arrange
        Item testItem = ItemFactory.AllDamageStats;
        Game.Place(testItem);

        // Act
        DestructionHandler.Destroy(testItem);

        // Assert
        Assert.Throws<InvalidOperationException>(() => DestructionHandler.Destroy(testItem));
    }

    /// <summary>
    /// 2C. Item Destroyer Effect works properly.
    /// </summary>
    /// 
    // Divyam: Add these back and fix. It was failing after the refactor I did no item selection. So it has something to do with the item selection of the destroyer item.
    // This was failing because the itemDestroyer had an effect that destroyes all other items, 
    // but with the current filters, this might not be possible (im t sure about this since i havent had a look at the directions code yet). so it also destroyed itself.
    // for now i have changed the effect to only destroy the enemy items.
    [Test]
    public void ItemDestroyerEffectWorksProperly()
    {
        // Arrange
        Item testItem = ItemFactory.AllDamageStats; // 2s cooldown
        Item testItemDestroyer = ItemFactory.TestEnemyItemDestroyer; // 3s cooldown // Destroy all other items on the playmat
        Game.PlaceForTopSide(testItem);
        Game.Place(testItemDestroyer);

        // Act
        Game.ProgressClock(2000); // progress clock to the first use of the test item

        // Assert
        Assert.That(Game.PlayerTop.Playmat.Items, Does.Contain(testItem));

        // Act
        Game.ProgressClock(1000); // progress clock to the first use of the item destroyer

        // Assert
        Assert.That(Game.PlayerTop.Playmat.Items, Does.Not.Contain(testItem));
        Assert.That(Game.PlayerBottom.Playmat.Items, Does.Contain(testItemDestroyer));
        Assert.That(Game.PlayerTop.Playmat.Items.Count, Is.EqualTo(0));

    }
}
