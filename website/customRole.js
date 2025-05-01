const columnCategories = {
    'basic': ['Player', 'Pos', 'Squad', 'Comp', 'Nation', 'Age', 'Matches Played', 'Starts', 'Minutes', '90s Played'],
    'discipline': ['Yellow Cards', 'Second Yellow Card', 'Red Cards'],
    'shooting': ['Goals', 'Shots Total', 'Shots on Target', 'Shots on Target %', 'Goals/Shot', 'Goals/Shot on Target', 
                'Average Shot Distance', 'Shots from Free Kicks', 'npxG/Shot', 'Non-Penalty Goals - npxG', 
                'xG: Expected Goals', 'npxG: Non-Penalty xG', 'Non-Penalty Goals', 'Penalty Kicks Made', 
                'Penalty Kicks Attempted'],
    'passing': ['Assists', 'Goals + Assists', 'Non-Penalty Goals + Assists', 'xAG: Exp. Assisted Goals', 
               'xA: Expected Assists', 'Assists - xAG', 'npxG + xAG', 'Key Passes', 'Passes into Final Third',
               'Passes into Penalty Area', 'Crosses into Penalty Area', 'Progressive Passes', 'Passes Completed',
               'Pass Completion %', 'Pass Attempted', 'Progressive Passing Distance', 'Pass Completion % (Short)',
               'Pass Completion % (Medium)', 'Pass Completion % (Long)', 'Through Balls', 'Crosses', 'Corner Kicks',
               'Inswinging Corner Kicks', 'Outswinging Corner Kicks', 'Straight Corner Kicks'],
    'defensive': ['Tackles', 'Tackles Won', 'Tackles (Def 3rd)', 'Tackles (Mid 3rd)', 'Tackles (Att 3rd)',
                 'Dribblers Tackled', '% of Dribblers Tackled', 'Blocks', 'Shots Blocked', 'Passes Blocked',
                 'Interceptions', 'Clearences', 'Errors', 'Aerials Won', 'Aerials Lost', '% of Aerials Won',
                 'Ball Recoveries'],
    'dribbling': ['Touches', 'Touches (Def 3rd)', 'Touches (Mid 3rd)', 'Touches (Att 3rd)', 'Touches (Att Pen)',
                 'Take-Ons Attempted', 'Successful Take-On %', 'Tackled During Take-On Percentage', 'Carries',
                 'Total Carrying Distance', 'Progressive Carries', 'Progressive Carrying Distance',
                 'Carries into Final Third', 'Carries into Penalty Area', 'Miscontrols', 'Dispossessed',
                 'Passes Received', 'Progressive Passes Rec']
};

// Position to role group mapping
const positionToGroup = {
    'GK': 'Goalkeeper',
    'CB': 'Defenders',
    'LB': 'Defenders',
    'RB': 'Defenders',
    'LWB': 'Defenders',
    'RWB': 'Defenders',
    'CM': 'Midfielders',
    'CDM': 'Midfielders',
    'CAM': 'Midfielders',
    'LM': 'Midfielders',
    'RM': 'Midfielders',
    'ST': 'Attackers',
    'LW': 'Attackers',
    'RW': 'Attackers'
};
let allColumns = [];
let selectedColumns = {};

// Initialize the custom role creator
function initializeRoleCreator() {
    const createRoleBtn = document.getElementById('create-role-btn');
    const roleCreatorModal = document.getElementById('roleCreatorModal');
    const closeRoleModal = document.getElementById('closeRoleModal');
    const saveRoleBtn = document.getElementById('save-role-btn');
    const cancelRoleBtn = document.getElementById('cancel-role-btn');
    const rolePositionSelect = document.getElementById('role-position');
    const roleGroupSelect = document.getElementById('role-group');
    
    rolePositionSelect.addEventListener('change', function() {
        const position = this.value;
        if (position && positionToGroup[position]) {
            roleGroupSelect.value = positionToGroup[position];
        }
    });
    
    // Show modal when create button is clicked
    createRoleBtn.addEventListener('click', function() {
        resetRoleForm();
        fetchAllColumns();
        roleCreatorModal.style.display = 'block';
    });
    
    closeRoleModal.addEventListener('click', function() {
        roleCreatorModal.style.display = 'none';
    });
    
    cancelRoleBtn.addEventListener('click', function() {
        roleCreatorModal.style.display = 'none';
    });
    
    // Close when clicking outside the modal
    window.addEventListener('click', function(event) {
        if (event.target === roleCreatorModal) {
            roleCreatorModal.style.display = 'none';
        }
    });

    saveRoleBtn.addEventListener('click', saveCustomRole);
    
    // Setup column filtering
    const categoryFilter = document.getElementById('column-category-filter');
    const columnSearch = document.getElementById('column-search');
    
    categoryFilter.addEventListener('change', filterColumns);
    columnSearch.addEventListener('input', filterColumns);

    loadCustomRoles();
}

