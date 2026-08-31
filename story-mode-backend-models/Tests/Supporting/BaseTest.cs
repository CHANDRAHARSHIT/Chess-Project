using NUnit.Framework;

public class BaseTest
{
    protected Game Game = Game.Instance;

    [SetUp]
    public void GlobalSetup()
    {
        Game.Place(HeroFactory.TestHero);
        Game.PlaceForTopSide(HeroFactory.TestHero);
        Mechanics.IntervalMS = 500;
        Mechanics.SandstormStartsAfterMS = 10000;
        Mechanics.SandstormDurationMS = 1000;
        Mechanics.DisableSandstormDamage = true;

        // Divyam:
        // Create a permanent effect with which will have no impact and add it here.
        // All tests should still pass. Anything that does not indicates a bug around the reset mechanics.
    }

    [TearDown]
    public void GlobalTeardown()
    {
        Game.Reset();
    }

    /// <summary>
    /// Generics test cases for boolean values.
    /// </summary>
    /// <returns></returns>
    protected static IEnumerable<bool> BoolTestCases()
    {
        yield return true;
        yield return false;
    }
}

