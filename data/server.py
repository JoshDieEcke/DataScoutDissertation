from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from scipy.sparse import data
import pandas as pd
from scipy.stats import percentileofscore
import json
import os


template_dir = os.path.abspath("/Users/joshua/Documents/GitHub/Diss/websiteprototype")

app = Flask(__name__, template_folder=template_dir)
CORS(app)


# Load the CSV file
file_path = "PossessionAdjustedData.csv"
df = pd.read_csv(file_path).fillna(0)

file_path_2022 = "PossessionAdjustedData2022.csv"
df_2022 = pd.read_csv(file_path_2022).fillna(0)

# Define weights for importance levels
weights = {'high': 3, 'medium': 2, 'low': 1}


def load_group_column_weights():
    try:
        if not os.path.exists('group_column_weights.json'):
            default_weights = {
                'Goalkeeper': {
                    'Aerials Won': 'high'
                },
                'Ball Playing Defender': {
                    'Pass Completion %': 'high',
                    'Progressive Passes': 'high',
                    'Passes into Final Third': 'high',
                    'Passes Attempted (Long)': 'medium',
                    'Passes into Penalty Area': 'medium',
                    'Aerials Won': 'medium',
                    'Interceptions': 'medium',
                    'Tackles Won': 'low',
                    'Clearances': 'low',
                    'Key Passes': 'low'
                },
                'Central Defender': {
                    'Interceptions': 'high',
                    'Tackles Won': 'high',
                    'Blocks': 'high',
                    'Clearances': 'medium',
                    'Aerials Won': 'medium',
                    'Aerials Lost': 'low',
                    'Pass Completion %': 'medium',
                    'Progressive Passes': 'medium',
                    'Passes Attempted (Long)': 'low',
                    'Tackles (Def 3rd)': 'low'
                },
                'No-Nonsense Centre-Back': {
                    'Tackles Won': 'high',
                    'Dribblers Tackled': 'high',
                    'Clearances': 'high',
                    'Interceptions': 'medium',
                    'Blocks': 'medium',
                    'Aerials Won': 'medium',
                    'Aerials Lost': 'low',
                    'Pass Completion %': 'low',
                    'Progressive Passes': 'low',
                    'Passes into Final Third': 'low',
                    'Goals': 'low'
                },
                'Wing-Back': {
                    'Tackles Won': 'high',
                    'Dribblers Tackled': 'high',
                    'Clearances': 'medium',
                    'Interceptions': 'medium',
                    'Progressive Passes': 'high',
                    'Passes into Final Third': 'high',
                    'Crosses into Penalty Area': 'high',
                    'Aerials Won': 'medium',
                    'Aerials Lost': 'low',
                    'Pass Completion %': 'medium',
                    'Goals': 'medium',
                    'Assists': 'high',
                    'Goals + Assists': 'high',
                    'Key Passes': 'high',
                    'Touches (Att 3rd)': 'high',
                    'Take-Ons Attempted': 'medium',
                },
                'Full-Back': {
                    'Tackles Won': 'high',
                    'Dribblers Tackled': 'medium',
                    'Clearances': 'medium',
                    'Interceptions': 'medium',
                    'Pass Completion %': 'high',
                    'Crosses into Penalty Area': 'high',
                    'Progressive Passes': 'medium',
                    'Passes into Penalty Area': 'medium',
                    'Aerials Won': 'medium',
                    'Assists': 'medium',
                    'Key Passes': 'medium',
                    'Goals': 'low',
                    'Touches (Att 3rd)': 'medium',
                    'Blocks': 'low',
                    'Clearances': 'low',
                },
                'Deep Lying Playmaker': {
                    'Pass Completion %': 'high', 'Progressive Passes': 'high', 'Passes into Final Third': 'high',
                    'Passes into Penalty Area': 'medium', 'Key Passes': 'medium', 'Through Balls': 'high',
                    'Switches of Play': 'medium', 'Long Passes Completed': 'high', 'Progressive Carries': 'medium',
                    'Dribbles Completed': 'low', 'Interceptions': 'low', 'Tackles Won': 'low'
                },
                'Defensive Midfielder': {
                    'Tackles Won': 'high', 'Interceptions': 'high', 'Blocks': 'medium', 'Clearances': 'medium',
                    'Pass Completion %': 'high', 'Progressive Passes': 'medium', 'Passes into Final Third': 'medium',
                    'Aerials Won': 'high', 'Fouls Committed': 'low'
                },
                'Ball Winning Midfielder': {
                    'Tackles Won': 'high', 'Dribblers Tackled': 'high', 'Interceptions': 'high', 'Blocks': 'medium',
                    'Clearances': 'medium', 'Fouls Committed': 'medium', 'Aerials Won': 'medium', 'Duels Won': 'high',
                    'Pass Completion %': 'medium'
                },
                'Box-To-Box Midfielder': {
                    'Goals': 'medium', 'Assists': 'medium', 'Shots on Target %': 'medium', 'Key Passes': 'high',
                    'Passes into Final Third': 'high', 'Progressive Carries': 'high', 'Progressive Passes': 'medium',
                    'Tackles Won': 'medium', 'Dribblers Tackled': 'medium', 'Interceptions': 'medium', 'Duels Won': 'medium',
                    'Touches (Att 3rd)': 'high'
                },
                'Advanced Playmaker': {
                    'Goals': 'medium', 'Assists': 'high', 'Key Passes': 'high', 'Passes into Final Third': 'high',
                    'Through Balls': 'high', 'Progressive Passes': 'high', 'Dribbles Completed': 'high',
                    'Progressive Carries': 'high', 'Shots on Target %': 'medium', 'Pass Completion %': 'medium'
                },
                'Wide Midfielder': {
                    'Pass Completion %': 'medium', 'Progressive Passes': 'high', 'Passes into Final Third': 'high',
                    'Crosses into Penalty Area': 'high', 'Assists': 'high', 'Key Passes': 'high', 'Goals': 'medium',
                    'Progressive Carries': 'medium', 'Dribbles Completed': 'high', 'Through Balls': 'medium',
                    'Touches (Att 3rd)': 'high', 'Defensive Contributions': 'medium', 'Interceptions': 'low',
                    'Tackles Won': 'low'
                },
                'Winger': {
                    'Goals': 'high', 'Assists': 'high', 'Key Passes': 'high', 'Passes into Final Third': 'high',
                    'Crosses into Penalty Area': 'high', 'Progressive Carries': 'high', 'Dribbles Completed': 'high',
                    'Take-Ons Attempted': 'high', 'Shots on Target %': 'medium', 'Touches (Att 3rd)': 'high',
                    'Touches (Penalty Area)': 'high', 'Through Balls': 'medium', 'Pass Completion %': 'low',
                    'Defensive Contributions': 'low'
                },
                'Poacher': {
                    'Goals': 'high', 'Non-Penalty Goals': 'high', 'Shots on Target %': 'high', 'npxG': 'high',
                    'Goals/Shot': 'high', 'Touches (Penalty Area)': 'high', 'Offsides': 'medium',
                    'Progressive Carries': 'low', 'Key Passes': 'low', 'Assists': 'low'
                },
                'Advanced Forward': {
                    'Goals': 'high', 'npxG': 'high', 'Shots on Target %': 'high', 'Progressive Carries': 'high',
                    'Dribbles Completed': 'high', 'Take-Ons Attempted': 'high', 'Touches (Att 3rd)': 'high',
                    'Touches (Penalty Area)': 'medium', 'Key Passes': 'medium', 'Pass Completion %': 'low',
                    'Defensive Contributions': 'low'
                },
                'Deep Lying Forward': {
                    'Goals': 'high', 'Assists': 'high', 'Key Passes': 'high', 'xG + xAG': 'high',
                    'Progressive Carries': 'high', 'Dribbles Completed': 'high', 'Take-Ons Attempted': 'high',
                    'Shots on Target %': 'medium', 'Pass Completion %': 'medium', 'Passes into Final Third': 'medium',
                    'Defensive Contributions': 'low'
                },
                'Target Forward': {
                    'Goals': 'high', 'Aerials Won': 'high', '% of Aerials Won': 'high', 'Headers': 'high',
                    'Shots on Target %': 'medium', 'Touches (Penalty Area)': 'high', 'Hold the Ball': 'high',
                    'Passes Attempted (Long)': 'medium', 'Key Passes': 'medium', 'Assists': 'medium',
                    'Progressive Carries': 'low', 'Dribbles Completed': 'low'
                },
                'False Nine': {
                    'Assists': 'high', 'Key Passes': 'high', 'xA': 'high', 'xG + xAG': 'high',
                    'Progressive Passes': 'high', 'Progressive Carries': 'high', 'Dribbles Completed': 'medium',
                    'Goals': 'medium', 'Shots on Target %': 'medium', 'Touches (Att 3rd)': 'high',
                    'Touches (Penalty Area)': 'medium', 'Take-Ons Attempted': 'medium', 'Defensive Contributions': 'low'
                }
            }

            # Save the default values to the file
            with open('group_column_weights.json', 'w') as f:
                json.dump(default_weights, f, indent=4)

            return default_weights

        # if the file exists, load it
        with open('group_column_weights.json', 'r') as f:
            return json.load(f)

    except Exception as e:
        print(f"Error loading group_column_weights: {e}")
        return {}


