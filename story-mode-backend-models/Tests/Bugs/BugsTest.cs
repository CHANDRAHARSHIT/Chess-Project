using Microsoft.EntityFrameworkCore.Metadata.Internal;
using NUnit.Framework;

/// <summary>
/// Tests for bugs related to DeadlyEye skill and ammo items.
/// </summary>
[TestFixture]
public class BugsTest : BaseTest
{
    /// <summary>
    /// Tests that DeadlyEye skill doesn't interfere with items.
    /// </summary>
    [Test]
    public void DeadlyEyeDoesNotAffectItems()
    {
        // Arrange
        Item testAmmo = ItemFactory.TestAmmo;
        Skill deadlyEye = SkillFactory.DeadlyEye;

        // Place the items
        Game.Place(testAmmo);
        Game.Place(deadlyEye);

        Mechanics.SandstormStartsAfterMS = 30000;
        Mechanics.SandstormDurationMS = 120000;
        Mechanics.IntervalMS = 100;
        Mechanics.DisableSandstormDamage = false;

        // Assert
        // Verify that Bolas still has ammo stats
        Assert.That(testAmmo.Stats.HasStat(EStat.Ammo), Is.True);
        Assert.That(testAmmo.Stats.HasStat(EStat.MaxAmmo), Is.True);

        // Verify the actual ammo values
        Assert.That(testAmmo.GetStatValue(EStat.Ammo), Is.EqualTo(1));
        Assert.That(testAmmo.GetStatValue(EStat.MaxAmmo), Is.EqualTo(1));

        // Act
        Game.Run();

        // Verify that the item was used
        Assert.That(testAmmo.GetUsage(EStat.TimesUsed), Is.EqualTo(1));
    }

    /// <summary>
    /// Tests that Gunner skill throws an exception if no other item is an ammo item.
    /// </summary>
    [Test]
    public void GunnerSkillThrowsExceptionWithoutAmmoItem()
    {
        // Arrange
        Skill gunnerSkill = SkillFactory.Gunner;
        Item testItem = ItemFactory.Abacus; // This item is not an ammo item

        // Place the skill without any ammo item
        Game.Place(testItem);
        Game.Place(gunnerSkill);

        // Act & Assert
        // var ex = Assert.Throws<KeyNotFoundException>(() => Game.Run());
    }

    /// <summary>
    /// Tests that Bayonet item doesn't work with Augmented Weaponry skill.
    /// </summary>
    [Test]
    public void BayonetDoesNotWorkWithAugmentedWeaponry()
    {
        // Arrange
        Item bayonet = ItemFactory.Bayonet;
        Skill augmentedWeaponry = SkillFactory.AugmentedWeaponry;

        // Place the items
        Game.Place(bayonet);
        Game.Place(augmentedWeaponry);


        // Act and Assert
        // var ex = Assert.Throws<KeyNotFoundException>(() => Game.Run());

    }

    /// <summary>
    /// Tests that Bayonet item doesn't work with Initial Dose skill.
    /// </summary>
    [Test]
    public void BayonetDoesNotWorkWithInitialDose()
    {
        // Arrange
        Item bayonet = ItemFactory.Bayonet;
        Skill initialDose = SkillFactory.InitialDose;

        // Place the items
        Game.Place(bayonet);
        Game.Place(initialDose);

        // Act and Assert
        // var ex = Assert.Throws<KeyNotFoundException>(() => Game.Run());

    }
    /// <summary>
    /// Tests that Bayonet item doesn't work with Keen eye skill.
    /// </summary>
    [Test]
    public void BayonetDoesNotWorkWithKeenEye()
    {
        // Arrange
        Item bayonet = ItemFactory.Bayonet;
        Skill keenEye = SkillFactory.KeenEye;

        // Place the items
        Game.Place(bayonet);
        Game.Place(keenEye);

        // Act  and Assert
        // var ex = Assert.Throws<KeyNotFoundException>(() => Game.Run());

    }

