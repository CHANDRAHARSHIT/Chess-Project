using NUnit.Framework;

/// <summary>
/// (Divyam: Add tests in this new format)
/// 1. Tests for condition triggers  <see cref="Trigger"/>
///     A. Tests counts are correct for item such as Rowboat.
/// 
/// 2. TriggerPermanently (child) <see cref="TriggerPermanently"/>
///     A. Permanent effects occur outside combat: permanent effect does not trigger a SOC. <see cref="TestPermanentDoesNotTriggerSoc"/>
///     B. Permanent effects are sequenced correctly: <see cref="TestPermanentEffectsAreCorrectlySequeced"/>
///        Eg. An item has these 4 effects: (1) Items with multicast gain +2 (2) your aquatic items have multicast
///        (3) double multicast (4) your items are aquatic. The item should gain 6 multicast.
/// 
/// 
///     TriggerOnItemUse (child) <see cref="TriggerOnItemUse"/>
///     TriggerOnStartOfCombat (child) <see cref="TriggerOnStartOfCombat"/>
///     TriggerOnFirstTimeOccurrence (child) <see cref="TriggerOnFirstTimeOccurrence"/>
///     TriggerOnStatIncrease (child) <see cref="TriggerOnStatIncrease"/>
///     TriggerOnStatDecrease (child) <see cref="TriggerOnStatDecrease"/>
///     TriggerOnBuy (child) <see cref="TriggerOnBuy"/>
///     TriggerOnSell (child) <see cref="TriggerOnSell"/>
///     TriggerWinFight (child) <see cref="TriggerWinFight"/>
///     TriggerLoseFight (child) <see cref="TriggerLoseFight"/>
///     TriggerStartOfHour (child) <see cref="TriggerStartOfHour"/>
///     TriggerStartOfDay (child) <see cref="TriggerStartOfDay"/>
/// 
/// 
/// 
/// Old:
/// Divyam: Complete these tests (1-5)
/// Specifically, looks at the various triggers.
/// Tests the effect conditions such as start of combat, start of day, stat change, etc.
///
/// 1. Start of combat effects: setup on both sides using skills and items (some with multiple SOC) per placeable.
/// 2. Half Health Lost: ...
/// 3. Permanent conditions: Should not trigger other effects. Permanent effect: Your opponent has half health.
///    This should not trigger a half health loss effect.
/// 4. On Stat Change: ... complete the test below.
/// 5. On Stat Change: With 3 cooldown items on the opponent's side, plasma grenade on use should trigger 5 charge instances on Power Drill
/// 
/// (Divyam: Add test for TriggerPermanently with condition
/// Use an item such as crows nest. With 2 weapons there is no lifesteal but with 1 it gains lifesteal.
/// 
/// (Divyam) Add test for:                 description: "For each adjacent Aquatic item, reduce this item's cooldown by 1 second.",
/// (Divyam: add a test for this                     description: "When you use this, Reload this 1 Ammo if it is your only Weapon with a cooldown",
/// </summary>

[TestFixture]
public class EffectConditionTriggerTest : BaseTest
{

    /// <summary>
    /// 1A. Permanent triggers occur outside combat: permanent effect does not trigger a SOC.
    /// </summary>
    [Test]
    public void TestPermanentDoesNotTriggerSoc()
    {

    }

    /// <summary>
    /// Permanent effects are sequenced correctly.
    /// </summary>
    [Test]
    public void TestPermanentEffectsAreCorrectlySequeced()
    {
        // Incomplete but can use this
        Item item = ItemFactory.PermanentEffects;
    }



