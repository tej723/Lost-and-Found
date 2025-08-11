document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    const loginLogoutLink = document.getElementById('loginLogoutLink');
    const addItemButton = document.querySelector('.add-item-btn');

    if (token) {
        loginLogoutLink.textContent = 'Logout';
        loginLogoutLink.href = '#';
        loginLogoutLink.onclick = function(e) {
            e.preventDefault();
            localStorage.removeItem('authToken');
            window.location.reload();
        };
        addItemButton.style.display = 'block'; 
    } else {
        loginLogoutLink.textContent = 'Login';
        loginLogoutLink.href = 'login.html';
        addItemButton.style.display = 'none'; 
    }

    loadItems();

    // Event listener for dark mode toggle
    document.getElementById('toggleDarkMode').addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
    });

    // Event listener for search bar
    document.getElementById('searchBar').addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('#cards .card');
        cards.forEach(card => {
            const title = card.querySelector('.card-title').innerText.toLowerCase();
            const text = card.querySelector('.card-text').innerText.toLowerCase();
            card.parentElement.style.display = (title.includes(query) || text.includes(query)) ? '' : 'none';
        });
    });

    // Event listener for the Add Item form submission
    document.getElementById('addItemForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('You must be logged in to add items.');
            return;
        }

        const inputs = this.querySelectorAll('input');
        const [name, location, contactName, phone, image] = Array.from(inputs).map(input => input.value);

        const newItem = {
            name,
            description: `Found at ${location}`,
            status: "found",
            location,
            image,
            contact_name: contactName,
            phone
        };

        fetch('/items', { // This URL was already correct
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newItem)
        })
        .then(res => {
            if (!res.ok) { throw new Error('Failed to add item. Check server logs.'); }
            return res.json();
        })
        .then(() => {
            loadItems();
            bootstrap.Modal.getInstance(document.getElementById('addItemModal')).hide();
            this.reset();
        })
        .catch(err => {
            console.error('Failed to add item:', err);
            alert(err.message);
        });
    });
});

function openModal(itemName, foundLocation, contactName, phone) {
    document.getElementById("modalItemName").innerText = itemName;
    document.getElementById("modalFoundLocation").innerText = foundLocation;
    document.getElementById("modalContactName").innerText = contactName;
    document.getElementById("modalPhone").innerText = phone;
    const modal = new bootstrap.Modal(document.getElementById('itemModal'));
    modal.show();
}

function openAddItemDialog() {
    const addModal = new bootstrap.Modal(document.getElementById('addItemModal'));
    addModal.show();
}

function loadItems() {
    fetch('/items')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('cards');
            container.innerHTML = ''; // Clear previous items

            // This 'if' statement is the new, important check
            if (!Array.isArray(data)) {
              console.error("Received an error or non-array data from server:", data);
              // Optionally, display an error message to the user on the page
              // container.innerHTML = '<p class="text-danger">Could not load items.</p>';
              return; // Stop the function
            }

            const token = localStorage.getItem('authToken');

            data.forEach(item => {
                const col = document.createElement('div');
                col.className = 'col-md-4 mb-4';
                const deleteButtonHtml = token ? `<button class="btn btn-danger me-2" onclick="deleteItem(${item.id})">Delete</button>` : '';

                col.innerHTML = `
                  <div class="card h-100">
                    <img src="${item.image || 'default.jpg'}" class="card-img-top" alt="${item.name}">
                    <div class="card-body">
                      <h5 class="card-title">${item.name}</h5>
                      <p class="card-text">${item.description}</p>
                      <p class="card-text"><strong>Location:</strong> ${item.location}</p>
                      <p class="card-text"><strong>Status:</strong> ${item.status}</p>
                      <p class="card-text"><strong>Contact:</strong> ${item.contact_name || 'N/A'} - ${item.phone || 'N/A'}</p>
                      ${deleteButtonHtml}
                      <button class="btn btn-secondary" onclick="openModal('${item.name}', '${item.location}', '${item.contact_name}', '${item.phone}')">View</button>
                    </div>
                  </div>
                `;
                container.appendChild(col);
            });
        })
        .catch(err => {
          console.error('Error fetching items:', err)
          const container = document.getElementById('cards');
          // Display a network error message to the user
          container.innerHTML = '<p class="text-danger">A network error occurred. Could not load items.</p>';
        });
}
function deleteItem(id) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('You must be logged in to delete items.');
        return;
    }

    if (confirm('Are you sure you want to delete this item?')) {
        // FIXED THE URL HERE
        fetch(`/items/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if (!res.ok) { throw new Error('Deletion failed. You may not be authorized.'); }
            return res.json();
        })
        .then(() => {
            loadItems();
        })
        .catch(err => {
            console.error('Failed to delete:', err);
            alert(err.message);
        });
    }
}

