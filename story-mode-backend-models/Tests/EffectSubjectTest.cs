using NUnit.Framework;

/// <summary>
/// Tests the suject selection of an effect. <see cref="SubjectSelector"/>
/// 
/// (Add links to the tests and order/number them. Also, use the new structure. Divyam)
/// 1. SubjectThisPlaceable (child) <see cref="SubjectThisItem"/>
///     <see cref="TestSubjectThisPlaceable"/>
/// 2. SubjectOpposingPlayer (child) <see cref="SubjectOpposingPlayer"/>
///    <see cref="TestSubjectOpposingPlayer"/> ...
/// 3. SubjectPlayerOwner (child) <see cref="SubjectPlayerOwner"/>
/// 4. SubjectOpposingPlayer (child) <see cref="SubjectOpposingPlayer"/>
/// 5. SubjectBothPlayers (child) <see cref="SubjectBothPlayers"/>
/// 6. SubjectItemsWithoutDirection (child) <see cref="SubjectItemsWithoutDirectionRelativeToItem"/>
///    A. Left-most/Right-most/Random/All shields are buffed
///    B. Teiered subjects (Divyam: at a test for teired selection based on subset)
/// 7. SubjectItemsOnBothPlaymats (child) <see cref="SubjectItemsOnBothPlaymats"/>
/// 8. SubjectItemsWithDirectionRelativeToItem (child) <see cref="SubjectItemsWithDirectionRelativeToItem"/>
/// </summary>

[TestFixture]
public class EffectSubjectTest : BaseTest
{
    /// <summary>
    /// 1. SubjectThisPlaceable
    /// </summary>
    [Test]
    public void TestSubjectThisPlaceable()
    {
        // Arrange
        CooldownItem testItem = (CooldownItem)ItemFactory.TestTheCore; // When (you use) (any item) to (the left of this), Charge this 1 second(s).
        Item testTool = ItemFactory.TestTool;
        Item testTool2 = ItemFactory.TestTool;

        Game.Place(testTool);
        Game.Place(testTool2);
        Game.Place(testItem);

        // Act: Progress to the first use of tool
        Game.ProgressClock(2000);

        // Assert:
        Assert.That(testItem.CurrentCooldownProgress, Is.EqualTo(4000)); // should be charged 2 times
    }

    /// <summary>
    /// 6A. Left-most/Right-most shields are buffed
    /// Divyam: Extend this test to check rightmost, OneRandom, TwoRandom, ThreeRandom, FourRandom, All
    /// Would be easier to create the skill effect dynamically here in the test.
    /// You can make a function AddEffect and then dynamically add the effect to some test skill with empty effects.
    /// </summary>
    [Test]
    public void TestLeftmostAndRightmostSelection()
    {
        // Arrange
        Skill testSkill = SkillFactory.FrontalShielding; // buffs left-most by 20
        Item testItem = ItemFactory.TestShield;
        Item testItem2 = ItemFactory.Abacus;
        Game.Place(testItem);
        Game.Place(testItem2);
        Game.Place(testSkill);

        // Act: Progress to the first use of the tool
        Game.ProgressClock(500);

        // Assert:
        Assert.That(testItem.GetStatValue(EStat.Shield), Is.EqualTo(21));
    }

    /// <summary>
    /// 3. SubjectPlayerOwner 
    /// </summary>
    [Test]
    public void TestSubjectPlayerOwner()
    {
        // Arrange
        Item testItem2 = ItemFactory.TestSOCEffects; // applies burn, poison to PlayerOwner()
        Game.Place(testItem2);

        // Act: Progress to the first use of the tool
        Game.ProgressClock(500);

        // Assert:
        Assert.That(Game.PlayerBottom.GetStatValue(EStat.Burn), Is.EqualTo(4)); // 1 burn per 500ms
        Assert.That(Game.PlayerBottom.GetStatValue(EStat.Poison), Is.EqualTo(5));
    }

    /// <summary>
    /// 4. SubjectOpposingPlayer
    /// </summary>
    [Test]
    public void TestOpposingPlayer()
    {
        // Arrange
        Item testItem2 = ItemFactory.TestSOCEffects; // applies 3 burn and 3 poison to OpposingPlayer()
        Game.Place(testItem2);

        // Act: Progress to the first use of the tool
        Game.ProgressClock(500);

        // Assert:
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Burn), Is.EqualTo(2)); // 1 burn per 500ms
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Poison), Is.EqualTo(3));
    }

    /// <summary>
    /// 5. SubjectBothPlayers
    /// </summary> 
    [Test]
    public void TestSubjectBothPlayers()
    {
        // Arrange
        Item testItem2 = ItemFactory.TestPlasmaGrenade; // applies 5 burn to SubjectBothPlayers().
        Game.Place(testItem2);

        // Act: Progress to the first use of the tool
        Game.ProgressClock(9000);

        // Assert:
        Assert.That(Game.PlayerTop.GetStatValue(EStat.Burn), Is.EqualTo(5)); // 1 burn per 500ms
        Assert.That(Game.PlayerBottom.GetStatValue(EStat.Burn), Is.EqualTo(5)); // 1 burn per 500ms

    }

    /// <summary>
    /// 7. SubjectItemsOnBothPlaymats
    /// </summary>
    [Test]
    public void TestSubjectItemsOnBothPlaymats()
    {
        // Arrange
        Item testItem2 = ItemFactory.TestItemDestroyer; // Destroyes all items on both playmats
        Item simpleItem = ItemFactory.SimpleItem;

        Game.Place(testItem2);
        Game.PlaceForTopSide(simpleItem);

        // Act: Progress to the first use of the tool
        Game.ProgressClock(3000);

        // Assert:
        Assert.That(Game.PlayerTop.Playmat.Items, Is.Empty);
        Assert.That(Game.PlayerBottom.Playmat.Items, Is.Empty); // All items are destroyed

    }


}
