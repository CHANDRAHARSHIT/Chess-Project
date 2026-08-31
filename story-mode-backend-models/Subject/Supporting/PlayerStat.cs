using System.Text.Json;

/// <summary>
/// Represents the stats of a player.
/// </summary>
public class PlayerStats
{
    /// <summary>
    /// The player that these stats belong to.
    /// </summary>
    public Player? Player { get; set; }

    /// <summary>
    /// Maintain a list of the Player stats.
    /// Health can be negative.
    /// </summary>
    public readonly Dictionary<EStat, int> Stats = new()
    {
        { EStat.MaxHealth, 300 },
        { EStat.Health, 300 },
        { EStat.Shield, 0 },
        { EStat.Poison, 0 },
        { EStat.Burn, 0 },
        { EStat.Regeneration, 0 },
        { EStat.Gold, 0 },
        { EStat.Income, 0 }
    };

    /// <summary>
    /// Maintain a list of the totals for damage.
    /// </summary>
    public readonly Dictionary<EStat, int> DamageTotals = new()
    {
        { EStat.Burn, 0 }, // burn damage
        { EStat.Poison, 0 }, // poison damage
        { EStat.Damage, 0 }, // weapon damage
        { EStat.Sandstorm, 0 } // sandstorm damage
    };

    /// <summary>
    /// Maintain a list of the totals for healing.
    /// </summary>
    public readonly Dictionary<EStat, int> HealTotals = new()
    {
        { EStat.Heal, 0 },
        { EStat.Regeneration, 0 }
    };

    /// <summary>
    /// Maintain a list of the first time flags.
    /// </summary>
    public readonly Dictionary<EFirstTimeFlags, bool> FirstTimeFlags = new()
    {
        { EFirstTimeFlags.FirstTimeBelowHalfHealth, false }
    };

    // Convenience methods
    internal void Heal(int value) { HealHandler.Heal(value, this); }
    internal void TakeDamage(int value) { WeaponHandler.TakeDamage(value, this); }

    /// <summary>
    /// Constructor for the player stats.
    /// </summary>
    /// <param name="stats"></param>
    public PlayerStats(Dictionary<EStat, int> stats)
    {
        // Replace the default values with the stats that were passed in.
        foreach (var kvp in stats)
        {
            Stats[kvp.Key] = kvp.Value;
        }
    }

    /// <summary>
    /// Default constructor for the player stats.
    /// </summary>
    public PlayerStats()
    {
        foreach (var key in Enum.GetValues<EStat>())
        {
            Stats[key] = key switch
            {
                EStat.MaxHealth => 300,
                EStat.Health => 300,
                EStat.Shield => 0,
                EStat.Poison => 0,
                EStat.Burn => 0,
                EStat.Regeneration => 0,
                EStat.Gold => 0,
                EStat.Income => 0,
                _ => 0
            };
        }
    }
    public void Reset()
    {
        // Reset the damage totals to their default values.
        DamageTotals[EStat.Burn] = 0; // burn damage
        DamageTotals[EStat.Poison] = 0; // poison damage
        DamageTotals[EStat.Damage] = 0; // weapon damage
        DamageTotals[EStat.Sandstorm] = 0; // sandstorm damage
        DamageTotals[EStat.Sandstorm] = 0; // sandstorm damage

        // Reset the heal totals to their default values.
        HealTotals[EStat.Heal] = 0;
        HealTotals[EStat.Regeneration] = 0;

        // Reset the stats to their default values.
        Stats[EStat.Health] = Stats[EStat.MaxHealth]; // Reset health to max health
        Stats[EStat.Shield] = 0; // Reset shield to 0
        Stats[EStat.Burn] = 0; // burn damage
        Stats[EStat.Poison] = 0; // poison damage


        // Reset the first time flags to their default values.
        FirstTimeFlags[EFirstTimeFlags.FirstTimeBelowHalfHealth] = false;
    }

    /// <summary>
    /// Gets the current stats.
    /// </summary>
    /// <returns></returns>
    internal Dictionary<EStat, int> GetStats()
    {
        return Stats;
    }

    /// <summary>
    /// Gets the value of the stat.
    /// </summary>
    /// <param name="statType"></param>
    /// <returns></returns>
    internal int GetStatValue(EStat statType)
    {
        return Stats[statType];
    }

    /// <summary>
    /// Gets the totals.
    /// </summary>
    /// <returns></returns>
    internal Dictionary<EStat, int> GetTotals()
    {
        return DamageTotals;
    }