// Reset the role creation form
function resetRoleForm() {
    document.getElementById('role-name').value = '';
    document.getElementById('role-position').value = '';
    document.getElementById('role-group').value = '';
    document.getElementById('column-category-filter').value = 'all';
    document.getElementById('column-search').value = '';
 
    selectedColumns = {};
    updateSelectedColumnsList();
}

// Fetch all available columns from the server
function fetchAllColumns() {
    fetch("http://127.0.0.1:5000/all_columns")
        .then(response => response.json())
        .then(columns => {
            allColumns = columns;
            populateColumnsList(columns);
        })
        .catch(error => {
            console.error("Error fetching columns:", error);
            alert("Failed to load available statistics. Please try again.");
        });
}

// Populate the columns list
function populateColumnsList(columns) {
    const columnsList = document.querySelector('.columns-list');
    columnsList.innerHTML = '';
    
    columns.forEach(column => {
        if (selectedColumns[column]) return;
        
        const columnItem = document.createElement('div');
        columnItem.className = 'column-item';
        
        columnItem.innerHTML = `
            <span class="column-name">${column}</span>
            <select class="weight-select">
                <option value="high">High</option>
                <option value="medium" selected>Medium</option>
                <option value="low">Low</option>
            </select>
            <button class="add-column-btn">Add</button>
        `;

        const addBtn = columnItem.querySelector('.add-column-btn');
        addBtn.addEventListener('click', function() {
            const weightSelect = columnItem.querySelector('.weight-select');
            addColumnToSelection(column, weightSelect.value);
        });
        
        columnsList.appendChild(columnItem);
    });
}

// Filter columns based on category and search
function filterColumns() {
    const categoryFilter = document.getElementById('column-category-filter').value;
    const searchTerm = document.getElementById('column-search').value.toLowerCase();
    
    let filteredColumns;
    
    if (categoryFilter === 'all') {
        filteredColumns = allColumns;
    } else {
        filteredColumns = columnCategories[categoryFilter] || [];
    }

    if (searchTerm) {
        filteredColumns = filteredColumns.filter(column => 
            column.toLowerCase().includes(searchTerm)
        );
    }

    populateColumnsList(filteredColumns);
}

// Add a column to the selection
function addColumnToSelection(column, weight) {
    selectedColumns[column] = weight;

    updateSelectedColumnsList();
    
    filterColumns();
}

// Remove a column from the selection
function removeColumnFromSelection(column) {
    delete selectedColumns[column];
    
    updateSelectedColumnsList();

    filterColumns();
}

// Update the selected columns list in the UI
function updateSelectedColumnsList() {
    const selectedColumnsList = document.getElementById('selected-columns-list');
    
    if (Object.keys(selectedColumns).length === 0) {
        selectedColumnsList.innerHTML = '<div class="empty-selection">No statistics selected yet.</div>';
        return;
    }
    
    selectedColumnsList.innerHTML = '';
    
    // Sort columns by weight 
    const sortOrder = { 'high': 1, 'medium': 2, 'low': 3 };
    const sortedColumns = Object.entries(selectedColumns).sort((a, b) => {
        return sortOrder[a[1]] - sortOrder[b[1]];
    });
    
    sortedColumns.forEach(([column, weight]) => {
        const columnItem = document.createElement('div');
        columnItem.className = 'selected-column-item';
        
        columnItem.innerHTML = `
            <div class="selected-column-info">
                <span class="column-name">${column}</span>
                <span class="weight-badge weight-${weight}">${weight}</span>
            </div>
            <button class="remove-column-btn" data-column="${column}">Remove</button>
        `;

        const removeBtn = columnItem.querySelector('.remove-column-btn');
        removeBtn.addEventListener('click', function() {
            removeColumnFromSelection(column);
        });
        
        selectedColumnsList.appendChild(columnItem);
    });
}

// Save the custom role
function saveCustomRole() {
    const roleName = document.getElementById('role-name').value.trim();
    const rolePosition = document.getElementById('role-position').value;
    const roleGroup = document.getElementById('role-group').value;
    
    // Validate inputs
    if (!roleName) {
        alert('Please enter a name for your custom role.');
        return;
    }
    
    if (!rolePosition) {
        alert('Please select a position for your custom role.');
        return;
    }
    
    if (!roleGroup) {
        alert('Please select a group for your custom role.');
        return;
    }
    
    if (Object.keys(selectedColumns).length === 0) {
        alert('Please select at least one statistic for your custom role.');
        return;
    }
    
    // Prepare data for submission
    const roleData = {
        name: roleName,
        position: rolePosition,
        group: roleGroup,
        columns: selectedColumns
    };
    
    // Send data to server
    fetch('/save-custom-role', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Custom role saved successfully!');
            document.getElementById('roleCreatorModal').style.display = 'none';
            loadCustomRoles();
        } else {
            alert(data.error || 'Failed to save custom role. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error saving custom role:', error);
        alert('An error occurred while saving the custom role. Please try again.');
    });
}

