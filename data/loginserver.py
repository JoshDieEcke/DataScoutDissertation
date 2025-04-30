from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import os
import uuid
import json
from datetime import datetime
import pandas as pd

base_dir = os.path.abspath(os.path.dirname(__file__))

db = SQLAlchemy()

app = Flask(__name__, template_folder=os.path.join(base_dir, '..', 'websiteprototype'),static_folder=os.path.join(base_dir, '..', 'websiteprototype'))

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SECRET_KEY"] = "your_secret_key"

db.init_app(app)
login_manager = LoginManager(app)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class Formation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    players = db.Column(db.JSON, nullable=False)

    user = db.relationship('User', backref=db.backref('formations', lazy=True))

class Team(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    formation_name = db.Column(db.String(100), nullable=False)
    players = db.Column(db.JSON, nullable=False)
    total_score = db.Column(db.Float, nullable=False)

    user = db.relationship('User', backref=db.backref('teams', lazy=True))

class Shortlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    player_name = db.Column(db.String(100), nullable=False)
    note = db.Column(db.String(255))  # Optional note about the player
    added_date = db.Column(db.DateTime, default=db.func.current_timestamp())

    # Relationship to user
    user = db.relationship('User', backref=db.backref('shortlisted_players', lazy=True))

    __table_args__ = (db.UniqueConstraint('user_id', 'player_name'),)

class CustomRole(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(50), nullable=False)
    group = db.Column(db.String(50), nullable=False)
    columns = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relationship to user
    user = db.relationship('User', backref=db.backref('custom_roles', lazy=True))

    # Ensure role names are unique per user
    __table_args__ = (db.UniqueConstraint('user_id', 'name'),)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        login_user(user)
        return jsonify({"message": "Login successful", "username": username}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401

@app.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route("/check-login", methods=["GET"])
def check_login():
    if current_user.is_authenticated:
        return jsonify({"logged_in": True, "username": current_user.username})
    else:
        return jsonify({"logged_in": False})

@app.route("/save-formation", methods=["POST"])
@login_required
def save_formation():
    data = request.get_json()
    name = data.get("name")
    players = data.get("players")

    if not name or not players:
        return jsonify({"error": "Invalid data"}), 400

    existing_formation = Formation.query.filter_by(user_id=current_user.id, name=name).first()
    if existing_formation:
        return jsonify({"error": "Formation name already exists"}), 400

    new_formation = Formation(name=name, players=players, user_id=current_user.id)
    db.session.add(new_formation)
    db.session.commit()
    return jsonify({"message": "Formation saved successfully"}), 201

@app.route("/get-formations", methods=["GET"])
@login_required
def get_formations():
    formations = Formation.query.filter_by(user_id=current_user.id).all()
    return jsonify([
        {"name": formation.name, "players": formation.players}
        for formation in formations
    ])

@app.route("/get-formation", methods=["GET"])
@login_required
def get_formation():
    name = request.args.get("name")
    formation = Formation.query.filter_by(user_id=current_user.id, name=name).first()
    if not formation:
        return jsonify({"error": "Formation not found"}), 404
    return jsonify({"name": formation.name, "players": formation.players})

@app.route("/delete-formation", methods=["POST"])
@login_required
def delete_formation():
    data = request.get_json()
    name = data.get("name")

    formation = Formation.query.filter_by(user_id=current_user.id, name=name).first()
    if not formation:
        return jsonify({"error": "Formation not found"}), 404

    db.session.delete(formation)
    db.session.commit()

    return jsonify({"message": "Formation deleted successfully"}), 200

@app.route("/save-team", methods=["POST"])
@login_required
def save_team():
    data = request.get_json()
    name = data.get("name")
    formation_name = data.get("formation_name")
    players = data.get("players")
    total_score = data.get("total_score")

    if not name or not formation_name or not players:
        return jsonify({"error": "Invalid data"}), 400

    existing_team = Team.query.filter_by(user_id=current_user.id, name=name).first()
    if existing_team:
        return jsonify({"error": "Team name already exists"}), 400

    new_team = Team(
        name=name,
        formation_name=formation_name,
        players=players,
        total_score=total_score,
        user_id=current_user.id
    )
    db.session.add(new_team)
    db.session.commit()
    return jsonify({"message": "Team saved successfully"}), 201

@app.route("/get-teams", methods=["GET"])
@login_required
def get_teams():
    teams = Team.query.filter_by(user_id=current_user.id).all()
    return jsonify([
        {
            "name": team.name,
            "formation_name": team.formation_name,
            "players": team.players,
            "total_score": team.total_score
        }
        for team in teams
    ])

@app.route("/get-team", methods=["GET"])
@login_required
def get_team():
    name = request.args.get("name")
    team = Team.query.filter_by(user_id=current_user.id, name=name).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404
    return jsonify({
        "name": team.name,
        "formation_name": team.formation_name,
        "players": team.players,
        "total_score": team.total_score
    })

@app.route("/delete-team", methods=["POST"])
@login_required
def delete_team():
    data = request.get_json()
    name = data.get("name")

    team = Team.query.filter_by(user_id=current_user.id, name=name).first()
    if not team:
        return jsonify({"error": "Team not found"}), 404

    db.session.delete(team)
    db.session.commit()

    return jsonify({"message": "Team deleted successfully"}), 200


@app.route("/add-to-shortlist", methods=["POST"])
@login_required
def add_to_shortlist():
    data = request.get_json()
    player_name = data.get("player_name")
    note = data.get("note", "")

    if not player_name:
        return jsonify({"error": "Player name is required"}), 400

    # Check if the player is already in the shortlist
    existing = Shortlist.query.filter_by(user_id=current_user.id, player_name=player_name).first()
    if existing:
        return jsonify({"error": "Player already in shortlist"}), 400

    # Add the player to the shortlist
    new_entry = Shortlist(user_id=current_user.id, player_name=player_name, note=note)
    db.session.add(new_entry)
    db.session.commit()

    return jsonify({"message": "Player added to shortlist successfully"}), 201


@app.route("/remove-from-shortlist", methods=["POST"])
@login_required
def remove_from_shortlist():
    data = request.get_json()
    player_name = data.get("player_name")

    if not player_name:
        return jsonify({"error": "Player name is required"}), 400

    # Find the shortlist entry
    entry = Shortlist.query.filter_by(user_id=current_user.id, player_name=player_name).first()
    if not entry:
        return jsonify({"error": "Player not found in shortlist"}), 404

    # Remove from shortlist
    db.session.delete(entry)
    db.session.commit()

    return jsonify({"message": "Player removed from shortlist successfully"}), 200


@app.route("/get-shortlist", methods=["GET"])
@login_required
def get_shortlist():
    # Get all shortlisted players for the current user
    shortlist = Shortlist.query.filter_by(user_id=current_user.id).order_by(Shortlist.added_date.desc()).all()

    shortlist_data = [{
        "player_name": item.player_name,
        "note": item.note,
        "added_date": item.added_date.strftime("%Y-%m-%d %H:%M:%S")
    } for item in shortlist]

    return jsonify(shortlist_data)


@app.route("/check-shortlisted", methods=["GET"])
@login_required
def check_shortlisted():
    player_name = request.args.get("player_name")

    if not player_name:
        return jsonify({"error": "Player name is required"}), 400

    # Check if the player is in the shortlist
    is_shortlisted = Shortlist.query.filter_by(user_id=current_user.id, player_name=player_name).first() is not None

    return jsonify({"is_shortlisted": is_shortlisted})


@app.route("/update-shortlist-note", methods=["POST"])
@login_required
def update_shortlist_note():
    data = request.get_json()
    player_name = data.get("player_name")
    note = data.get("note", "")

    if not player_name:
        return jsonify({"error": "Player name is required"}), 400

    # Find the shortlist entry
    entry = Shortlist.query.filter_by(user_id=current_user.id, player_name=player_name).first()
    if not entry:
        return jsonify({"error": "Player not found in shortlist"}), 404

    # Update the note
    entry.note = note
    db.session.commit()

    return jsonify({"message": "Note updated successfully"})


def get_player_data(player_name):
    csv_path = os.path.join(base_dir, '..', 'data', 'CleanedData.csv')

    try:
        # Read the CSV file
        df = pd.read_csv(csv_path)

        # Find the player row
        player_row = df[df['Player'] == player_name]

        if player_row.empty:
            return None

        # Convert to dictionary
        player_dict = player_row.iloc[0].to_dict()

        return player_dict
    except Exception as e:
        print(f"Error reading player data: {e}")
        return None


@app.route("/get-shortlisted-player-data", methods=["GET"])
@login_required
def get_shortlisted_player_data():
    # Get all shortlisted players
    shortlist = Shortlist.query.filter_by(user_id=current_user.id).all()
    player_names = [item.player_name for item in shortlist]

    if not player_names:
        return jsonify([])

    csv_path = os.path.join(base_dir, '..', 'data', 'CleanedData.csv')

    try:
        # Read the CSV file
        df = pd.read_csv(csv_path)

        # Filter for players in the shortlist
        shortlisted_df = df[df['Player'].isin(player_names)]

        if shortlisted_df.empty:
            return jsonify([])

        # Convert to list of dictionaries
        player_data = shortlisted_df.to_dict(orient='records')

        # Add notes from shortlist
        for player in player_data:
            shortlist_entry = next((item for item in shortlist if item.player_name == player['Player']), None)
            if shortlist_entry:
                player['note'] = shortlist_entry.note
                player['added_date'] = shortlist_entry.added_date.strftime("%Y-%m-%d %H:%M:%S")

        return jsonify(player_data)
    except Exception as e:
        print(f"Error retrieving shortlisted player data: {e}")
        return jsonify([])


@app.route("/save-custom-role", methods=["POST"])
@login_required
def save_custom_role():
    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'position', 'group', 'columns']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400

    # Check if the user already has a role with this name
    existing_role = CustomRole.query.filter_by(user_id=current_user.id, name=data['name']).first()
    if existing_role:
        return jsonify({"success": False, "error": "A role with this name already exists"}), 400

    # Create new custom role
    new_role = CustomRole(
        user_id=current_user.id,
        name=data['name'],
        position=data['position'],
        group=data['group'],
        columns=data['columns']
    )

    # Save to database
    db.session.add(new_role)

    try:
        # Load current group_column_weights
        with open('group_column_weights.json', 'r') as f:
            group_column_weights = json.load(f)

        # Add the new custom role
        group_column_weights[data['name']] = data['columns']

        # Save back to the file
        with open('group_column_weights.json', 'w') as f:
            json.dump(group_column_weights, f, indent=4)
    except Exception as e:
        print(f"Error updating group_column_weights: {e}")

    try:
        db.session.commit()
        return jsonify({"success": True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/get-custom-roles", methods=["GET"])
@login_required
def get_custom_roles():
    roles = CustomRole.query.filter_by(user_id=current_user.id).all()

    return jsonify([{
        "id": role.id,
        "name": role.name,
        "position": role.position,
        "group": role.group,
        "columns": role.columns,
        "created_at": role.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": role.updated_at.strftime("%Y-%m-%d %H:%M:%S")
    } for role in roles])


@app.route("/get-custom-role", methods=["GET"])
@login_required
def get_custom_role():
    role_id = request.args.get("id")
    if not role_id:
        return jsonify({"error": "Role ID is required"}), 400

    role = CustomRole.query.filter_by(id=role_id, user_id=current_user.id).first()
    if not role:
        return jsonify({"error": "Role not found"}), 404

    return jsonify({
        "id": role.id,
        "name": role.name,
        "position": role.position,
        "group": role.group,
        "columns": role.columns,
        "created_at": role.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": role.updated_at.strftime("%Y-%m-%d %H:%M:%S")
    })


@app.route("/update-custom-role", methods=["POST"])
@login_required
def update_custom_role():
    data = request.get_json()

    # Validate required fields
    required_fields = ['id', 'name', 'position', 'group', 'columns']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400

    # Find the role
    role = CustomRole.query.filter_by(id=data['id'], user_id=current_user.id).first()
    if not role:
        return jsonify({"success": False, "error": "Role not found"}), 404

    # Check if the new name conflicts with another role
    if data['name'] != role.name:
        existing_role = CustomRole.query.filter_by(user_id=current_user.id, name=data['name']).first()
        if existing_role:
            return jsonify({"success": False, "error": "A role with this name already exists"}), 400

    # Update the role
    role.name = data['name']
    role.position = data['position']
    role.group = data['group']
    role.columns = data['columns']

    try:
        # Load current group_column_weights
        with open('group_column_weights.json', 'r') as f:
            group_column_weights = json.load(f)

        # Remove old role name if it exists and name has changed
        if role.name in group_column_weights and data['name'] != role.name:
            del group_column_weights[role.name]

        # Add/update the role
        group_column_weights[data['name']] = data['columns']

        # Save back to the file
        with open('group_column_weights.json', 'w') as f:
            json.dump(group_column_weights, f, indent=4)
    except Exception as e:
        print(f"Error updating group_column_weights: {e}")

    try:
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/delete-custom-role", methods=["POST"])
@login_required
def delete_custom_role():
    data = request.get_json()

    if 'id' not in data:
        return jsonify({"success": False, "error": "Role ID is required"}), 400

    # Find the role
    role = CustomRole.query.filter_by(id=data['id'], user_id=current_user.id).first()
    if not role:
        return jsonify({"success": False, "error": "Role not found"}), 404

    # Remember the role name for removing from group_column_weights
    role_name = role.name

    # Delete from database
    db.session.delete(role)

    try:
        # Load current group_column_weights
        with open('group_column_weights.json', 'r') as f:
            group_column_weights = json.load(f)

        # Remove the role if it exists
        if role_name in group_column_weights:
            del group_column_weights[role_name]

        # Save back to the file
        with open('group_column_weights.json', 'w') as f:
            json.dump(group_column_weights, f, indent=4)
    except Exception as e:
        print(f"Error updating group_column_weights: {e}")

    try:
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/get-all-roles", methods=["GET"])
def get_all_roles():
    try:
        # Load current group_column_weights
        with open('group_column_weights.json', 'r') as f:
            group_column_weights = json.load(f)
    except Exception as e:
        print(f"Error loading group_column_weights: {e}")
        group_column_weights = {}

    # Get all role names
    roles = list(group_column_weights.keys())

    # Organize by group
    grouped_roles = {
        "Goalkeeper": ["Goalkeeper"],
        "Defenders": ["Ball Playing Defender", "Central Defender", "No-Nonsense Centre-Back", "Full-Back", "Wing-Back"],
        "Midfielders": ["Deep Lying Playmaker", "Defensive Midfielder", "Ball Winning Midfielder",
                        "Box-To-Box Midfielder", "Advanced Playmaker", "Wide Midfielder"],
        "Attackers": ["Winger", "Poacher", "Advanced Forward", "Deep Lying Forward", "Target Forward", "False Nine"]
    }

    # Add custom roles to their respective groups
    if current_user.is_authenticated:
        custom_roles = CustomRole.query.filter_by(user_id=current_user.id).all()
        for role in custom_roles:
            if role.group in grouped_roles:
                grouped_roles[role.group].append(role.name)

    return jsonify(grouped_roles)


@app.route("/get-position-roles", methods=["GET"])
def get_position_roles():
    # Define the base position to roles mapping
    position_roles = {
        "GK": ["Goalkeeper"],
        "LB": ["Full-Back", "Wing-Back"],
        "RB": ["Full-Back", "Wing-Back"],
        "CB": ["Ball Playing Defender", "Central Defender", "No-Nonsense Centre-Back"],
        "LWB": ["Wing-Back"],
        "RWB": ["Wing-Back"],
        "LM": ["Wide Midfielder", "Winger"],
        "RM": ["Wide Midfielder", "Winger"],
        "CM": ["Deep Lying Playmaker", "Box-To-Box Midfielder", "Advanced Playmaker"],
        "CDM": ["Defensive Midfielder", "Ball Winning Midfielder", "Deep Lying Playmaker"],
        "CAM": ["Advanced Playmaker"],
        "LW": ["Winger", "Inside Forward"],
        "RW": ["Winger", "Inside Forward"],
        "ST": ["Poacher", "Advanced Forward", "Deep Lying Forward", "Target Forward", "False Nine"]
    }

    # Add custom roles to their respective positions
    if current_user.is_authenticated:
        custom_roles = CustomRole.query.filter_by(user_id=current_user.id).all()
        for role in custom_roles:
            if role.position in position_roles:
                position_roles[role.position].append(role.name)

    return jsonify(position_roles)

@app.route('/')
def home():
    return render_template('website.html')

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory(os.path.join(base_dir, '..', 'data'), filename)

@app.route('/displayData')
def displayData():
    return render_template('displayData.html')

@app.route('/teamBuilder')
def teamBuilder():
    return render_template('teambuilder.html')

@app.route('/compare')
def compare():
    return render_template('compare.html')

@app.route('/account')
def account():
    return render_template('account.html')

@app.route('/scoutingReport')
def scoutingReport():
    return render_template('scoutingreport.html')

@app.route('/playerPage')
def playerPage():
    return render_template('player.html')


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(port=4000)