    /// <summary>
    /// Gets the total for the stat.
    /// </summary>
    /// <param name="statType"></param>
    /// <returns></returns>
    internal int GetTotal(EStat statType)
    {
        return statType switch
        {
            EStat.Heal => HealTotals[statType],
            _ when DamageTotals.ContainsKey(statType) => DamageTotals[statType],
            _ => throw new ArgumentException($"Invalid stat type: {statType}")
        };
    }

    /// <summary>
    /// Modifies the stat.
    /// </summary>
    /// <param name="statBeingModified"></param>
    /// <param name="v"></param>
    /// <param name="operator"></param>
    /// <param name="initiatorStat">The modification of this stat may initiated by another stat. For instance, health is decreased by poison or burn.</param>
    /// <exception cref="NotImplementedException"></exception>
    internal void ModifyStat(EStat statBeingModified, int v, EOperator @operator, Placeable? initiator = null, EStat? initiatorStat = null)
    {
        int value = Stats[statBeingModified];

        if (v > value && @operator == EOperator.Subtract && statBeingModified != EStat.Health)
        {
            throw new NotImplementedException($"{statBeingModified} cannot be negative.");
        }

        if (v == 0 && @operator == EOperator.Divide)
        {
            throw new NotImplementedException("A stat was incorrectly modified as it resulted in a divide by zero.");
        }

        Stats[statBeingModified] = @operator switch
        {
            EOperator.Add => value + v,
            EOperator.Subtract => value - v,
            EOperator.Multiply => value * v,
            EOperator.Divide => value / v,
            EOperator.Percentage => value * v / 100,
            EOperator.Set => v,
            _ => throw new NotImplementedException("Operator not implemented.")
        };

        HandleStatSpecificChecks(statBeingModified, @operator, v,
            initiator, initiatorStat);
    }

    /// <summary>
    /// Helper method to handle stat specific checks.
    /// </summary>
    /// <param name="statBeingModified"></param>
    /// <param name="operator"></param>
    /// <param name="v"></param>
    /// <param name="initiator"></param>
    /// <param name="initiatorStat"></param>
    private void HandleStatSpecificChecks(EStat statBeingModified, EOperator @operator, int v, Placeable? initiator, EStat? initiatorStat)
    {
        switch (statBeingModified)
        {
            case EStat.Health:
                HealthMechanicsHandler.HandleHealthOnStatModification(@operator, v, this, initiator, initiatorStat);
                break;
            case EStat.Burn:
                BurnMechanicsHandler.HandleBurnOnStatModification(@operator, v, initiator, initiatorStat);
                break;
            case EStat.Poison:
                PoisonMechanicsHandler.HandlePoisonOnStatModification(@operator, v, initiator, initiatorStat);
                break;
            case EStat.MaxHealth:
                // If Max health is less than current health, set current health to max health.
                if (Stats[EStat.MaxHealth] < Stats[EStat.Health])
                {
                    Stats[EStat.Health] = Stats[EStat.MaxHealth];
                }
                break;

                // default:
                // Do nothing.
                // break;
        }

        switch (initiatorStat) // Added check for Heal
        {
            case EStat.Heal:
                HealHandler.ReduceBurnAndPoison(this);
                break;
        }
    }

    /// <summary>
    /// Get the string representation of the player stats.
    /// </summary>
    /// <returns></returns>
    public override string ToString()
    {
        return $"Current Stats:\n{GetPlayerCurrentStatsString()}\nDamage Totals:\n{GetPlayerTotalsString()}";

        /// <summary>
        /// Helper function to get the string of the current stats.
        /// </summary>
        /// <returns></returns>
        string GetPlayerCurrentStatsString()
        {
            return GetStringFromDictionary(Stats);
        }

        /// <summary>
        /// Helper function to get the string of the totals.
        /// </summary>
        /// <returns></returns>
        string GetPlayerTotalsString()
        {
            return GetStringFromDictionary(DamageTotals);
        }

        string GetStringFromDictionary(Dictionary<EStat, int> dictionary)
        {
            string str = "";
            foreach (var stat in dictionary)
            {
                str += $" ({stat.Key.GetAbbreviation()}{stat.Value})";
            }

            return str;
        }
    }

    /// <summary>
    /// Converts the player stats data to JSON format.
    /// </summary>
    /// <returns>The player stats data in JSON format.</returns>
    public string ToJson()
    {
        var playerStatsJson = new
        {
            CurrentStats = Stats.ToDictionary(kvp => kvp.Key.ToString(), kvp => kvp.Value),
            DamageTotals = DamageTotals.ToDictionary(kvp => kvp.Key.ToString(), kvp => kvp.Value)
        };

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
        };

        return JsonSerializer.Serialize(playerStatsJson, options);
    }
}