// using NUnit.Framework;
// using Moq;

// /// <summary>
// /// Unit tests for the <see cref="CritHandler"/> class.
// /// Divyam: Move to stats test
// /// </summary>
// [TestFixture]
// public class CritHandlerTest
// {
//     /// <summary>
//     /// Provides test cases for the <see cref="CritHandler.GetCritDamage"/> method.
//     /// </summary>
//     /// <returns>An enumerable of <see cref="TestCaseData"/> objects.</returns>
//     private static IEnumerable<TestCaseData> CritDamageTestCases()
//     {
//         // Parameters: baseDamage, critChance, randomRoll, expectedDamage

//         // No crit chance, should return base damage
//         yield return new TestCaseData(100u, 0u, 0.5, 100u)
//             .SetName("NoCritChance_ShouldReturnBaseDamage");

//         // 50% crit chance, random roll is 60%, should return base damage
//         yield return new TestCaseData(100u, 50u, 0.6, 100u)
//             .SetName("CritChance50_Random60_ShouldReturnBaseDamage");

//         // 50% crit chance, random roll is 30%, should return crit damage
//         yield return new TestCaseData(100u, 50u, 0.3, 200u)
//             .SetName("CritChance50_Random30_ShouldReturnCritDamage");

//         // 100% crit chance, should always return crit damage
//         yield return new TestCaseData(100u, 100u, 0.9, 200u)
//             .SetName("CritChance100_ShouldAlwaysCrit");
//     }

//     /// <summary>
//     /// Tests the <see cref="CritHandler.GetCritDamage"/> method using various test cases.
//     /// </summary>
//     /// <param name="baseDamage">The base damage value.</param>
//     /// <param name="critChance">The critical hit chance percentage.</param>
//     /// <param name="randomRoll">The random roll value.</param>
//     /// <param name="expectedDamage">The expected damage value.</param>
//     [Test, TestCaseSource(nameof(CritDamageTestCases))]
//     public void TestGetCritDamage(
//         int baseDamage,
//         int critChance,
//         double randomRoll,
//         int expectedDamage)
//     {
//         // Arrange
//         var mockRandom = new Mock<IRandomProvider>();
//         mockRandom.Setup(r => r.NextDouble()).Returns(randomRoll);
//         CritHandler.SetRandomProvider(mockRandom.Object);

//         // Act
//         int actualDamage = CritHandler.GetCritDamage(baseDamage, critChance);

//         // Assert
//         Assert.That(actualDamage, Is.EqualTo(expectedDamage));
//     }
// }
