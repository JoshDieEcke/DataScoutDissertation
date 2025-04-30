// Get the modal and buttons
const authModal = document.getElementById("authModal");
const loginButton = document.getElementById("loginButton");
const closeButton = document.querySelector(".close");

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
    } else {
        alert(data.error);
    }
});

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

// Run checkLoginState when the page loads
document.addEventListener("DOMContentLoaded", () => {
    checkLoginState();
});

let currentNote = "";

// Function to check if player is shortlisted
async function checkIfPlayerShortlisted(playerName) {
    try {
        const response = await fetch(`/check-shortlisted?player_name=${encodeURIComponent(playerName)}`);
        if (!response.ok) {
            console.error('Failed to check shortlist status');
            return false;
        }
        
        const data = await response.json();
        return data.is_shortlisted;
    } catch (error) {
        console.error('Error checking shortlist status:', error);
        return false;
    }
}

// Function to get player's note if they're shortlisted
async function getPlayerNote(playerName) {
    try {
        const response = await fetch(`/get-shortlist`);
        if (!response.ok) {
            return "";
        }
        
        const data = await response.json();
        const playerEntry = data.find(entry => entry.player_name === playerName);
        return playerEntry ? playerEntry.note : "";
    } catch (error) {
        console.error('Error fetching player note:', error);
        return "";
    }
}

// Toggle shortlist status and update UI
async function toggleShortlist(playerName) {
    const shortlistBtn = document.getElementById('shortlist-btn');
    const noteContainer = document.getElementById('shortlist-note-container');
    const isRemoving = shortlistBtn.classList.contains('active');
    
    try {
        if (isRemoving) {
            if (!confirm(`Remove ${playerName} from your shortlist?`)) {
                return;
            }
            
            const response = await fetch('/remove-from-shortlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ player_name: playerName })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update shortlist');
            }
            
            const data = await response.json();
            
            shortlistBtn.textContent = 'Add to Shortlist';
            shortlistBtn.classList.remove('active');
            noteContainer.style.display = 'none';
            
            alert(data.message);
        } else {
            noteContainer.style.display = 'block';
            document.getElementById('shortlist-note').value = currentNote;
            document.getElementById('shortlist-note').focus();
        }
    } catch (error) {
        console.error('Error updating shortlist:', error);
        alert('Error updating shortlist. Please try again.');
    }
}

// Save note and add to shortlist
async function saveNoteAndAddToShortlist(playerName) {
    const shortlistBtn = document.getElementById('shortlist-btn');
    const noteContainer = document.getElementById('shortlist-note-container');
    const note = document.getElementById('shortlist-note').value;
    
    try {
        const response = await fetch('/add-to-shortlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                player_name: playerName,
                note: note
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update shortlist');
        }
        
        const data = await response.json();
        
        shortlistBtn.textContent = 'Remove from Shortlist';
        shortlistBtn.classList.add('active');
        noteContainer.style.display = 'none';
        currentNote = note;
        
        alert(data.message);
    } catch (error) {
        console.error('Error updating shortlist:', error);
        alert('Error updating shortlist. Please try again.');
    }
}

// Update note for already shortlisted player
async function updatePlayerNote(playerName) {
    const note = document.getElementById('shortlist-note').value;
    const noteContainer = document.getElementById('shortlist-note-container');
    
    try {
        const response = await fetch('/update-shortlist-note', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                player_name: playerName,
                note: note
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update note');
        }
        
        const data = await response.json();
        
        noteContainer.style.display = 'none';
        currentNote = note;
        
        alert('Note updated successfully');
    } catch (error) {
        console.error('Error updating note:', error);
        alert('Error updating note. Please try again.');
    }
}

