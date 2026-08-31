// using NUnit.Framework;


// Divyam: Add new tests for these. I've refactored how directions work. 
// Direction is treated a filter for items. Size, Tier, and Type would be other filters.
/// See the SubjectItems class <see cref="SubjectItemsWithoutDirectionRelativeToItem"/> for details.
// 
// public class ItemSelection
// {
//     private Game game = new();
//     private List<Item?>? items;

//     [SetUp]
//     public void SetUp()
//     {
//         game = new Game();
//         DirectionHandler.Game = game;

//         items =
//         [
//             TestItem.CreateTestItem("Small item One"),   // 0 Bronze
//             TestItem.CreateTestItem("Small item One"),   // 1 Silver
//             null,               // 2 (null)
//             TestItem.CreateTestItem("Medium item Two"),     // 3 Gold
//                                 // 4 (occupied by Med_2)
//             TestItem.CreateTestItem("Small item Two"),   // 5 Diamond
//             TestItem.CreateTestItem("Small item One"),   // 6 Legendary
//             TestItem.CreateTestItem("Large item Two"),   // 7 Bronze
//                                 // 8 (occupied by Large_2)
//                                 // 9 (occupied by Large_2)
//         ];

//         int position = 1;
//         foreach (var item in items)
//         {
//             if (item != null)
//             {
//                 game.Place(item, position);
//                 position += (int)item.Size;
//             }
//             else
//             {
//                 position++;
//                 continue;
//             }
//         }
//     }

//     private static IEnumerable<TestCaseData> GetItemsInDirectionTestCases()
//     {
//         // Direction, ReferenceItemIndex, ExpectedItems

//         // ----------------------------------------------------- Left and Right -----------------------------------------------------
//         yield return new TestCaseData(
//             EDirection.Left,
//             5,
//             new List<Item> { TestItem.CreateTestItem("Medium item Two") }
//         ).SetName("Direction_Left_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Right,
//             0,
//             new List<Item> { TestItem.CreateTestItem("Small item One") }
//         ).SetName("Direction_Right_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.AllLeft,
//             5,
//             new List<Item> { TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Medium item Two") }
//         ).SetName("Direction_AllLeft_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.AllRight,
//             3,
//             new List<Item> { TestItem.CreateTestItem("Large item Two"), TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Small item Two") }
//         ).SetName("Direction_AllRight_ReturnsCorrectItems");

//         // ----------------------------------------------------- Adjacent -----------------------------------------------------
//         yield return new TestCaseData(
//             EDirection.Adjacent,
//             5,
//             new List<Item> { TestItem.CreateTestItem("Medium item Two"), TestItem.CreateTestItem("Small item One") }
//         ).SetName("Direction_Adjacent_MiddleItem_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Adjacent,
//             3,
//             new List<Item> { TestItem.CreateTestItem("Small item Two") }
//         ).SetName("Direction_Adjacent_NullOnLeft_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Adjacent,
//             1,
//             new List<Item> { TestItem.CreateTestItem("Small item One") }
//         ).SetName("Direction_Adjacent_NullOnRight_ReturnsCorrectItems");

//         // ----------------------------------------------------- Any -----------------------------------------------------
//         yield return new TestCaseData(
//             EDirection.AnyOne,
//             3,
//             1
//         ).SetName("Direction_AnyOne_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.AnyTwo,
//             5,
//             2
//         ).SetName("Direction_AnyTwo_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.AnyThree,
//             7,
//             3
//         ).SetName("Direction_AnyThree_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.AnyFour,
//             3,
//             4
//         ).SetName("Direction_AnyFour_ReturnsCorrectItems");

//         // ----------------------------------------------------- All -----------------------------------------------------
//         yield return new TestCaseData(
//             EDirection.All,
//             3,
//             new List<Item> { TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Small item Two"), TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Large item Two") }
//         ).SetName("All_ReturnsCorrectItems");

//         // ----------------------------------------------------- Size based  -----------------------------------------------------


//         yield return new TestCaseData(
//                     EDirection.Small,
//                     0,
//                     new List<Item> { TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Small item Two"), TestItem.CreateTestItem("Small item One") }
//                 ).SetName("Size_Small_ReturnsCorrectItems");

//         yield return new TestCaseData(
//                     EDirection.Medium,
//                     1,
//                     new List<Item> { TestItem.CreateTestItem("Medium item Two") }
//                 ).SetName("Size_Medium_ReturnsCorrectItems");