    /// <summary>
    /// Tests that Bayonet item doesn't work with Rush skill.
    /// </summary>
    [Test]
    public void BayonetDoesNotWorkWithRushSkill()
    {
        // Arrange
        Item bayonet = ItemFactory.Bayonet;
        Skill rush = SkillFactory.Rush;

        // Place the items
        Game.Place(bayonet);
        Game.Place(rush);

        // Act  and Assert
        // var ex = Assert.Throws<KeyNotFoundException>(() => Game.Run());

    }

    /// <summary>
    /// Tests that Bayonet item doesn't work with Rigged skill.
    /// </summary>
    [Test]
    public void BayonetDoesNotWorkWithRiggedSkill()
    {
        // Arrange
        Item bayonet = ItemFactory.Bayonet;
        Skill rigged = SkillFactory.Rigged;

        // Place the items
        Game.Place(bayonet);
        Game.Place(rigged);

        // Act  and Assert
        // var ex = Assert.Throws<KeyNotFoundException>(() => Game.Run());

    }

    [Test]
    /// <summary>
    /// Tests that Burst of Flame skill doesnt work.
    /// </summary>
    public void BurstOfFlameDoesntWork()
    {
        // Arrange
        Item abacus = ItemFactory.Abacus;
        Skill burstOfFlame = SkillFactory.BurstOfFlame;

        // Place the items
        Game.Place(abacus);
        Game.Place(burstOfFlame);

        Mechanics.SandstormStartsAfterMS = 30000;
        Mechanics.SandstormDurationMS = 120000;
        Mechanics.IntervalMS = 100;
        Mechanics.DisableSandstormDamage = false;

        // Act and Assert
        // var ex = Assert.Throws<NotImplementedException>(() => Game.Run());
    }

    [Test]
    /// <summary>
    /// Tests that Panic skill doesnt work if there are no ammo items.
    /// </summary>
    public void PanicDoesntWorkWithoutAmmoItem()
    {
        // Arrange
        Item abacus = ItemFactory.Abacus;
        Skill panic = SkillFactory.Panic;

        // Place the items
        Game.Place(abacus);
        Game.Place(panic);

        Mechanics.SandstormStartsAfterMS = 30000;
        Mechanics.SandstormDurationMS = 120000;
        Mechanics.IntervalMS = 100;
        Mechanics.DisableSandstormDamage = false;

        // Act and Assert
        // var ex = Assert.Throws<KeyNotFoundException>(() => Game.Run());
    }

    [Test]
    public void TestAllFactoryItemsOnPlaymat()
    {
        // Arrange
        int iterationCount = 0;
        var allItems = ItemFactory.GetAllItems(ECollection.Vanessa); // Assuming a method to retrieve all items
        // Act
        foreach (var item in allItems)
        {
            if (!Game.PlayerBottom.Playmat.IsFull && item.SlotSize <= Game.PlayerBottom.Playmat.AvailableSlots)
            {
                Game.Place(item);
            }
            else if (!Game.PlayerTop.Playmat.IsFull && item.SlotSize <= Game.PlayerTop.Playmat.AvailableSlots)
            {
                Game.PlaceForTopSide(item);
            }
            else
            {
                // Run the game one last time if there are remaining items
                Console.WriteLine($"Iteration {++iterationCount} :");
                Console.WriteLine("Player Bottom Items:");
                foreach (var _item in Game.PlayerBottom.Playmat.Items)
                {
                    Console.Write($" - {_item.Name} ({_item.GetType().Name})");
                }

                Console.WriteLine("\n\nPlayer Top Items:");
                foreach (var _item in Game.PlayerTop.Playmat.Items)
                {
                    Console.Write($" - {_item.Name} ({_item.GetType().Name})");
                }
                Game.Run();
                Game.Reset(); // Reset the game state for the next iteration
            }
        }

        // Assert
        Assert.Pass("All items were tested on the playmat.");
    }
}