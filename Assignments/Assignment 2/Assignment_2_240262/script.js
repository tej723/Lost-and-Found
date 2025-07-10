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

document.getElementById('toggleDarkMode').addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
});

document.getElementById('searchBar').addEventListener('input', function(e) {
  const query = e.target.value.toLowerCase();
  const cards = document.querySelectorAll('#cards .card');
  cards.forEach(card => {
    const title = card.querySelector('.card-title').innerText.toLowerCase();
    const text = card.querySelector('.card-text').innerText.toLowerCase();
    card.parentElement.style.display = (title.includes(query) || text.includes(query)) ? '' : 'none';
  });
});


function loadItems() {
  fetch('http://localhost:3000/items')
    .then(response => response.json())
    .then(data => {
      console.log(data);
      const container = document.getElementById('cards');
      container.innerHTML = '';

      data.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.innerHTML = `
          <div class="card h-100">
            <img src="${item.image || 'default.jpg'}" class="card-img-top" alt="${item.name}">
            <div class="card-body">
              <h5 class="card-title">${item.name}</h5>
              <p class="card-text">${item.description}</p>
              <p class="card-text"><strong>Location:</strong> ${item.location}</p>
              <p class="card-text"><strong>Status:</strong> ${item.status}</p>
              <p class="card-text"><strong>Contact:</strong> ${item.contact_name || 'N/A'} - ${item.phone || 'N/A'}</p>
              <button class="btn btn-danger me-2" onclick="deleteItem(${item.id})">Delete</button>
              <button class="btn btn-secondary" onclick="openModal('${item.name}', '${item.location}', '${item.contact_name}', '${item.phone}')">View</button>
            </div>
          </div>
        `;
        container.appendChild(col);
      });
    })
    .catch(err => console.error('Error fetching items:', err));
}

loadItems();


function deleteItem(id) {
  if (confirm('Are you sure you want to delete this item?')) {
    fetch(`http://localhost:3000/items/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        loadItems(); 
      })
      .catch(err => console.error('Failed to delete:', err));
  }
}

document.getElementById('addItemForm').addEventListener('submit', function(e) {
  e.preventDefault(); 

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

  fetch('http://localhost:3000/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newItem)
  })
    .then(res => res.json())
    .then(() => {
      loadItems();
      bootstrap.Modal.getInstance(document.getElementById('addItemModal')).hide();
      this.reset();
    })
    .catch(err => console.error('Failed to add item:', err));
});  