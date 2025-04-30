// Get the modal and buttons
const authModal = document.getElementById("authModal");
const loginButton = document.getElementById("loginButton");
const closeButton = document.querySelector(".close");

let isIntentionallyOpeningImportPopup = false;

let playerAssignments = {};  

// Show the modal when the login button is clicked
loginButton.addEventListener("click", () => {
    authModal.style.display = "block";
});

// Hide the modal when the close button is clicked
closeButton.addEventListener("click", () => {
    authModal.style.display = "none";
});

// Hide the modal when clicking outside of it
window.addEventListener("click", (event) => {
    if (event.target === authModal) {
        authModal.style.display = "none";
    }
});

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
        alert("Login successful!");
        authModal.style.display = "none";
        updateUIForLoggedInUser(data.username);

        loadUserFormations();
    } else {
        alert(data.error);
    }
});

// Function to delete a formation
function deleteFormation(formationName) {
    if (!confirm(`Are you sure you want to delete the formation "${formationName}"?`)) {
        return;
    }
    
    fetch("/delete-formation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: formationName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Formation deleted successfully") {
            alert(`${formationName} has been deleted successfully.`);

            delete formations[formationName];
    
            const formationSelect = document.getElementById('formation');
            for (let i = 0; i < formationSelect.options.length; i++) {
                if (formationSelect.options[i].value === formationName) {
                    formationSelect.remove(i);
                    break;
                }
            }

            const deleteButtons = document.querySelectorAll('.delete-formation-btn');
            deleteButtons.forEach(button => {
                if (button.textContent === `Delete ${formationName}`) {
                    button.remove();
                }
            });

            if (formationSelect.value === formationName) {
                formationSelect.value = "4-4-2";
                updateFormation();
            }
        }
    })
    .catch(error => console.error("Error deleting formation:", error));
}

// Function to load user formations
function loadUserFormations() {
    fetch("/get-formations", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "same-origin"
    })
    .then(response => response.json())
    .then(formations => {
        const formationSelect = document.getElementById('formation');
        for (let i = formationSelect.options.length - 1; i >= 0; i--) {
            const option = formationSelect.options[i];
            if (!["4-4-2", "4-3-3", "3-5-2", "5-3-2"].includes(option.value)) {
                formationSelect.remove(i);
            }
        }

        const deleteButtonContainer = document.getElementById('delete-formation-container');
        deleteButtonContainer.innerHTML = '';
      
        formations.forEach(formation => {
            const option = document.createElement('option');
            option.value = formation.name;
            option.textContent = formation.name;
            formationSelect.appendChild(option);
 
            const deleteButton = document.createElement('button');
            deleteButton.textContent = `Delete ${formation.name}`;
            deleteButton.className = 'delete-formation-btn';
            deleteButton.onclick = () => deleteFormation(formation.name);
            deleteButtonContainer.appendChild(deleteButton);
        });
    })
    .catch(error => console.error("Error loading formations:", error));
}

// Handle register form submission
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;

    const response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
        alert("Registration successful!");
        authModal.style.display = "none";
    } else {
        alert(data.error);
    }
});

function addTeamToDropdown(teamName) {
    const teamSelect = document.getElementById('team-select');

    for (let i = 0; i < teamSelect.options.length; i++) {
        if (teamSelect.options[i].value === teamName) {
            return; 
        }
    }

    const option = document.createElement('option');
    option.value = teamName;
    option.textContent = teamName;
    teamSelect.appendChild(option);
}

function loadSavedTeams() {
    fetch("/get-teams")
        .then(response => response.json())
        .then(teams => {
            const teamSelect = document.getElementById('team-select');
     
            while (teamSelect.options.length > 1) {
                teamSelect.remove(1);
            }
     
            teams.forEach(team => {
                addTeamToDropdown(team.name);
            });
        })
        .catch(error => console.error("Error loading teams:", error));
}

// Update UI for logged-in user
function updateUIForLoggedInUser(username) {
    const authButtons = document.querySelector(".auth-buttons");
    authButtons.innerHTML = `
        <span>Welcome, ${username}</span>
        <button id="logoutButton">Logout</button>
    `;

    document.getElementById("logoutButton").addEventListener("click", async () => {
        const response = await fetch("/logout", { method: "POST" });
        if (response.ok) {
            alert("Logged out successfully!");
            window.location.reload(); 
        }
    });

    loadSavedTeams();
}

// Check login state on page load
async function checkLoginState() {
    const response = await fetch("/check-login", { method: "GET" });
    if (response.ok) {
        const data = await response.json();
        if (data.logged_in) {
            updateUIForLoggedInUser(data.username);
        }
    }
}

function saveCustomFormation() {
    const formationName = prompt("Enter a name for your formation:");
    if (!formationName) return; 

    const players = Array.from(document.querySelectorAll('.player-container')).map(container => {
        const button = container.querySelector('.player-btn');
        const roleSelect = container.querySelector('.role-select');
        return {
            label: button.dataset.originalLabel,
            top: container.style.top,
            left: container.style.left,
            role: roleSelect ? roleSelect.value : button.dataset.originalLabel
        };
    });

    // Send formation data to Flask backend
    fetch("/save-formation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formationName, players: players })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        
        formations[formationName] = players;

        const formationSelect = document.getElementById('formation');
        let exists = false;
        for (let i = 0; i < formationSelect.options.length; i++) {
            if (formationSelect.options[i].value === formationName) {
                exists = true;
                break;
            }
        }
 
        if (!exists) {
            const option = document.createElement('option');
            option.value = formationName;
            option.textContent = formationName;
            formationSelect.appendChild(option);
     
            const deleteButtonContainer = document.getElementById('delete-formation-container');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = `Delete ${formationName}`;
            deleteButton.className = 'delete-formation-btn';
            deleteButton.onclick = function() { deleteFormation(formationName); };
            deleteButtonContainer.appendChild(deleteButton);
        }
    })
    .catch(error => console.error("Error saving formation:", error));
}

