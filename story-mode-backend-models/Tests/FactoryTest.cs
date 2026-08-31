// using NUnit.Framework;

// [TestFixture]

// /// <summary>
// /// Test class for Factory classes.
// Divyam: Should adjust or remove these tests. They likely won't be relevnant
// /// </summary>
// public class FactoryTest : BaseTest
// {
//     ///<summary>
//     /// Get an item from its name and check if the item is not null.
//     /// </summary>
//     [Test]
//     public void Get_ValidItemName_ReturnsItem()
//     {
//         // Arrange
//         string itemName = "All External Cooldown Stats";
//         string itemName2 = "Test Tool";

//         // Act
//         var item = ItemFactory.Get(itemName);
//         var item2 = ItemFactory.Get(itemName2);

//         // Assert
//         Assert.That(item, Is.Not.Null);
//         Assert.That(item2, Is.Not.Null);
//         Assert.That(itemName, Is.EqualTo(item.Name));
//         Assert.That(itemName2, Is.EqualTo(item2.Name));
//     }

//     /// <summary>
//     /// Get a skill from its name and check if the skill is not null.
//     /// </summary>
//     [Test]
//     public void Get_ValidSkillName_ReturnsSkill()
//     {
//         // Arrange
//         string skillName = "Test Lash Out";
//         string skillName2 = "Flamedancer";

//         // Act
//         var skill = SkillFactory.Get(skillName);
//         var skill2 = SkillFactory.Get(skillName2);

//         // Assert
//         Assert.That(skill, Is.Not.Null);
//         Assert.That(skill2, Is.Not.Null);
//         Assert.That(skillName, Is.EqualTo(skill.Name));
//         Assert.That(skillName2, Is.EqualTo(skill2.Name));
//     }

//     /// <summary>
//     /// Get Monster from default monster data, should return monster with default values.
//     /// </summary>
//     [Test]
//     public void GetMonsterFromData_ShouldReturnMonsterWithDefaultValues_WhenPlayerDataIsEmpty()
//     {
//         // Arrange
//         var playerData = new PlayerData();

//         // Act
//         var monster = MonsterDataLoader.GetMonsterFromData(playerData);

//         // Assert
//         Assert.That(monster, Is.Not.Null);
//         Assert.That("Monster", Is.EqualTo(monster.Name));
//         Assert.That(0, Is.EqualTo(monster.Playmat.Items.Count));
//         Assert.That(0, Is.EqualTo(monster.SkillDeck.Skills.Count));

//     }

//     /// <summary>
//     /// Get Monster from player data, should return monster with provided values.
//     /// </summary>
//     [Test]
//     public void GetMonsterFromData_ShouldReturnMonsterWithProvidedValues_WhenPlayerDataIsProvided()
//     {
//         // Arrange
//         var playerData = new PlayerData
//         {
//             name = "TestMonster",
//             day = 5,
//             items = new List<string> { "The Core", "Abacus" },
//             skills = new List<string> { "Deadly Eye", "Flamedancer" }
//         };

//         var monster = MonsterDataLoader.GetMonsterFromData(playerData);

//         // Act
//         Game.Place(monster);

//         Game.ProgressClock(6000);

//         // Assert   
//         Assert.That(monster, Is.Not.Null);
//         Assert.That("TestMonster", Is.EqualTo(monster.Name));
//         Assert.That(2, Is.EqualTo(monster.Playmat.Items.Count));
//         Assert.That(2, Is.EqualTo(monster.SkillDeck.Skills.Count));

//     }

// /// <summary>
// /// Test for getting all monstres for Day 1 from MonsterDataLoader.
// /// </summary>
// [Test]
// public void GetAllMonstersForDay1_ShouldReturnAllMonstersForDay1()
// {
//     // Arrange
//     var monsters = MonsterDataLoader.GetMonstersForDay("1");



//     // Assert
//     Assert.That(monsters, Is.Not.Null);
//     Assert.That(monsters.Count, Is.GreaterThan(0));
// }


// }