# Load the group_column_weights from the JSON file
group_column_weights = load_group_column_weights()


def reload_group_column_weights():
    global group_column_weights
    group_column_weights = load_group_column_weights()


# Function to calculate weighted score
def calculate_weighted_score(row, group_data, group_weights):
    weighted_score = 0
    valid_group_weights = {col: importance for col, importance in group_weights.items() if col in group_data.columns}

    for column, importance in valid_group_weights.items():
        try:
            percentile = percentileofscore(group_data[column], row[column]) / 100
            weighted_score += percentile * weights[importance]
        except Exception as e:
            return None
    return weighted_score


@app.route("/")
def home():
    return render_template("website.html")


@app.route("/teams", methods=["GET"])
def get_teams():
    try:
        # Fetch all unique values from the Squad column
        teams = df["Squad"].unique().tolist()
        return jsonify(teams)
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/all_columns", methods=["GET"])
def get_all_columns():
    # Return all column names in the dataset
    return jsonify(df.columns.tolist())


@app.route("/player/<player_name>", methods=["GET"])
def get_player(player_name):
    filtered_df = df[df["90s Played"] >= 10]

    player_data = filtered_df[filtered_df['Player'].str.lower() == player_name.lower()]

    if player_data.empty:
        return jsonify({"error": "Player not found"}), 404

    # Get the player's role and score for the currently selected role
    role = request.args.get("role")
    if role not in group_column_weights:
        return jsonify({"error": "Invalid role"}), 400

    group_data = filtered_df.copy()
    group_weights = group_column_weights[role]

    # Calculate the player's score for the role
    player_score = calculate_weighted_score(player_data.iloc[0], group_data, group_weights)

    if player_score is None:
        return jsonify({"error": "Error calculating score for the selected role"}), 500

    # Calculate the rank for all players in the same role
    group_data["score"] = group_data.apply(
        lambda row: calculate_weighted_score(row, group_data, group_weights), axis=1
    )
    group_data = group_data.dropna(subset=["score"])

    # Rank players based on their score
    group_data["rank"] = group_data["score"].rank(ascending=False)

    # Find the rank of the searched player
    player_rank = group_data[group_data['Player'].str.lower() == player_name.lower()]["rank"].iloc[0]

    # Return player details with their score and rank
    result = {
        "Player": player_data.iloc[0]["Player"],
        "Best Role": player_data.iloc[0]["Best Role"],
        "Score": player_score,
        "Rank": int(player_rank)
    }

    return jsonify(result)