    /// <summary>
    /// 1. Tests the start of combat effects with a setup on both sides using skills and items (some with multiple SOC) per placeable.
    /// // Divyam: Expand test based on the description above.
    /// </summary>
    [Test]
    public void TestStartOfCombatEffectsWithFullSetup()
    {
        // Arrange
        Mechanics.IntervalMS = 1;
        Skill TestLashOut = SkillFactory.TestLashOut;
        Skill TestSocBurn = SkillFactory.TestSocBurn;
        Item TestSocItem = ItemFactory.TestSOCEffects;
        Game.Place(TestLashOut);
        Game.Place(TestSocBurn);
        Game.Place(TestSocItem);

        // Act & Assert
        // Since this is a SOC, it should trigger on the first tick.
        // Opponent should be poisoned for 6.
        // Player should be poisoned for 10.
        // Opponent should be Burned for 6.
        // Player should be Buned for 10.
        Game.ProgressClock(1);
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Poison), Is.EqualTo(6));
        Assert.That(Game.PlayerBottom.GetStatValue(EStat.Poison), Is.EqualTo(10));

        Assert.That(Game.PlayerTop.GetStatValue(EStat.Burn), Is.EqualTo(6));
        Assert.That(Game.PlayerBottom.GetStatValue(EStat.Burn), Is.EqualTo(10));
    }

    /// <summary>
    /// 2. Tests the half health lost effect.
    /// Divyam: I've fixed the original error but sonething else needs to be adjusted to get it to work.
    /// </summary>
    [Test] // Uncomment: Divyam
    public void TestHalfHealthLostEffect()
    {
        // Arrange
        Item TestHalfHealthLost = ItemFactory.TestHalfHealthEffect;

        Game.Place(TestHalfHealthLost);

        // Act & Assert
        Game.ProgressClock(2000);

        Assert.That(Game.PlayerBottom.GetStatValue(EStat.Health), Is.EqualTo(150));
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(150));

        // Opponent should have 5 Poison.
        // Player should have 5 Poison.
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Poison), Is.EqualTo(5));
        Assert.That(Game.PlayerBottom.GetStatValue(EStat.Poison), Is.EqualTo(5));
    }

    // [Test] Divyam: fix
    public void TestPermanentConditions()
    {
        // Arrange
        Item TestHalfHealthLost = ItemFactory.TestHalfHealthEffect;
        Skill TestHalfHealthLostSkill = SkillFactory.TestHalfHealth;

        Game.Place(TestHalfHealthLost);
        Game.Place(TestHalfHealthLostSkill);

        // Act & Assert
        Game.ProgressClock(500);
        // Opponent should be at half health.
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Health), Is.EqualTo(150));

        // Opponent should have 0 Poison.
        // Player should have 0 Poison.
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Poison), Is.EqualTo(0));
        Assert.That(Game.PlayerBottom.GetStatValue(EStat.Poison), Is.EqualTo(0));
    }

    /// <summary>
    /// 4. Tests Stat change triggers.
    /// </summary>
    [Test]
    public void TestTriggerOnStatChange()
    {
        // Arrange

        // Bellelista is affected by haste:
        // Haste on itself charges it 1s
        // Haste on player increases damage.
        CooldownItem bellelista = (CooldownItem)ItemFactory.TestBellelista;
        Item haster = ItemFactory.AllExternalCooldownStats;
        Game.Place(bellelista);
        // Applies haste on item every 2s
        Game.Place(haster);

        // Divyam: Add item that hastes AllExternalCooldownStats so this should only be increasing damage and not charging it

        // Act
        Game.ProgressClock(2000);

        // Assert
        // Haste is applied, Bellelista should have charged
        // Its cooldown should be 2s + charge
        Assert.That(bellelista.CurrentCooldownProgress, Is.EqualTo(2000 + 1000));

        // Act
        int BellelistaCooldown = 4000;
        int charge = 1000;
        int progressAfter2Seconds = 2000 + charge;
        int remainingCooldown = BellelistaCooldown - progressAfter2Seconds;
        int halfFromHaste = remainingCooldown / 2;
        Game.ProgressClock(halfFromHaste);

        // Assert that item should have been used once
        Assert.That(bellelista.GetUsage(EStat.TimesUsed), Is.EqualTo(1));
    }

    /// <summary>
    /// 5. On Stat Change: With 3 cooldown items on the opponent's side, plasma grenade on use should trigger 5 charge instances on Power Drill
    /// </summary>
    // [Test] (Later: Fix this when doing dooley items)
    public void TestPlasmaGrenadeOnUse()
    {
        // Arrange for bottom
        Item plasmaGrenade = ItemFactory.TestPlasmaGrenade;
        Item powerDrill = ItemFactory.TestPowerDrill;
        Game.Place(plasmaGrenade);
        Game.Place(powerDrill);

        // Arrange for top, place 3 cooldown items.
        Game.PlaceForTopSide(ItemFactory.TestShield);
        Game.PlaceForTopSide(ItemFactory.AllExternalCooldownStats);
        Game.PlaceForTopSide(ItemFactory.AllHealStats);

        // Act
        Game.ProgressClock(9000);

        // Assert: Power drill should have 5 charges
        Assert.That(powerDrill.GetUsage(EStat.TimesUsed), Is.EqualTo(1));
    }
}