// Load user's custom roles
function loadCustomRoles() {
    fetch('/get-custom-roles')
        .then(response => response.json())
        .then(roles => {
            displayCustomRoles(roles);
        })
        .catch(error => {
            console.error('Error loading custom roles:', error);
        });
}

// Display custom roles in the UI
function displayCustomRoles(roles) {
    const customRolesList = document.getElementById('custom-roles-list');
    
    if (!roles || roles.length === 0) {
        customRolesList.innerHTML = '<div class="empty-message">No custom roles created yet. Click "Create New Role" to get started.</div>';
        return;
    }
    
    customRolesList.innerHTML = '';
    
    roles.forEach(role => {
        const roleCard = document.createElement('div');
        roleCard.className = 'role-card';
        
        // Get the top 5 stats with highest weight
        const topStats = Object.entries(role.columns)
            .filter(([_, weight]) => weight === 'high')
            .slice(0, 5)
            .map(([column, _]) => column);

        if (topStats.length < 5) {
            const mediumStats = Object.entries(role.columns)
                .filter(([_, weight]) => weight === 'medium')
                .slice(0, 5 - topStats.length)
                .map(([column, _]) => column);
            
            topStats.push(...mediumStats);
        }
        
        // Create HTML for the top stats
        const statsHTML = topStats.length > 0 
            ? topStats.map(stat => `
                <div class="role-stat">
                    <span class="stat-name">${stat}</span>
                </div>
            `).join('')
            : '<div class="role-stat">No key statistics defined</div>';
        
        roleCard.innerHTML = `
            <div class="role-card-header">
                <h3 class="role-card-title">${role.name}</h3>
                <span class="role-position-badge">${role.position}</span>
            </div>
            <div class="role-stats">
                <h4>Key Statistics:</h4>
                ${statsHTML}
            </div>
            <div class="role-card-actions">
                <button class="edit-role-btn" data-id="${role.id}">Edit</button>
                <button class="delete-role-btn" data-id="${role.id}">Delete</button>
            </div>
        `;

        const editBtn = roleCard.querySelector('.edit-role-btn');
        const deleteBtn = roleCard.querySelector('.delete-role-btn');
        
        editBtn.addEventListener('click', function() {
            editCustomRole(role.id);
        });
        
        deleteBtn.addEventListener('click', function() {
            deleteCustomRole(role.id, role.name);
        });
        
        customRolesList.appendChild(roleCard);
    });
}

// Edit a custom role
function editCustomRole(roleId) {
    fetch(`/get-custom-role?id=${encodeURIComponent(roleId)}`)
        .then(response => response.json())
        .then(role => {
            if (role.error) {
                alert(role.error);
                return;
            }

            document.getElementById('role-name').value = role.name;
            document.getElementById('role-position').value = role.position;
            document.getElementById('role-group').value = role.group;
 
            selectedColumns = role.columns;
       
            updateSelectedColumnsList();
            fetchAllColumns(); 

            document.getElementById('roleCreatorModal').style.display = 'block';

            const saveBtn = document.getElementById('save-role-btn');
            saveBtn.textContent = 'Update Role';
            saveBtn.dataset.roleId = roleId;
            saveBtn.onclick = function() {
                updateCustomRole(roleId);
            };
        })
        .catch(error => {
            console.error('Error fetching role details:', error);
            alert('Failed to load role details. Please try again.');
        });
}

// Update a custom role
function updateCustomRole(roleId) {
    const roleName = document.getElementById('role-name').value.trim();
    const rolePosition = document.getElementById('role-position').value;
    const roleGroup = document.getElementById('role-group').value;

    if (!roleName || !rolePosition || !roleGroup || Object.keys(selectedColumns).length === 0) {
        alert('Please fill in all required fields and select at least one statistic.');
        return;
    }
   
    const roleData = {
        id: roleId,
        name: roleName,
        position: rolePosition,
        group: roleGroup,
        columns: selectedColumns
    };
    
    // Send data to server
    fetch('/update-custom-role', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Custom role updated successfully!');
            document.getElementById('roleCreatorModal').style.display = 'none';
            const saveBtn = document.getElementById('save-role-btn');
            saveBtn.textContent = 'Save Custom Role';
            saveBtn.onclick = saveCustomRole;
            delete saveBtn.dataset.roleId;
            loadCustomRoles();
        } else {
            alert(data.error || 'Failed to update custom role. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error updating custom role:', error);
        alert('An error occurred while updating the custom role. Please try again.');
    });
}

// Delete a custom role
function deleteCustomRole(roleId, roleName) {
    if (!confirm(`Are you sure you want to delete the custom role "${roleName}"?`)) {
        return;
    }
    
    fetch('/delete-custom-role', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: roleId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Custom role deleted successfully!');
            loadCustomRoles();
        } else {
            alert(data.error || 'Failed to delete custom role. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error deleting custom role:', error);
        alert('An error occurred while deleting the custom role. Please try again.');
    });
}

// Initialize the role creator when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('create-role-btn')) {
        initializeRoleCreator();
    }
});