@app.route("/players", methods=["GET"])
def get_players():

    starts_with = request.args.get("starts_with", "").lower()
    if not starts_with:
        return jsonify([])

    # Filter players whose names start with the given string
    matching_players = df[df['Player'].str.lower().str.startswith(starts_with)]['Player'].tolist()
    return jsonify(matching_players)


@app.route("/roles", methods=["GET"])
def get_roles():
    return jsonify(list(group_column_weights.keys()))


@app.route("/search", methods=["GET"])
def search_player():

    player_name = request.args.get("player_name")
    if not player_name:
        return jsonify({"error": "Player name is required"}), 400

    player_data = df[df['Player'].str.lower() == player_name.lower()]

    if player_data.empty:
        return jsonify({"error": "Player not found"}), 404

    player_info = player_data.iloc[0].to_dict()

    # Render the player.html template with the player's information
    return render_template("player.html", player=player_info)


@app.route('/player', methods=['GET'])
def find_player():
    filtered_df = df[df["90s Played"] >= 10]

    player_name = request.args.get('name')

    if not player_name:
        return jsonify({"error": "No player name provided"}), 400

    # Search for the player
    player_data = filtered_df[filtered_df["Player"].str.lower() == player_name.lower()]

    if player_data.empty:
        return jsonify({"error": "Player not found"}), 404

    # Convert the row to a dictionary
    player_dict = player_data.iloc[0].to_dict()

    return jsonify(player_dict)