//         yield return new TestCaseData(
//                     EDirection.Large,
//                     3,
//                     new List<Item> { TestItem.CreateTestItem("Large item Two") }
//                 ).SetName("Size_Large_ReturnsCorrectItems");

//         // ----------------------------------------------------- Size based (Smaller)  -----------------------------------------------------
//         yield return new TestCaseData(
//             EDirection.Smaller,
//             7,
//             new List<Item> { TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Medium item Two"), TestItem.CreateTestItem("Small item Two"), TestItem.CreateTestItem("Small item One") }
//         ).SetName("Size_Smaller_Large_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Smaller,
//             3,
//             new List<Item> { TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Small item Two"), TestItem.CreateTestItem("Small item One") }
//         ).SetName("Size_Smaller_Med_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Smaller,
//             1,
//             new List<Item> { }
//         ).SetName("Size_Smaller_Small_ReturnsNull");

//         // ----------------------------------------------------- Size based (Larger)  -----------------------------------------------------

//         yield return new TestCaseData(
//             EDirection.Larger,
//             1,
//             new List<Item> { TestItem.CreateTestItem("Medium item Two"), TestItem.CreateTestItem("Large item Two") }
//         ).SetName("Size_Larger_Small_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Larger,
//             3,
//             new List<Item> { TestItem.CreateTestItem("Large item Two") }
//         ).SetName("Size_Larger_Med_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Larger,
//             7,
//             new List<Item> { }
//         ).SetName("Size_Larger_Large_ReturnsNull");

//         // ----------------------------------------------------- Size based (Larger)  -----------------------------------------------------

//         yield return new TestCaseData(
//             EDirection.Equal,
//             1,
//             new List<Item> { TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Small item Two"), TestItem.CreateTestItem("Small item One") }
//         ).SetName("Size_Equal_Small_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Equal,
//             3,
//             new List<Item> { }
//         ).SetName("Size_Equal_Med_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Equal,
//             7,
//             new List<Item> { }
//         ).SetName("Size_Equal_Large_ReturnsCorrectItems");

//         // ----------------------------------------------- Tier based  -----------------------------------------------------

//         yield return new TestCaseData(
//             EDirection.Bronze,
//             1,
//             new List<Item> { TestItem.CreateTestItem("Small item One"), TestItem.CreateTestItem("Large item Two") }
//         ).SetName("Tier_Bronze_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Silver,
//             3,
//             new List<Item> { TestItem.CreateTestItem("Small item One") }
//         ).SetName("Tier_Silver_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Gold,
//             5,
//             new List<Item> { TestItem.CreateTestItem("Medium item Two") }
//         ).SetName("Tier_Gold_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Diamond,
//             7,
//             new List<Item> { TestItem.CreateTestItem("Small item Two") }
//         ).SetName("Tier_Diamond_ReturnsCorrectItems");

//         yield return new TestCaseData(
//             EDirection.Legendary,
//             1,
//             new List<Item> { TestItem.CreateTestItem("Small item One") }
//         ).SetName("Tier_Legendary_ReturnsCorrectItems");

//     }

//     // ----------------------------------------------------- Test -----------------------------------------------------

//     [Test, TestCaseSource(nameof(GetItemsInDirectionTestCases))]
//     public void GetItemsInDirection_ReturnsCorrectItems(EDirection direction, int referenceItemIndex, object expectedItemsOrCount)
//     {
//         // Arrange

//         if (game == null)
//         {
//             Assert.Fail("Game not found.");
//             return;
//         }

//         // Apply tiers to the items incremently 
//         int tierIndex = 0;
//         foreach (var item in game.Player.Playmat.Items)
//         {
//             if (item != null)
//             {
//                 item.CurrentTier = (ETier)(tierIndex % Enum.GetValues<ETier>().Length);
//                 tierIndex++;
//             }
//         }

//         var referenceItem = game.Player.Playmat.GetItem(referenceItemIndex);

//         // Act


//         var result = DirectionHandler.GetItemsInDirection(direction, referenceItem ?? throw new InvalidOperationException());

//         // Assert
//         if (expectedItemsOrCount is List<Item> expectedItems)
//         {
//             Assert.That(expectedItems.Count, Is.EqualTo(result.Count));
//             for (int i = 0; i < expectedItems.Count; i++)
//             {
//                 Assert.That(expectedItems[i].Name, Is.EqualTo(result[i].Name));
//             }
//         }
//         else if (expectedItemsOrCount is int expectedCount)
//         {
//             Assert.That(result.Count, Is.EqualTo(expectedCount));
//         }
//     }
// }