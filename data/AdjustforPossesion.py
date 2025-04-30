import pandas as pd

# Load the main dataset
df = pd.read_csv("CleanedDataNew.csv")

# Load the possession data
possession_df = pd.read_csv("Possession2022.csv")  # Replace with the actual file name
possession_df = possession_df[["Squad", "Poss"]]

# Merge possession data with the main DataFrame
df = df.merge(possession_df, on="Squad", how="left")

# Define stat categories
in_possession_stats = [
    "Goals", "Assists", "Goals + Assists", "Non-Penalty Goals", "Non-Penalty Goals + Assists",
    "Penalty Kicks Made", "Penalty Kicks Attempted", "xG: Expected Goals", "npxG: Non-Penalty xG",
    "xAG: Exp. Assisted Goals", "xA: Expected Assists", "npxG + xAG", "PrgR",
    "Shots Total", "Shots on Target", "Goals/Shot", "Goals/Shot on Target",
    "Shots from Free Kicks", "Pass Attempted", "Live-ball Passes", "Dead-ball Passes", "Passes from Free Kicks",
    "Through Balls", "Passes Completed", "Total Passing Distance", "Progressive Passing Distance", "Passes Completed (Short)",
    "Passes Attempted (Short)", "Passes Completed (Medium)", "Passes Attempted (Medium)",
    "Passes Completed (Long)", "Passes Attempted (Long)", "Key Passes", "Passes into Final Third",
    "Passes into Penalty Area", "Crosses into Penalty Area", "Progressive Passes", "Switches",
    "Crosses", "Corner Kicks", "Inswinging Corner Kicks", "Outswinging Corner Kicks", "Straight Corner Kicks",
    "Shot-Creating Actions", "SCA (Live-ball Pass)", "SCA (Dead-ball Pass)", "SCA (Take-On)", "SCA (Shot)",
    "SCA (Fouls Drawn)", "SCA (Defensive Action)", "Goal-Creating Actions", "GCA (Live-ball Pass)",
    "GCA (Dead-ball Pass)", "GCA (Take-On)", "GCA (Shot)", "GCA (Fouls Drawn)", "GCA (Defensive Action)",
    "Touches", "Touches (Def 3rd)", "Touches (Mid 3rd)", "Touches (Att 3rd)", "Touches (Att Pen)",
    "Take-Ons Attempted", "Carries",
    "Total Carrying Distance", "Progressive Carries", "Progressive Carrying Distance", "Carries into Final Third",
    "Carries into Penalty Area", "Passes Received", "Progressive Passes Rec"
]

out_of_possession_stats = [
    "Yellow Cards", "Second Yellow Card", "Red Cards", "Tackles", "Tackles Won", "Tackles (Def 3rd)",
    "Tackles (Mid 3rd)", "Tackles (Att 3rd)", "Dribblers Tackled", "Blocks",
    "Shots Blocked", "Passes Blocked", "Interceptions", "Clearences", "Errors", "Fouls Committed",
    "Fouls Drawn", "Offsides", "Penalty Kicks Won", "Penalty Kicks Conceded", "Own Goals", "Ball Recoveries",
    "Aerials Won", "Aerials Lost", "Miscontrols", "Dispossessed",
]

neutral_stats = [
    "Pass Completion %", "Pass Completion % (Short)", "Pass Completion % (Medium)", "Pass Completion % (Long)",
    "Shots on Target %", "Average Shot Distance", "Non-Penalty Goals - npxG", "% of Aerials Won",
    "Assists - xAG", "npxG/Shot", "Successful Take-On %", "Tackled During Take-On Percentage", "% of Dribblers Tackled",
]


# Function to adjust statistics based on possession
def adjust_statistics_for_possession(df):
    """
    Adjusts player statistics based on their team's possession percentage.
    """
    # Make a copy of the DataFrame to avoid modifying the original
    adjusted_df = df.copy()

    # Adjust in-possession stats (positively influenced by possession)
    for stat in in_possession_stats:
        if stat in adjusted_df.columns:
            adjusted_df[stat] = adjusted_df[stat] / adjusted_df["Poss"]

    # Adjust out-of-possession stats (negatively influenced by possession)
    for stat in out_of_possession_stats:
        if stat in adjusted_df.columns:
            adjusted_df[stat] = adjusted_df[stat] * adjusted_df["Poss"]

    # Neutral stats remain unchanged
    return adjusted_df

# Adjust the statistics
adjusted_df = adjust_statistics_for_possession(df)

# Save the adjusted dataset to a new CSV file
adjusted_df.to_csv("PossessionAdjustedData2022.csv", index=False)

print("Possession-adjusted dataset saved to 'PossessionAdjustedData2022.csv'.")