@app.route("/players_by_team", methods=["GET"])
def get_players_by_team():
    team = request.args.get("team")
    if not team:
        return jsonify({"error": "Team name is required"}), 400

    try:
        players = df[df["Squad"].str.lower() == team.lower()]

        if players.empty:
            return jsonify({"error": "No players found for this team"}), 404

        # Calculate scores for each player for every role
        players_with_scores = []
        for _, row in players.iterrows():
            player_scores = {}
            for role, group_weights in group_column_weights.items():
                score = calculate_weighted_score(row, df, group_weights)
                if score is not None:
                    player_scores[role] = score

            players_with_scores.append({
                "Player": row["Player"],
                "Scores": player_scores
            })

        return jsonify(players_with_scores)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/player_score", methods=["GET"])
def player_score():
    filtered_df = df[df["90s Played"] >= 10]

    player_name = request.args.get("player_name")
    role = request.args.get("role")
    if not player_name or not role:
        return jsonify({"error": "Player name and role are required"}), 400

    player_data = filtered_df[filtered_df['Player'].str.lower() == player_name.lower()]
    if player_data.empty:
        return jsonify({"error": "Player not found"}), 404

    if role not in group_column_weights:
        return jsonify({"error": "Invalid role"}), 400

    group_data = filtered_df.copy()
    group_weights = group_column_weights[role]

    player_score = calculate_weighted_score(player_data.iloc[0], group_data, group_weights)
    if player_score is None:
        return jsonify({"error": "Error calculating score for the selected role"}), 500

    group_data["score"] = group_data.apply(lambda row: calculate_weighted_score(row, group_data, group_weights), axis=1)
    group_data = group_data.dropna(subset=["score"])
    group_data["rank"] = group_data["score"].rank(ascending=False)

    player_rank = group_data[group_data['Player'].str.lower() == player_name.lower()]["rank"].iloc[0]

    result = {
        "Player": player_data.iloc[0]["Player"],
        "Best Role": player_data.iloc[0]["Best Role"],
        "Score": player_score,
        "Rank": int(player_rank)
    }
    return jsonify(result)


