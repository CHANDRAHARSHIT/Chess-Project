// using NUnit.Framework;

// public class ItemCreatorTest
// {
//     private const int NumberOfItemsToTest = 1000;

//     /// <summary>
//     /// Tests creating and adding small items to the playmat.
//     /// Selects 10 random small items and places them on the playmat.
//     /// Asserts that the number of occupied slots is equal to the number of items placed multiplied by the item size.
//     /// </summary>
//     [Test]
//     public void TestCreateAndAddSmallItems()
//     {
//         var smallItems = ItemCreator.SmallItems.ToList();
//         var randomSmallItems = smallItems.OrderBy(static x => System.Guid.NewGuid()).Take(10).ToList();

//         Game game = new();

//         foreach (var itemName in randomSmallItems)
//         {
//             var item = ItemCreator.GetItem(itemName);
//             game.Place(item);
//         }

//         Assert.That(game.Player.Playmat.OccupiedSlots, Is.EqualTo(randomSmallItems.Count * (int)ESize.Small));
//     }

//     /// <summary>
//     /// Tests creating and adding medium items to the playmat.
//     /// Selects 5 random medium items and places them on the playmat.
//     /// Asserts that the number of occupied slots is equal to the number of items placed multiplied by the item size.
//     /// </summary>
//     [Test]
//     public void TestCreateAndAddMediumItems()
//     {
//         var mediumItems = ItemCreator.MediumItems.ToList();
//         var randomMediumItems = mediumItems.OrderBy(static x => System.Guid.NewGuid()).Take(5).ToList();

//         Game game = new();

//         foreach (var itemName in randomMediumItems)
//         {
//             var item = ItemCreator.GetItem(itemName);
//             game.Place(item);
//         }

//         Assert.That(game.Player.Playmat.OccupiedSlots, Is.EqualTo(randomMediumItems.Count * (int)ESize.Medium));
//     }

//     /// <summary>
//     /// Tests creating and adding large items to the playmat.
//     /// Selects 3 random large items and places them on the playmat.
//     /// Asserts that the number of occupied slots is equal to the number of items placed multiplied by the item size.
//     /// </summary>
//     [Test]
//     public void TestCreateAndAddLargeItems()
//     {
//         var largeItems = ItemCreator.LargeItems.ToList();
//         var randomLargeItems = largeItems.OrderBy(static x => System.Guid.NewGuid()).Take(3).ToList();

//         Game game = new();

//         foreach (var itemName in randomLargeItems)
//         {
//             var item = ItemCreator.GetItem(itemName);
//             game.Place(item);
//         }

//         Assert.That(game.Player.Playmat.OccupiedSlots, Is.EqualTo(randomLargeItems.Count * (int)ESize.Large));
//     }

//     /// <summary>
//     /// Tests creating and adding small items to the playmat.
//     /// Iterates through small items in batches of 10 and places them on the playmat.
//     /// Asserts that the number of occupied slots is equal to the number of items placed multiplied by the item size.
//     /// </summary>
//     [Test]
//     public void TestCreateAndAddSmallItemsNonRandom()
//     {
//         var smallItems = ItemCreator.SmallItems.ToList();
//         int totalItems = smallItems.Count;

//         for (int i = 0; i < NumberOfItemsToTest && i < totalItems; i += 10)
//         {
//             Game game = new(); // Reset the game for each batch of 10 items

//             int itemsPlaced = 0;
//             for (int j = 0; j < 10 && (i + j) < totalItems; j++)
//             {
//                 var itemName = smallItems[i + j];
//                 var item = ItemCreator.GetItem(itemName);
//                 game.Place(item);
//                 itemsPlaced++;
//             }

//             Assert.That(game.Player.Playmat.OccupiedSlots, Is.EqualTo(itemsPlaced * (int)ESize.Small));
//         }
//     }

//     /// <summary>
//     /// Tests creating and adding medium items to the playmat.
//     /// Iterates through medium items in batches of 5 and places them on the playmat.
//     /// Asserts that the number of occupied slots is equal to the number of items placed multiplied by the item size.
//     /// </summary>
//     [Test]
//     public void TestCreateAndAddMediumItemsNonRandom()
//     {
//         var mediumItems = ItemCreator.MediumItems.ToList();
//         int totalItems = mediumItems.Count;

//         for (int i = 0; i < NumberOfItemsToTest && i < totalItems; i += 5)
//         {
//             Game game = new(); // Reset the game for each batch of 5 items

//             int itemsPlaced = 0;
//             for (int j = 0; j < 5 && (i + j) < totalItems; j++)
//             {
//                 var itemName = mediumItems[i + j];
//                 var item = ItemCreator.GetItem(itemName);
//                 game.Place(item);
//                 itemsPlaced++;
//             }

//             Assert.That(game.Player.Playmat.OccupiedSlots, Is.EqualTo(itemsPlaced * (int)ESize.Medium));
//         }
//     }

//     /// <summary>
//     /// Tests creating and adding large items to the playmat.
//     /// Iterates through large items in batches of 3 and places them on the playmat.
//     /// Asserts that the number of occupied slots is equal to the number of items placed multiplied by the item size.
//     /// </summary>
//     [Test]
//     public void TestCreateAndAddLargeItemsNonRandom()
//     {
//         var largeItems = ItemCreator.LargeItems.ToList();
//         int totalItems = largeItems.Count;

//         for (int i = 0; i < NumberOfItemsToTest && i < totalItems; i += 3)
//         {
//             Game game = new(); // Reset the game for each batch of 3 items

//             int itemsPlaced = 0;
//             for (int j = 0; j < 3 && (i + j) < totalItems; j++)
//             {
//                 var itemName = largeItems[i + j];
//                 var item = ItemCreator.GetItem(itemName);
//                 game.Place(item);
//                 itemsPlaced++;
//             }

//             Assert.That(game.Player.Playmat.OccupiedSlots, Is.EqualTo(itemsPlaced * (int)ESize.Large));
//         }
//     }
// }