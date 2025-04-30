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
        <span>${username}</span>
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

document.addEventListener("DOMContentLoaded", function () {
    const positionSelects = document.querySelectorAll(".dropdown select");
    const playerLists = document.querySelectorAll(".player-list");

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

    // Fetch the top 5 players for a given position/role
    function fetchTopPlayers(role, playerList) {
        fetch(`http://127.0.0.1:5000/calculate?role=${encodeURIComponent(role)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error("Error fetching data:", data.error);
                    return;
                }

                // Sort players by rank and select top 5
                const topPlayers = data.slice(0, 5);

                playerList.innerHTML = '';

                // Add each player to the list
                topPlayers.forEach(player => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('player-item');

                    const playerImage = document.createElement('img');
                    playerImage.src = "https://via.placeholder.com/50"; // Placeholder image
                    playerImage.alt = `Image of ${player.Player}`;

                    const playerNameSpan = document.createElement('span');
                    playerNameSpan.classList.add('player-name');
                    playerNameSpan.textContent = player.Player;

                    const playerScore = document.createElement('span');
                    playerScore.classList.add('player-score');
                    playerScore.textContent = player.score.toFixed(2);

                    // Append elements to the list item
                    listItem.appendChild(playerImage);
                    listItem.appendChild(playerNameSpan);
                    listItem.appendChild(playerScore);

                    // Append the list item to the player list
                    playerList.appendChild(listItem);
                });
            })
            .catch(error => console.error("Error fetching data:", error));
    }

    // Fetch players for the default roles on page load
    const defaultRoles = ["Ball Playing Defender", "Deep Lying Playmaker", "Winger"];
    playerLists.forEach((playerList, index) => {
        fetchTopPlayers(defaultRoles[index], playerList);
    });

    // Add event listeners for role change
    positionSelects.forEach((select, index) => {
        select.addEventListener("change", function () {
            const selectedRole = select.value;
            fetchTopPlayers(selectedRole, playerLists[index]);
        });
    });
});