@app.route("/calculate", methods=["GET"])
def calculate():
    filtered_df = df[df["90s Played"] >= 10]

    role = request.args.get("role")
    if role not in group_column_weights:
        return jsonify({"error": "Invalid role"}), 400

    group_data = filtered_df.copy()
    group_weights = group_column_weights[role]

    if group_data.empty:
        return jsonify({"error": "No players found for this role"}), 404

    # Calculate the score for all players in the selected role
    group_data["score"] = group_data.apply(
        lambda row: calculate_weighted_score(row, group_data, group_weights), axis=1
    )
    group_data = group_data.dropna(subset=["score"])

    # Rank players by score
    group_data["rank"] = group_data["score"].rank(ascending=False)

    result = group_data[["Player", "score", "rank"]].sort_values(by="rank").to_dict(orient="records")
    return jsonify(result)

@app.route("/player_percentile", methods=["GET"])
def player_percentile():
    filtered_df = df[df["90s Played"] >= 10]

    # Get query parameters
    player_name = request.args.get("player_name")
    column = request.args.get("column")

    # Validate required parameters
    if not player_name or not column:
        return jsonify({"error": "Player name and column are required"}), 400

    # Check if the column exists
    if column not in filtered_df.columns:
        return jsonify({"error": f"Column '{column}' not found in the database"}), 400

    player_data = filtered_df[filtered_df['Player'].str.lower() == player_name.lower()]

    if player_data.empty:
        return jsonify({"error": "Player not found"}), 404

    # Get the player's value for the selected column
    player_value = player_data.iloc[0][column]

    # Calculate the percentile of the player's value in the selected column
    try:
        percentile = percentileofscore(filtered_df[column], player_value)
    except Exception as e:
        return jsonify({"error": f"Error calculating percentile: {str(e)}"}), 500

    # Return the result
    result = {
        "Player": player_data.iloc[0]["Player"],
        "Column": column,
        "Value": player_value,
        "Percentile": percentile
    }
    return jsonify(result)

@app.route("/compare_seasons", methods=["GET"])
def compare_seasons():
    filtered_df_2023 = df[df["90s Played"] >= 10]
    filtered_df_2022 = df_2022[df_2022["90s Played"] >= 10]

    # Get query parameters
    player_name = request.args.get("player_name")
    role = request.args.get("role")

    # Validate required parameters
    if not player_name or not role:
        return jsonify({"error": "Player name and role are required"}), 400

    # Check if the role is valid
    if role not in group_column_weights:
        return jsonify({"error": "Invalid role"}), 400

    # Search for the player in both datasets 
    player_data_2023 = filtered_df_2023[filtered_df_2023['Player'].str.lower() == player_name.lower()]
    player_data_2022 = filtered_df_2022[filtered_df_2022['Player'].str.lower() == player_name.lower()]

    if player_data_2023.empty or player_data_2022.empty:
        return jsonify({"error": "Player not found in one or both seasons"}), 404

    # Calculate the player's score for the selected role in both seasons
    group_weights = group_column_weights[role]

    score_2023 = calculate_weighted_score(player_data_2023.iloc[0], filtered_df_2023, group_weights)
    score_2022 = calculate_weighted_score(player_data_2022.iloc[0], filtered_df_2022, group_weights)

    if score_2023 is None or score_2022 is None:
        return jsonify({"error": "Error calculating score for the selected role"}), 500

    # Calculate the difference between the two scores
    score_difference = score_2023 - score_2022

    # Determine if the player has improved or gotten worse
    if score_difference > 0:
        performance_change = "improved"
    elif score_difference < 0:
        performance_change = "gotten worse"
    else:
        performance_change = "remained the same"

    # Return the result
    result = {
        "Player": player_data_2023.iloc[0]["Player"],
        "Role": role,
        "Score 2022-2023": score_2022,
        "Score 2023-2024": score_2023,
        "Score Difference": score_difference,
        "Performance Change": performance_change
    }
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
