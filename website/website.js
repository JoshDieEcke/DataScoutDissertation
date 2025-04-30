// Toggle the visibility of the dropdown menu when search bar is clicked
function toggleDropdown() {
    const dropdown = document.getElementById("dropdown-menu");
    dropdown.style.display = dropdown.style.display === "none" ? "flex" : "none";
}

// Show player options when a player position on the pitch is clicked
function showPlayerOptions(position) {
    alert(`Show options for player position ${position}`);
}

// Close dropdown menu if clicked outside
document.addEventListener("click", (e) => {
    const search = document.getElementById("player-search");
    const dropdown = document.getElementById("dropdown-menu");

    if (e.target !== search && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
    }
});