function addFormationToDropdown(formationName) {
    const formationSelect = document.getElementById('formation');
    const option = document.createElement('option');
    option.value = formationName;
    option.textContent = formationName;
    formationSelect.appendChild(option);
}

document.addEventListener("DOMContentLoaded", () => {
    checkLoginState();

    const saveButton = document.getElementById('saveFormationBtn');
    if (saveButton) {
        saveButton.addEventListener('click', saveCustomFormation);
    }

    const formationSelect = document.getElementById('formation');
    const defaultFormations = ["4-4-2", "4-3-3", "3-5-2", "5-3-2"];
 
    while (formationSelect.options.length > 0) {
        formationSelect.remove(0);
    }

    defaultFormations.forEach(formation => {
        const option = document.createElement('option');
        option.value = formation;
        option.textContent = formation;
        formationSelect.appendChild(option);
    });
   
    const deleteButtonContainer = document.getElementById('delete-formation-container');
    if (deleteButtonContainer) {
        deleteButtonContainer.innerHTML = '';
    }

    fetch("/get-formations")
    .then(response => response.json())
    .then(data => {
        data.forEach(formation => {
            let exists = false;
            for (let i = 0; i < formationSelect.options.length; i++) {
                if (formationSelect.options[i].value === formation.name) {
                    exists = true;
                    break;
                }
            }

            if (!exists) {
                formations[formation.name] = formation.players;

                const option = document.createElement('option');
                option.value = formation.name;
                option.textContent = formation.name;
                formationSelect.appendChild(option);
         
                const deleteButton = document.createElement('button');
                deleteButton.textContent = `Delete ${formation.name}`;
                deleteButton.className = 'delete-formation-btn';
                deleteButton.onclick = function() { deleteFormation(formation.name); };
                deleteButtonContainer.appendChild(deleteButton);
            }
        });
    })
    .catch(error => console.error("Error loading formations:", error));

    function saveCurrentTeam() {
        console.log("saveCurrentTeam function called");

        const importPopup = document.getElementById("importPopup");
        if (importPopup) {
            console.log("Import popup status before:", importPopup.style.display);
            importPopup.style.display = "none";
        }
        
        console.log("About to show prompt for team name");
        const formationName = document.getElementById('formation').value;
        const teamName = prompt("Enter a name for your team:");
        console.log("Team name entered:", teamName);
        
        if (!teamName) return; 
  
        const totalScore = parseFloat(document.getElementById('totalScore').textContent);
        
        const players = Array.from(document.querySelectorAll('.player-container')).map(container => {
            const button = container.querySelector('.player-btn');
            const roleSelect = container.querySelector('.role-select');
            
            let playerInfo = null;
            const nameMatch = button.innerHTML.match(/<div style="font-size: 18px; font-weight: bold; color: #fff;">(.*?)<\/div>/);
            const scoreMatch = button.innerHTML.match(/Score: (\d+\.\d+)/);
            const rankMatch = button.innerHTML.match(/Rank: (\d+)/);
            
            if (nameMatch && scoreMatch && rankMatch) {
                playerInfo = {
                    name: nameMatch[1],
                    score: parseFloat(scoreMatch[1]),
                    rank: parseInt(rankMatch[1])
                };
            }
            
            return {
                label: button.dataset.originalLabel,
                top: container.style.top,
                left: container.style.left,
                role: roleSelect ? roleSelect.value : button.dataset.originalLabel,
                playerInfo: playerInfo
            };
        });
        
        // Send team data to server
        fetch("/save-team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                name: teamName,
                formation_name: formationName,
                players: players,
                total_score: totalScore
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                addTeamToDropdown(teamName);

                if (importPopup) {
                    importPopup.style.display = "none";
                }
            } else {
                alert(data.error);
            }
        })
        .catch(error => console.error("Error saving team:", error));
    } 
    
    // Function to delete a team
    function deleteTeam() {
        const teamSelect = document.getElementById('team-select');
        const teamName = teamSelect.value;
        
        if (!teamName) {
            alert("Please select a team to delete");
            return;
        }
        
        if (!confirm(`Are you sure you want to delete the team "${teamName}"?`)) {
            return;
        }
        
        fetch("/delete-team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: teamName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                for (let i = 0; i < teamSelect.options.length; i++) {
                    if (teamSelect.options[i].value === teamName) {
                        teamSelect.remove(i);
                        break;
                    }
                }
                teamSelect.value = ""; 
            } else {
                alert(data.error);
            }
        })
        .catch(error => console.error("Error deleting team:", error));
    }
    

    // Handle formation selection
    document.getElementById("formation").addEventListener("change", (e) => {
        const selectedFormation = e.target.value;

        if (formations[selectedFormation]) {
            renderFormation(selectedFormation, formations[selectedFormation]);
        } else {
            fetch(`/get-formation?name=${encodeURIComponent(selectedFormation)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.players) {
                        formations[selectedFormation] = data.players; 
                        renderFormation(selectedFormation, data.players);
                    } else {
                        console.error("No player data found for this formation");
                    }
                })
                .catch(error => console.error("Error loading formation:", error));
        }
    });

    function renderFormation(formationName, players) {
        if (["4-4-2", "4-3-3", "3-5-2", "5-3-2"].includes(formationName)) {
            updateFormation();
            return;
        }
        
        const pitch = document.getElementById("pitch");
        pitch.innerHTML = ""; 
        
        // Create player containers
        players.forEach((player) => {
            const playerContainer = document.createElement("div");
            playerContainer.className = "player-container";
            playerContainer.style.position = "absolute";
            playerContainer.style.top = player.top;
            playerContainer.style.left = player.left;
            
            const button = document.createElement("button");
            button.className = "player-btn";
            button.textContent = player.label;
            button.dataset.originalLabel = player.label;
            button.onclick = () => showSearchPopup(button);

            makeDraggable(button);
            
            const roleSelect = document.createElement("select");
            roleSelect.className = "role-select";
            
            // Populate dropdown with roles
            const roles = positionRoles[player.label] || [];
            roles.forEach(role => {
                const option = document.createElement("option");
                option.value = role;
                option.textContent = role;
                if (role === player.role) {
                    option.selected = true;
                }
                roleSelect.appendChild(option);
            });
    
            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-btn";
            removeBtn.textContent = "X";
            removeBtn.onclick = function (e) {
                e.stopPropagation();
                clearPlayer(button);
            };
            
            playerContainer.appendChild(roleSelect);
            playerContainer.appendChild(button);
            playerContainer.appendChild(removeBtn);
            pitch.appendChild(playerContainer);
        });
      
        addRoleChangeListeners();
        
        updateTotalScore();
    }
    
    const saveTeamBtn = document.getElementById('saveTeamBtn');
    if (saveTeamBtn) {
        console.log("Save Team button found:", saveTeamBtn);
        saveTeamBtn.addEventListener('click', function(e) {
            console.log("Save Team button clicked");
            e.stopPropagation();
            saveCurrentTeam();
        });
    }
    
    const deleteTeamBtn = document.getElementById('deleteTeamBtn');
    if (deleteTeamBtn) {
        deleteTeamBtn.addEventListener('click', deleteTeam);
    }
    
    loadSavedTeams();

    const saveBtn = document.getElementById('saveTeamBtn');
    if (saveBtn) {
        console.log("Save button element:", saveBtn);
        console.log("Save button onclick attribute:", saveBtn.onclick);
        console.log("Save button parent:", saveBtn.parentNode);
    }
    const controlsDiv = document.querySelector('.controls');
    if (controlsDiv) {
        controlsDiv.addEventListener('click', function(e) {
            console.log("Click detected on controls container");
            console.log("Element clicked:", e.target);
            console.log("Element ID:", e.target.id);
        });
    }
    document.addEventListener('click', function(e) {
        if (e.target.id === 'saveTeamBtn' || e.target.closest('#saveTeamBtn')) {
            console.log("Document-level click detected on Save Team button");
        }
        if (e.target.id === 'openImportTeamBtn' || e.target.closest('#openImportTeamBtn')) {
            console.log("Document-level click detected on Import Team button");
        }
    });
});

let formations = {
    "4-4-2": [
        { label: "GK", top: "5%", left: "43.5%" }, 
        { label: "LB", top: "25%", left: "8.5%" },  
        { label: "CB", top: "22.5%", left: "30.5%" },
        { label: "CB", top: "22.5%", left: "56.5%" },
        { label: "RB", top: "25%", left: "78.5%" }, 
        { label: "LM", top: "50%", left: "8.5%" },  
        { label: "CM", top: "50%", left: "30.5%" },
        { label: "CM", top: "50%", left: "56.5%" },
        { label: "RM", top: "50%", left: "78.5%" },
        { label: "ST", top: "80%", left: "30.5%" }, 
        { label: "ST", top: "80%", left: "56.5%" }  
    ],
    "4-3-3": [
        { label: "GK", top: "5%", left: "43.5%" }, 
        { label: "LB", top: "25%", left: "8.5%" },  
        { label: "CB", top: "22.5%", left: "30.5%" },
        { label: "CB", top: "22.5%", left: "56.5%" },
        { label: "RB", top: "25%", left: "78.5%" },  
        { label: "CM", top: "50%", left: "18.5%" },  
        { label: "CM", top: "50%", left: "43.5%" },  
        { label: "CM", top: "50%", left: "68.5%" },  
        { label: "LW", top: "75%", left: "8.5%" },   
        { label: "ST", top: "80%", left: "43.5%" },  
        { label: "RW", top: "75%", left: "78.5%" }   
    ],
    "3-5-2": [
        { label: "GK", top: "5%", left: "43.5%" },  
        { label: "CB", top: "22.5%", left: "18.5%" },  
        { label: "CB", top: "22.5%", left: "43.5%" },  
        { label: "CB", top: "22.5%", left: "68.5%" },  
        { label: "LM", top: "55%", left: "8.5%" },   
        { label: "CDM", top: "40%", left: "30.5%" },  
        { label: "CDM", top: "40%", left: "56.5%" },  
        { label: "RM", top: "55%", left: "78.5%" },  
        { label: "CAM", top: "65%", left: "43.5%" },
        { label: "ST", top: "85%", left: "28.5%" },  
        { label: "ST", top: "85%", left: "58.5%" }   
    ],
    "5-3-2": [
        { label: "GK", top: "5%", left: "43.5%" },  
        { label: "LWB", top: "30%", left: "8.5%" },   
        { label: "CB", top: "25%", left: "25.5%" },  
        { label: "CB", top: "25%", left: "43.5%" },  
        { label: "CB", top: "25%", left: "61.5%" }, 
        { label: "RWB", top: "30%", left: "78.5%" },  
        { label: "CM", top: "50%", left: "18.5%" },  
        { label: "CM", top: "50%", left: "43.5%" }, 
        { label: "CM", top: "50%", left: "68.5%" },  
        { label: "ST", top: "80%", left: "28.5%" },  
        { label: "ST", top: "80%", left: "58.5%" }   
    ]
};

function updateTotalScore() {
    const playerButtons = document.querySelectorAll(".player-btn");
    let totalScore = 0;

    playerButtons.forEach((button) => {
        const scoreMatch = button.innerHTML.match(/Score: (\d+\.\d+)/);
        if (scoreMatch && scoreMatch[1]) {
            const score = parseFloat(scoreMatch[1]);
            if (!isNaN(score)) {
                totalScore += score;
            }
        }
    });

    const totalScoreElement = document.getElementById("totalScore");
    if (totalScoreElement) {
        totalScoreElement.textContent = totalScore.toFixed(2);
        console.log("Total score updated:", totalScore.toFixed(2)); // Debugging log
    }
}

function loadTeam(teamName) {
    if (!teamName) {
        return; 
    }
    
    fetch(`/get-team?name=${encodeURIComponent(teamName)}`)
        .then(response => response.json())
        .then(team => {
            if (team.error) {
                alert(team.error);
                return;
            }
        
            const formationSelect = document.getElementById('formation');
            formationSelect.value = team.formation_name;
            
            document.getElementById("formation").dispatchEvent(new Event('change'));
   
            setTimeout(() => {
                const playerContainers = document.querySelectorAll('.player-container');
             
                team.players.forEach((playerData, index) => {
                    if (index < playerContainers.length) {
                        const container = playerContainers[index];
                
                        container.style.top = playerData.top;
                        container.style.left = playerData.left;
                
                        const button = container.querySelector('.player-btn');
                        button.dataset.originalLabel = playerData.label;
                     
                        const roleSelect = container.querySelector('.role-select');
                        if (roleSelect) {
                            for (let i = 0; i < roleSelect.options.length; i++) {
                                if (roleSelect.options[i].value === playerData.role) {
                                    roleSelect.selectedIndex = i;
                                    break;
                                }
                            }
                        }
                  
                        if (playerData.playerInfo) {
                            button.innerHTML = `
                                <div style="font-size: 18px; font-weight: bold; color: #fff;">${playerData.playerInfo.name}</div>
                                <div style="font-size: 14px; color: #ddd;">Score: ${playerData.playerInfo.score.toFixed(2)}</div>
                                <div style="font-size: 14px; color: #ddd;">Rank: ${playerData.playerInfo.rank}</div>
                            `;
                        } else {
                            button.textContent = playerData.label;
                        }
                    }
                });

                updateTotalScore();
            }, 100); 
        })
        .catch(error => console.error("Error loading team:", error));
}


document.addEventListener("DOMContentLoaded", function () {
    fetchPositionRoles();
    fetch("/get-formations")
    .then(response => response.json())
    .then(data => {
        // Merge the fetched formations with the hardcoded ones
        data.forEach(formation => {
            formations[formation.name] = formation.players; 
        });

        console.log(formations);

        const formationSelect = document.getElementById('formation');
        const deleteButtonContainer = document.getElementById('delete-formation-container');

        data.forEach(formation => {
            const option = document.createElement('option');
            option.value = formation.name;
            option.textContent = formation.name;
            formationSelect.appendChild(option);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = `Delete ${formation.name}`;
            deleteButton.className = 'delete-formation-btn';
            deleteButton.onclick = () => deleteFormation(formation.name);

            deleteButtonContainer.appendChild(deleteButton);
        });
    })
    .catch(error => console.error("Error loading formations:", error));


    const pitchZones = [
        { label: "GK", top: [0, 10], left: [34, 66] },    // Goalkeeper 
    
        // Defensive Line
        { label: "LB", top: [11, 30], left: [0, 20] },    // Left Back
        { label: "CB", top: [11, 30], left: [20.1, 66] },   // Center Back
        { label: "RB", top: [11, 30], left: [67, 100] },  // Right Back
    
        // Midfield Line
        { label: "LM", top: [30.1, 65], left: [0, 20] },    // Left Midfielder
        { label: "CM", top: [40.1, 55], left: [20.1, 66] },   // Central Midfielder
        { label: "RM", top: [30.1, 65], left: [67, 100] },  // Right Midfielder
        { label: "CDM", top: [30.1, 40], left: [20.1, 66] },  // Defensive Midfielder 
        { label: "CAM", top: [55.1, 65], left: [20.1, 66] },  // Attacking Midfielder 
    
        // Attacking Line
        { label: "LW", top: [66, 100], left: [0, 20] },   // Left Wing
        { label: "ST", top: [66, 100], left: [20.1, 66] },  // Striker
        { label: "RW", top: [66, 100], left: [67, 100] }  // Right Wing
    ];

    let positionRoles = {};     

    // Fetch position roles from the server
    function fetchPositionRoles() {
        fetch('/get-position-roles')
            .then(response => response.json())
            .then(data => {
                positionRoles = data;
                console.log("Position roles loaded:", positionRoles);
                
                if (document.getElementById("formation")) {
                    updateFormation();
                }
            })
            .catch(error => {
                console.error("Error fetching position roles:", error);
                // Fallback to default roles if fetch fails
                positionRoles = {
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
                };
            });
    }

    const searchForm = document.getElementById("search-form");
    const playerNameInput = document.getElementById("player_name");
    const autocompleteDropdown = document.getElementById("autocomplete-dropdown");
    
    if (searchForm && playerNameInput && autocompleteDropdown) {
        // Function to fetch player names from the backend
        async function fetchPlayerNames(searchTerm) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/players?starts_with=${encodeURIComponent(searchTerm)}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                return data; 
            } catch (error) {
                console.error('Error fetching player names:', error);
                return [];
            }
        }
    
        // Function to display the autocomplete dropdown
        function showAutocompleteDropdown(names) {
            autocompleteDropdown.innerHTML = ''; 
            if (names.length > 0) {
                names.forEach(name => {
                    const div = document.createElement('div');
                    div.textContent = name;
                    div.addEventListener('click', () => {
                        playerNameInput.value = name;
                        autocompleteDropdown.innerHTML = ''; 
                    });
                    autocompleteDropdown.appendChild(div);
                });
                autocompleteDropdown.style.display = 'block';
            } else {
                autocompleteDropdown.style.display = 'none';
            }
        }
    
        // Event listener for input changes
        playerNameInput.addEventListener('input', async function () {
            const searchTerm = this.value.trim().toLowerCase();
            if (searchTerm.length > 0) {
                const playerNames = await fetchPlayerNames(searchTerm);
                showAutocompleteDropdown(playerNames);
            } else {
                autocompleteDropdown.style.display = 'none';
            }
        });
    
        // Event listener for form submission
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault(); 
            
            const playerName = playerNameInput.value.trim();
            if (playerName) {
                // Redirect to player.html with the player's name as a query parameter
                window.location.href = `playerPage?name=${encodeURIComponent(playerName)}`;
            }
        });
    
        // Hide dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!autocompleteDropdown.contains(e.target) && e.target !== playerNameInput) {
                autocompleteDropdown.style.display = 'none';
            }
        });
    }

    function updateFormation() {
        const pitch = document.getElementById("pitch");
        pitch.innerHTML = ""; 
    
        const selectedFormation = document.getElementById("formation").value;
  
        if (!formations[selectedFormation]) {
            console.error("Formation not found:", selectedFormation);
            return; 
        }
    
        formations[selectedFormation].forEach((player) => {
            // Create unique position ID
            const positionId = generatePositionId(player.label, player.top, player.left);
            
            const playerContainer = document.createElement("div");
            playerContainer.className = "player-container";
            playerContainer.style.position = "absolute";
            playerContainer.style.top = player.top;
            playerContainer.style.left = player.left;
    
            const button = document.createElement("button");
            button.className = "player-btn";
            button.textContent = player.label; 
            button.dataset.originalLabel = player.label; 
            button.dataset.positionId = positionId; 
            button.onclick = () => showSearchPopup(button);

            makeDraggable(button);
    
            const roleSelect = document.createElement("select");
            roleSelect.className = "role-select";
            roleSelect.dataset.positionId = positionId; 
    
            // Populate dropdown with roles 
            const roles = positionRoles[player.label] || [];
            roles.forEach(role => {
                const option = document.createElement("option");
                option.value = role;
                option.textContent = role;
                roleSelect.appendChild(option);
            });
    
            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-btn";
            removeBtn.textContent = "X";
            removeBtn.onclick = function (e) {
                e.stopPropagation(); 
                clearPlayer(button, positionId);
            };
    
            playerContainer.appendChild(roleSelect);
            playerContainer.appendChild(button);
            playerContainer.appendChild(removeBtn);
            pitch.appendChild(playerContainer);
       
            if (playerAssignments[positionId]) {
                const assignment = playerAssignments[positionId];
                
                // Update button with player info
                button.innerHTML = `
                    <div style="font-size: 18px; font-weight: bold; color: #fff;">${assignment.name}</div>
                    <div style="font-size: 14px; color: #ddd;">Score: ${assignment.score.toFixed(2)}</div>
                    <div style="font-size: 14px; color: #ddd;">Rank: ${assignment.rank}</div>
                `;

                for (let i = 0; i < roleSelect.options.length; i++) {
                    if (roleSelect.options[i].value === assignment.role) {
                        roleSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        });

        addRoleChangeListeners();
        
        updateTotalScore();
    }

    function deleteFormation(formationName) {
        if (!confirm(`Are you sure you want to delete the formation "${formationName}"?`)) {
            return;
        }
        
        // Send a request to the backend to delete the formation
        fetch("/delete-formation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: formationName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Formation deleted successfully") {
                alert(`${formationName} has been deleted successfully.`);

                delete formations[formationName];

                const formationSelect = document.getElementById('formation');
                for (let i = 0; i < formationSelect.options.length; i++) {
                    if (formationSelect.options[i].value === formationName) {
                        formationSelect.remove(i);
                        break;
                    }
                }
        
                const deleteButtons = document.querySelectorAll('.delete-formation-btn');
                deleteButtons.forEach(button => {
                    if (button.textContent === `Delete ${formationName}`) {
                        button.remove();
                    }
                });
        
                if (formationSelect.value === formationName) {
                    formationSelect.value = "4-4-2";
                    updateFormation();
                }
            }
        })
        .catch(error => console.error("Error deleting formation:", error));
    }
    
    

    function updateButtonPosition(button) {
        const pitch = document.getElementById("pitch");
        const rect = pitch.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
    
        // Get button's position as a percentage of the pitch
        const topPercent = ((buttonRect.top - rect.top) / rect.height) * 100;
        const leftPercent = ((buttonRect.left - rect.left) / rect.width) * 100;
    
        // Find the appropriate zone
        const newLabel = getZoneLabel(topPercent, leftPercent);
    
        // Check if we need to update player data due to position change
        const oldPositionId = button.dataset.positionId;
        const playerData = playerAssignments[oldPositionId];
        
        // Update button label and role select
        button.textContent = newLabel;
        button.dataset.originalLabel = newLabel;
        
        // Create new position ID
        const newPositionId = generatePositionId(newLabel, `${topPercent}%`, `${leftPercent}%`);
        button.dataset.positionId = newPositionId;
    
        // Update the corresponding role select dropdown
        const playerContainer = button.parentElement;
        const roleSelect = playerContainer.querySelector(".role-select");
        roleSelect.dataset.positionId = newPositionId;

        const previouslySelectedRole = roleSelect.value;

        updateRoleSelect(roleSelect, newLabel);

        if (button.innerHTML.includes('Score:')) {
            if (playerData) {
                let roleStillAvailable = false;
                for (let i = 0; i < roleSelect.options.length; i++) {
                    if (roleSelect.options[i].value === playerData.role) {
                        roleSelect.selectedIndex = i;
                        roleStillAvailable = true;
                        break;
                    }
                }

                if (!roleStillAvailable && roleSelect.options.length > 0) {
                    const newRole = roleSelect.options[0].value;
                    const playerNameMatch = button.innerHTML.match(/<div[^>]*>(.*?)<\/div>/);
                    if (playerNameMatch && playerNameMatch[1]) {
                        const playerName = playerNameMatch[1];
                        updatePlayerScoreForNewRole(button, playerName, newRole);
                    }
                }
            }
        }
    }
    
    // Identify the zone based on button position
    function getZoneLabel(top, left) {
        for (const zone of pitchZones) {
            const withinTop = top >= zone.top[0] && top <= zone.top[1];
            const withinLeft = left >= zone.left[0] && left <= zone.left[1];
            if (withinTop && withinLeft) {
                return zone.label;
            }
        }
        return "Unknown"; 
    }
    
    // Update the role select options dynamically
    function updateRoleSelect(selectElement, newLabel) {
        selectElement.innerHTML = "";
    
        const validRoles = positionRoles[newLabel] || [];
  
        validRoles.forEach((role) => {
            const option = document.createElement("option");
            option.value = role;
            option.textContent = role;
            selectElement.appendChild(option);
        });

        if (validRoles.length > 0) {
            selectElement.value = validRoles[0];
        }
    }

    function makeDraggable(button) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
    
        button.addEventListener("mousedown", (e) => {
            isDragging = true;
    
            const pitch = document.getElementById("pitch");
            const pitchRect = pitch.getBoundingClientRect();

            const playerContainer = button.parentElement;
            const containerRect = playerContainer.getBoundingClientRect();
    
            offsetX = e.clientX - containerRect.left;
            offsetY = e.clientY - containerRect.top;
    
            button.style.cursor = "grabbing";
    
            e.preventDefault(); 
        });
    
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
    
            const pitch = document.getElementById("pitch");
            const pitchRect = pitch.getBoundingClientRect();
  
            const playerContainer = button.parentElement;
    
            let newLeft = e.clientX - pitchRect.left - offsetX;
            let newTop = e.clientY - pitchRect.top - offsetY;
    
            newLeft = Math.max(0, Math.min(newLeft, pitch.clientWidth - playerContainer.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, pitch.clientHeight - playerContainer.offsetHeight));
 
            playerContainer.style.left = `${newLeft}px`;
            playerContainer.style.top = `${newTop}px`;
        });
    
        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
   
                const oldPositionId = button.dataset.positionId;
      
                updateButtonPosition(button);
      
                const newPositionId = button.dataset.positionId;
           
                if (oldPositionId !== newPositionId && playerAssignments[oldPositionId]) {
                    playerAssignments[newPositionId] = playerAssignments[oldPositionId];
                    delete playerAssignments[oldPositionId];
                }
                
                button.style.zIndex = 1; 
            }
        });
    } 
    
    function clearPlayer(button, positionId) {
        button.innerHTML = button.dataset.originalLabel; 
        button.style.display = "flex";
        button.style.flexDirection = "column";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";
        button.style.textAlign = "center";
        button.style.lineHeight = "1.4";
        button.style.backgroundColor = "#4b0082"; 
        button.style.color = "#fff"; 

        if (positionId && playerAssignments[positionId]) {
            delete playerAssignments[positionId];
        }

        updateTotalScore();
    }

    function generatePositionId(label, top, left) {
        return `${label}_${top}_${left}`;
    }

    function showSearchPopup(button) {

        const existingPopup = document.getElementById("searchPopup");
        if (existingPopup) {
            existingPopup.remove();
        }
        
        const buttonRect = button.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        
        const roleSelect = button.parentElement.querySelector(".role-select");
        const selectedRole = roleSelect.value;
       
        const positionId = button.dataset.positionId;
        
        const popup = document.createElement("div");
        popup.id = "searchPopup";
        popup.style.position = "absolute";
        popup.style.top = `${buttonRect.top + scrollTop}px`;
        popup.style.left = `${buttonRect.left + scrollLeft}px`;
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.background = "#4b0082";
        popup.style.padding = "20px";
        popup.style.border = "2px solid #fff";
        popup.style.borderRadius = "15px";
        popup.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.3)";
        popup.style.display = "flex";
        popup.style.flexDirection = "column";
        popup.style.gap = "10px";
        popup.style.zIndex = "1000";

        // Create input field
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Enter player name";
        input.id = "playerInput";
        input.style.padding = "10px";
        input.style.border = "1px solid #ccc";
        input.style.borderRadius = "5px";
        input.style.fontSize = "14px";
        input.style.outline = "none";

        // Display the currently selected role
        const roleInfo = document.createElement("div");
        roleInfo.textContent = `Selected Role: ${selectedRole}`;
        roleInfo.style.color = "#fff";
        roleInfo.style.fontWeight = "bold";
        roleInfo.style.marginBottom = "10px";

        // Create search button
        const searchButton = document.createElement("button");
        searchButton.textContent = "Search";
        searchButton.style.padding = "10px 20px";
        searchButton.style.background = "#6a0dad";
        searchButton.style.border = "none";
        searchButton.style.borderRadius = "10px";
        searchButton.style.color = "#fff";
        searchButton.style.fontSize = "14px";
        searchButton.style.fontWeight = "bold";
        searchButton.style.cursor = "pointer";
        searchButton.style.transition = "background-color 0.2s ease";
        searchButton.onclick = async function () {
            await searchPlayerWithRole(button, input.value, selectedRole, popup, positionId);
        };

        // Create close button
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.style.padding = "10px 20px";
        closeButton.style.background = "#ff4d4d";
        closeButton.style.border = "none";
        closeButton.style.borderRadius = "10px";
        closeButton.style.color = "#fff";
        closeButton.style.fontSize = "14px";
        closeButton.style.fontWeight = "bold";
        closeButton.style.cursor = "pointer";
        closeButton.style.transition = "background-color 0.2s ease";
        closeButton.onclick = function () {
            popup.remove();
        };

        // Append elements to popup
        popup.appendChild(roleInfo);
        popup.appendChild(input);
        popup.appendChild(searchButton);
        popup.appendChild(closeButton);

        document.body.appendChild(popup);
    }

    async function searchPlayerWithRole(button, playerName, selectedRole, popup, positionId) {
        if (!playerName || !selectedRole) {
            alert("Please enter a player name and select a role.");
            return;
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/player/${encodeURIComponent(playerName)}?role=${encodeURIComponent(selectedRole)}`);
            const data = await response.json();
    
            if (response.ok) {
                // Update the button with player information
                button.innerHTML = `
                    <div style="font-size: 18px; font-weight: bold; color: #fff;">${data.Player}</div>
                    <div style="font-size: 14px; color: #ddd;">Score: ${data.Score.toFixed(2)}</div>
                    <div style="font-size: 14px; color: #ddd;">Rank: ${data.Rank}</div>
                `;

                const roleSelect = button.parentElement.querySelector(".role-select");
  
                let optionFound = false;
                for (let i = 0; i < roleSelect.options.length; i++) {
                    if (roleSelect.options[i].value === selectedRole) {
                        roleSelect.selectedIndex = i;
                        optionFound = true;
                        break;
                    }
                }
    
                if (!optionFound) {
                    console.warn(`Role ${selectedRole} not found in dropdown options`);
                }
      
                playerAssignments[positionId] = {
                    name: data.Player,
                    role: selectedRole,
                    score: data.Score,
                    rank: data.Rank
                };
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert("Failed to connect to the server.");
            console.error("Fetch error:", error);
        }

        popup.remove();
  
        updateTotalScore();
    }


    function addRoleChangeListeners() {
        document.querySelectorAll('.role-select').forEach(roleSelect => {
            const newRoleSelect = roleSelect.cloneNode(true);
            roleSelect.parentNode.replaceChild(newRoleSelect, roleSelect);

            newRoleSelect.addEventListener('change', function() {
                const button = this.parentElement.querySelector('.player-btn');
                const positionId = this.dataset.positionId;
        
                if (button.innerHTML.includes('Score:')) {
                    const playerNameMatch = button.innerHTML.match(/<div[^>]*>(.*?)<\/div>/);
                    if (playerNameMatch && playerNameMatch[1]) {
                        const playerName = playerNameMatch[1];
                        const newRole = this.value;
     
                        updatePlayerScoreForNewRole(button, playerName, newRole, positionId);
                    }
                }
            });
        });
    }

    async function updatePlayerScoreForNewRole(button, playerName, newRole, positionId) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/player_score?player_name=${encodeURIComponent(playerName)}&role=${encodeURIComponent(newRole)}`);
            const data = await response.json();
    
            if (response.ok) {
                // Update the button with the new score and rank
                button.innerHTML = `
                    <div style="font-size: 18px; font-weight: bold; color: #fff;">${data.Player}</div>
                    <div style="font-size: 14px; color: #ddd;">Score: ${data.Score.toFixed(2)}</div>
                    <div style="font-size: 14px; color: #ddd;">Rank: ${data.Rank}</div>
                `;
    
                if (positionId && playerAssignments[positionId]) {
                    playerAssignments[positionId] = {
                        name: data.Player,
                        role: newRole,
                        score: data.Score,
                        rank: data.Rank
                    };
                } else if (positionId) {
                    playerAssignments[positionId] = {
                        name: data.Player,
                        role: newRole,
                        score: data.Score,
                        rank: data.Rank
                    };
                }
                
                updateTotalScore();
            } else {
                console.error(`Error updating player score: ${data.error}`);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    }
    

    async function searchPlayer(button, playerName, selectedRole, popup) {
        if (!playerName || !selectedRole) {
            alert("Please enter a player name and select a role.");
            return;
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/player/${encodeURIComponent(playerName)}?role=${encodeURIComponent(selectedRole)}`);
            const data = await response.json();
    
            if (response.ok) {
                button.innerHTML = `
                    <div style="font-size: 18px; font-weight: bold; color: #fff;">${data.Player}</div>
                    <div style="font-size: 14px; color: #ddd;">Score: ${data.Score.toFixed(2)}</div>
                    <div style="font-size: 14px; color: #ddd;">Rank: ${data.Rank}</div>
                `;
    
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert("Failed to connect to the server.");
            console.error("Fetch error:", error);
        }
 
        popup.remove();
        updateTotalScore();
    }

    function openImportPopup() {
        console.log("openImportPopup function called");
        console.log("Called from:", new Error().stack);
        const importPopup = document.getElementById("importPopup");
        if (importPopup) {
            importPopup.style.display = "block";
            fetchTeams();
        }
    }

    window.intentionallyOpeningImportPopup = true;
 
    function closeImportPopup() {
        const importPopup = document.getElementById("importPopup");
        if (importPopup) {
            importPopup.style.display = "none";
        }
    }

    const importTeamBtn = document.getElementById('openImportTeamBtn');
    if (importTeamBtn) {
        importTeamBtn.addEventListener('click', function(e) {
            e.stopPropagation(); 
            openImportPopup();
        });
    }

    async function fetchTeams() {
    try {
        const response = await fetch("http://127.0.0.1:5000/teams");
        const teams = await response.json();

        if (response.ok) {
            const teamSelect = document.getElementById("teamSelect");
            teamSelect.innerHTML = ""; 

            teams.forEach(team => {
                const option = document.createElement("option");
                option.value = team;
                option.textContent = team;
                teamSelect.appendChild(option);
            });
        } else {
            alert("Failed to fetch teams.");
        }
    } catch (error) {
        alert("Failed to connect to the server.");
        console.error("Fetch error:", error);
    }
    }

    async function importTeam() {
        const teamSelect = document.getElementById("teamSelect");
        const selectedTeam = teamSelect.value;

        if (!selectedTeam) {
            alert("Please select a team.");
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/players_by_team?team=${encodeURIComponent(selectedTeam)}`);
            const players = await response.json();

            if (response.ok) {
                console.log("Players fetched:", players);
                populateButtonsWithBestPlayers(players);
                closeImportPopup(); 
            } else {
                alert("Failed to fetch players.");
            }
        } catch (error) {
            alert("Failed to connect to the server.");
            console.error("Fetch error:", error);
        }
    }

    function populateButtonsWithBestPlayers(players) {
        const playerButtons = document.querySelectorAll(".player-btn");
        const usedPlayers = new Set(); 

        const positionMap = Array.from(playerButtons).map(button => {
            const roleSelect = button.parentElement.querySelector(".role-select");
            const selectedRole = roleSelect.value;
            const positionId = button.dataset.positionId;
            
            return {
                button,
                roleSelect,
                selectedRole,
                positionId,
                assigned: false
            };
        });

        positionMap.forEach(position => {
            const suitablePlayers = findSuitablePlayersForRole(players, position.selectedRole);
   
            for (const player of suitablePlayers) {
                if (!usedPlayers.has(player.Player)) {
                    position.button.innerHTML = `
                        <div style="font-size: 18px; font-weight: bold; color: #fff;">${player.Player}</div>
                        <div style="font-size: 14px; color: #ddd;">Score: ${player.Score.toFixed(2)}</div>
                        <div style="font-size: 14px; color: #ddd;">Rank: ${player.Rank}</div>
                    `;
                    position.button.dataset.score = player.Score;
                    position.assigned = true;
 
                    const positionId = position.button.dataset.positionId;
                    playerAssignments[positionId] = {
                        name: player.Player,
                        score: player.Score,
                        rank: player.Rank,
                        role: position.selectedRole
                    };
       
                    usedPlayers.add(player.Player);
                    break;
                }
            }
       
            if (!position.assigned) {
                position.button.innerHTML = position.button.dataset.originalLabel;
                position.button.dataset.score = 0;
             
                const positionId = position.button.dataset.positionId;
                if (playerAssignments[positionId]) {
                    delete playerAssignments[positionId];
                }
            }
        });
        
        addRoleChangeListeners();
      
        updateTotalScore();
    }

    function findBestPlayerForRole(players, role) {
        const bestPlayer = players.reduce((best, player) => {
            const playerScore = player.Scores[role] || 0;
            const bestScore = best ? (best.Scores[role] || 0) : 0;
            return playerScore > bestScore ? player : best;
        }, null);
    
        console.log("Best player for role:", role, bestPlayer); 
    
        if (!bestPlayer) return null;
    
        return {
            Player: bestPlayer.Player,
            Score: bestPlayer.Scores[role],
            Role: role,
            Rank: 1  
        };
    }

    // Function to find the best player for a specific role
    function findSuitablePlayersForRole(players, role) {
        return players
            .filter(player => player.Scores && player.Scores[role] !== undefined)
            .map(player => ({
                Player: player.Player,
                Score: player.Scores[role] || 0,
                Role: role,
                Rank: 1  
            }))
            .sort((a, b) => b.Score - a.Score); 
    }
    
    const teamSelect = document.getElementById('team-select');
    if (teamSelect) {
        teamSelect.addEventListener('change', function() {
            const selectedTeam = this.value;
            if (selectedTeam) {
                loadTeam(selectedTeam);
            }
        });
    }

    // Event listeners for the import popup
    document.getElementById("importTeamButton").addEventListener("click", importTeam);
    document.getElementById("closeImportPopup").addEventListener("click", closeImportPopup);


    const importButton = document.querySelector("importTeamBtn");
    if (importButton) {
        const newImportButton = importButton.cloneNode(true);
        importButton.parentNode.replaceChild(newImportButton, importButton);

        newImportButton.addEventListener("click", openImportPopup);
    }

    updateFormation();

    document.getElementById("formation").addEventListener("change", updateFormation);
});

