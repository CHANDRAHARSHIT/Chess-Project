using NUnit.Framework;

/// <summary>
/// Tests some generic setups.
/// 1. Common Dooley weapon setup: Alpha Ray, Core ... more items will be added later. Focuses on testing that buffs and damage are sequenced correctly.
/// 2. Common Setup with Ammo items, check reload, increase MaxAmmo items, skills, etc ... the full test will be added later.
/// (Divyam: Add 2. Include these items: Cannonball, Super Syrup to the test above) So keep the items I'd already added and add these as well.
/// 3. Kyver Drone vs Vanessa (no items): Starting battle that Vanessa wins. Focuses on damage numbers from Sandstorm.
/// </summary>
[TestFixture]
public class BattleTest : BaseTest
{
    private static IEnumerable<TestCaseData> CommonDooleyWeaponsTestCases()
    {
        // Durations, AlphaRayUses, TheCoreUses, AlphaRayWeaponBuff, TheCoreWeaponBuff, DamageDealt
        yield return new TestCaseData(5000, 1, 1, 15 + 4, 30 + 4, 19 + 34)
            .SetName("5_second_battle");

        yield return new TestCaseData(10000, 2, 2, 15 + 8, 30 + 8, 19 + 34 + 23 + 38)
            .SetName("10_second_battle");
    }

    [Test, TestCaseSource(nameof(CommonDooleyWeaponsTestCases))]
    public void CommonDooleyWeapons(
        int duration,
        int expectedAlphaRayUses,
        int expectedTheCoreUses,
        int expectedAlphaRayWeaponBuff,
        int expectedTheCoreWeaponBuff,
        int expectedDamageDealt)
    {

        // Setup game
        int startingHealth = Game.PlayerTop.GetStatValue(EStat.Health);

        // Setup items
        Item alphaRay = ItemFactory.TestAlphaRay;
        Item theCore = ItemFactory.TestTheCore;

        // Setup playmat
        Game.Place(alphaRay);
        Game.Place(theCore);

        // Act
        Game.ProgressClock(duration);

        // Assert
        Assert.That(alphaRay.GetUsage(EStat.TimesUsed), Is.EqualTo(expectedAlphaRayUses));
        Assert.That(theCore.GetUsage(EStat.TimesUsed), Is.EqualTo(expectedTheCoreUses));
        Assert.That(alphaRay.GetStatValue(EStat.Damage), Is.EqualTo(expectedAlphaRayWeaponBuff));
        Assert.That(theCore.GetStatValue(EStat.Damage), Is.EqualTo(expectedTheCoreWeaponBuff));
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(startingHealth - expectedDamageDealt));
    }

    //     // [Test]
    //     // public static void TestAmmoUsage()
    //     // {
    //     // Arrange
    //     // Item item1 = ItemFactory.TestAmmoItem; // 4s cooldown, 2 max ammo
    //     // Item triggerItem2 = TestItem.CurrentAmmoTestItem2; // 4s cooldown, 1 max ammo

    //     // // Setup item
    //     // Item grapeshot = TestItem.Grapeshot; // 3s cooldown
    //     // grapeshot.SetStatValue(EType.CurrentAmmo, 0);

    //     // // Setup playmat
    //     // game.Place(triggerItem1);
    //     // game.Place(grapeshot);
    //     // game.Place(triggerItem2);

    //     // // Act & Assert: run the game for 3s and assert that the grapsehot was not used
    //     // // Since it had 0 ammo.
    //     // game.ProgressClock(3000);
    //     // Assert.That(grapeshot.GetUsage(EType.TimesUsed), Is.EqualTo(0));

    //     // // Act & Assert: Run the game another 1s and assert that the ammo stat gets increased by 2
    //     // // due to two triggerItems however usage is still 0 since grapeshot next cooldown will be on 6th sec.
    //     // game.ProgressClock(1000);
    //     // Assert.That(grapeshot.GetUsage(EType.TimesUsed), Is.EqualTo(0));
    //     // Assert.That(grapeshot.GetStatValue(EType.CurrentAmmo), Is.EqualTo(2));

    //     // // Act & Assert: Now proceed to the 7th second and item should have been used by 1 time.
    //     // // Now the ammo count should be 1.
    //     // game.ProgressClock(3000);
    //     // Assert.That(grapeshot.GetStatValue(EType.CurrentAmmo), Is.EqualTo(1));
    //     // Assert.That(grapeshot.GetUsage(EType.TimesUsed), Is.EqualTo(1));
    //     // }

    /// <summary>
    /// 3. Kyver Drone vs Vanessa: Starting battle that Vanessa wins without any items.
    /// </summary>
    [Test]
    public void TestVanessaVsKyverDrone()
    {
        // Arrange
        Game.Place(HeroFactory.Vanessa);
        Game.PlaceForTopSide(MonsterFactory.KyverDrone);
        Mechanics.SandstormStartsAfterMS = 30000;
        Mechanics.SandstormDurationMS = 120000;
        Mechanics.IntervalMS = 100;
        Mechanics.DisableSandstormDamage = false;

        // Act
        Game.Run();

        // Assert Vanessa wins
        Assert.That(Game.Result, Is.EqualTo(EGameResult.PlayerBottomWon));

        // Assert final health on both players
        // Items go off 3 times + sandstorm
        int sandstormDamage = 108;
        int damage = (45 * 3) + 5 + sandstormDamage;
        Assert.That(Game.PlayerBottom.GetStatValue(EStat.Health), Is.EqualTo(250 - damage));
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(100 - sandstormDamage));
    }
}