async function initShortlistUI(playerName) {
    const shortlistBtn = document.getElementById('shortlist-btn');
    const noteContainer = document.getElementById('shortlist-note-container');
    const saveNoteBtn = document.getElementById('save-note-btn');
    
    if (!shortlistBtn) return;

    const isShortlisted = await checkIfPlayerShortlisted(playerName);
    
    if (isShortlisted) {
        shortlistBtn.textContent = 'Remove from Shortlist';
        shortlistBtn.classList.add('active');
  
        currentNote = await getPlayerNote(playerName);
        document.getElementById('shortlist-note').value = currentNote;
    }
    
    shortlistBtn.addEventListener('click', function() {
        toggleShortlist(playerName);
    });
  
    shortlistBtn.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (shortlistBtn.classList.contains('active')) {
            noteContainer.style.display = 'block';
            document.getElementById('shortlist-note').value = currentNote;
            document.getElementById('shortlist-note').focus();
        }
    });
    
    saveNoteBtn.addEventListener('click', function() {
        if (shortlistBtn.classList.contains('active')) {
            updatePlayerNote(playerName);
        } else {
            saveNoteAndAddToShortlist(playerName);
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const playerName = getQueryParam("name");

    if (!playerName) {
        document.body.innerHTML = "<p>No player specified.</p>";
        return;
    }

    document.getElementById("player-name").textContent = playerName;

    const columns = ["Key Passes", "Pass Completion %", "xA: Expected Assists", "xAG: Exp. Assisted Goals", "SCA (Live-ball Pass)", "GCA (Live-ball Pass)", "Touches", "Progressive Passes"];

    const presets = {
        preset1: ["Key Passes", "Pass Completion %", "xA: Expected Assists", "xAG: Exp. Assisted Goals", "SCA (Live-ball Pass)", "GCA (Live-ball Pass)", "Touches", "Progressive Passes"],
        preset2: ["Shots", "Shots on Target", "Goals", "Assists", "xG: Expected Goals", "xAG: Exp. Assisted Goals", "Dribbles", "Touches"],
        preset3: ["Tackles", "Interceptions", "Clearances", "Blocks", "Aerials Won", "Passes", "Pass Completion %", "Progressive Passes"],
    };
    
    let currentColumns = [...columns]; 
    let selectedSegmentIndex = null; 

    fetchPlayerPercentiles(playerName, columns);

    document.getElementById("edit-button").addEventListener("click", () => {
        alert("Click on any segment to edit its column.");
    });

    document.getElementById("preset-select").addEventListener("change", (event) => {
        const selectedPreset = event.target.value;
        currentColumns = [...presets[selectedPreset]]; 
        fetchPlayerPercentiles(playerName, currentColumns);
    });

    function fetchPlayerPercentiles(name, columns) {
        Promise.all(columns.map(column =>
            fetch(`http://127.0.0.1:5000/player_percentile?player_name=${encodeURIComponent(name)}&column=${encodeURIComponent(column)}`)
                .then(response => response.json())
        )).then(data => {
            const percentiles = data.map(d => d.Percentile);
            const labels = data.map(d => d.Column);

            // Create the radial bar chart
            createRadialBarChart(labels, percentiles);
        }).catch(error => console.error("Error fetching percentiles:", error));
    }

    function createRadialBarChart(labels, percentiles) {
        const chartData = [{
            type: "barpolar",
            r: percentiles,
            theta: labels,
            marker: {
                color: "rgba(0, 123, 255, 0.6)"
            }
        }];

        const layout = {
            polar: {
                radialaxis: {
                    visible: true,
                    range: [0, 100]
                }
            },
            showlegend: false
        };

        Plotly.newPlot("chart", chartData, layout).then(() => {
            const chart = document.getElementById("chart");
            chart.on("plotly_click", (data) => {
                const pointIndex = data.points[0].pointNumber;
                selectedSegmentIndex = pointIndex;
                showDropdown(data.event.clientX, data.event.clientY);
            });
        });
    }

    function fetchAllColumns() {
        return fetch("http://127.0.0.1:5000/all_columns")
            .then(response => response.json())
            .catch(error => {
                console.error("Error fetching all columns:", error);
                return [];
            });
    }
    
    // Function to show the dropdown and populate it with all columns
    function showDropdown(x, y) {
        const dropdown = document.getElementById("dropdown");
        dropdown.style.display = "block";
        dropdown.style.left = `${x}px`;
        dropdown.style.top = `${y}px`;
    
        // Fetch all columns from the backend and populate the dropdown
        fetchAllColumns().then(allColumns => {
            const columnSelect = document.getElementById("column-select");
            columnSelect.innerHTML = allColumns.map(column =>
                `<option value="${column}">${column}</option>`
            ).join("");

            document.getElementById("save-button").addEventListener("click", () => {
                const selectedColumn = columnSelect.value;
                if (selectedColumn) {
                    currentColumns[selectedSegmentIndex] = selectedColumn;
                    fetchPlayerPercentiles(playerName, currentColumns);
                    dropdown.style.display = "none";
                }
            });
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

    // Fetch available roles
    fetch("/get-all-roles")
        .then(response => response.json())
        .then(groupedRoles => {
            let allRoles = [];
            for (const group in groupedRoles) {
                groupedRoles[group].forEach(role => {
                    allRoles.push(role);
                });
            }

            const roleDropdown = document.createElement("select");
            roleDropdown.id = "role-select";
       
            const groups = ["Defenders", "Midfielders", "Attackers", "Goalkeeper"];
            groups.forEach(group => {
                if (groupedRoles[group] && groupedRoles[group].length > 0) {
                    const optgroup = document.createElement("optgroup");
                    optgroup.label = group;
                    
                    groupedRoles[group].forEach(role => {
                        const option = document.createElement("option");
                        option.value = role;
                        option.textContent = role;
                        optgroup.appendChild(option);
                    });
                    
                    roleDropdown.appendChild(optgroup);
                }
            });

            document.querySelector(".player-info").appendChild(roleDropdown);

            if (allRoles.length > 0) {
                fetchPlayerData(playerName, allRoles[0]);
                roleDropdown.value = allRoles[0];
            }

            roleDropdown.addEventListener("change", () => fetchPlayerData(playerName, roleDropdown.value));
        })
        .catch(error => {
            console.error("Error fetching roles:", error);
  
            fetch("http://127.0.0.1:5000/roles")
                .then(response => response.json())
                .then(roles => {
                    const roleDropdown = document.createElement("select");
                    roleDropdown.id = "role-select";
                    roles.forEach(role => {
                        const option = document.createElement("option");
                        option.value = role;
                        option.textContent = role;
                        roleDropdown.appendChild(option);
                    });

                    document.querySelector(".player-info").appendChild(roleDropdown);

                    if (roles.length > 0) {
                        fetchPlayerData(playerName, roles[0]);
                        roleDropdown.value = roles[0];
                    }

                    roleDropdown.addEventListener("change", () => fetchPlayerData(playerName, roleDropdown.value));
                })
                .catch(error => console.error("Error fetching roles:", error));
        });

        function fetchPlayerData(name, role) {
            document.getElementById("player-data").textContent = "Loading player data...";
        
            // Fetch current season data
            fetch(`http://127.0.0.1:5000/player/${encodeURIComponent(name)}?role=${encodeURIComponent(role)}`)
                .then(response => response.json())
                .then(player => {
                    if (player.error) {
                        document.getElementById("player-data").textContent = player.error;
                        return;
                    }
        
                    // Fetch comparison data between seasons
                    fetch(`http://127.0.0.1:5000/compare_seasons?player_name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}`)
                        .then(response => response.json())
                        .then(comparison => {
                            if (comparison.error) {
                                console.error("Error fetching comparison data:", comparison.error);
                                document.getElementById("player-data").innerHTML = `
                                    <p><strong>Best Role:</strong> ${player["Best Role"]}</p>
                                    <p><strong>Selected Role:</strong> ${role}</p>
                                    <p><strong>Score (2023-2024):</strong> ${player["Score"].toFixed(2)}</p>
                                    <p><strong>Rank (2023-2024):</strong> ${player["Rank"]}</p>
                                `;
                                return;
                            }
        
                            // Display both current season data and comparison
                            document.getElementById("player-data").innerHTML = `
                                <p><strong>Best Role:</strong> ${player["Best Role"]}</p>
                                <p><strong>Selected Role:</strong> ${role}</p>
                                <p><strong>Score (2023-2024):</strong> ${player["Score"].toFixed(2)}</p>
                                <p><strong>Rank (2023-2024):</strong> ${player["Rank"]}</p>
                                <p><strong>Score (2022-2023):</strong> ${comparison["Score 2022-2023"].toFixed(2)}</p>
                                <p><strong>Score Difference:</strong> ${comparison["Score Difference"].toFixed(2)}</p>
                                <p><strong>Performance Change:</strong> ${comparison["Performance Change"]}</p>
                            `;
                        })
                        .catch(error => {
                            console.error("Error fetching comparison data:", error);
                            // Display only current season data if comparison fails
                            document.getElementById("player-data").innerHTML = `
                                <p><strong>Best Role:</strong> ${player["Best Role"]}</p>
                                <p><strong>Selected Role:</strong> ${role}</p>
                                <p><strong>Score (2023-2024):</strong> ${player["Score"].toFixed(2)}</p>
                                <p><strong>Rank (2023-2024):</strong> ${player["Rank"]}</p>
                            `;
                        });
                })
                .catch(error => {
                    console.error("Error fetching player data:", error);
                    document.getElementById("player-data").textContent = "Error loading player data.";
                });
        }
    // Check if user is logged in
    fetch('/check-login')
    .then(response => response.json())
    .then(data => {
        if (data.logged_in) {
            const playerName = getQueryParam("name");
            if (playerName) {
                initShortlistUI(playerName);
            }
        } else {
            const shortlistBtn = document.getElementById('shortlist-btn');
            if (shortlistBtn) {
                shortlistBtn.style.display = 'none';
            }
        }
    })
    .catch(error => console.error('Error checking login status:', error));
});
