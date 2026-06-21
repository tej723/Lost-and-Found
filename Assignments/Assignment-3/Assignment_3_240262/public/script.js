// ─── State ────────────────────────────────────────────────────────────────────
let allItems = [];          // full list fetched from the API
let activeFilter = 'all';   // current status filter
let currentItemId = null;   // id of the item shown in the detail modal

// ─── Bootstrap modal instances (created lazily after DOM ready) ───────────────
let itemModalInstance = null;
let addItemModalInstance = null;

// ─── DOMContentLoaded ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  itemModalInstance  = new bootstrap.Modal(document.getElementById('itemModal'));
  addItemModalInstance = new bootstrap.Modal(document.getElementById('addItemModal'));

  // Auth state
  const token = localStorage.getItem('authToken');
  const loginLogoutLink = document.getElementById('loginLogoutLink');
  const addItemBtn = document.getElementById('addItemBtn');

  if (token) {
    loginLogoutLink.textContent = 'Logout';
    loginLogoutLink.href = '#';
    loginLogoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('authToken');
      window.location.reload();
    });
    if (addItemBtn) addItemBtn.classList.remove('d-none');
  } else {
    loginLogoutLink.textContent = 'Login';
    loginLogoutLink.href = 'login.html';
    if (addItemBtn) addItemBtn.classList.add('d-none');
  }

  // Dark mode toggle
  document.getElementById('toggleDarkMode').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    this.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
  });

  // Search bar
  document.getElementById('searchBar').addEventListener('input', function () {
    renderCards(allItems);
  });

  // Status filter buttons
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      renderCards(allItems);
    });
  });

  // Add-item form submit
  document.getElementById('addItemForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in to report items.');
      return;
    }

    const form = e.target;
    const newItem = {
      name:         form.name.value.trim(),
      location:     form.location.value.trim(),
      description:  form.description.value.trim() || ('Found at ' + form.location.value.trim()),
      status:       form.status.value,
      contact_name: form.contact_name.value.trim(),
      phone:        form.phone.value.trim(),
      image:        form.image.value.trim() || ''
    };

    fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(newItem)
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to add item. Are you still logged in?');
      return res.json();
    })
    .then(function () {
      addItemModalInstance.hide();
      form.reset();
      loadItems();
    })
    .catch(function (err) {
      console.error('Failed to add item:', err);
      alert(err.message);
    });
  });

  // Initial data load
  loadItems();
});

// ─── Load items from API ───────────────────────────────────────────────────────
function loadItems() {
  fetch('/api/items')
    .then(function (res) {
      if (!res.ok) throw new Error('Server returned ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) {
        console.error('Unexpected response from /api/items:', data);
        showError('Could not load items from the server.');
        return;
      }
      allItems = data;
      renderCards(allItems);
    })
    .catch(function (err) {
      console.error('Error fetching items:', err);
      showError('A network error occurred. Could not load items.');
    });
}

// ─── Render cards (applies search + filter) ───────────────────────────────────
function renderCards(items) {
  const query      = (document.getElementById('searchBar').value || '').toLowerCase();
  const container  = document.getElementById('cards');
  const emptyState = document.getElementById('emptyState');
  const countEl    = document.getElementById('itemCount');

  // Apply filter
  let filtered = items.filter(function (item) {
    if (activeFilter !== 'all' && (item.status || '').toLowerCase() !== activeFilter) return false;
    if (query) {
      const haystack = ((item.name || '') + ' ' + (item.location || '') + ' ' + (item.description || '')).toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  // Update count
  countEl.textContent = filtered.length + ' item' + (filtered.length !== 1 ? 's' : '') + ' found';

  // Empty state
  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('d-none');
    return;
  }
  emptyState.classList.add('d-none');

  container.innerHTML = '';
  filtered.forEach(function (item) {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-lg-4';

    const statusClass = (item.status || 'found').toLowerCase() === 'lost' ? 'badge-lost' : 'badge-found';
    const statusLabel = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Found';
    const imgSrc      = item.image || 'https://via.placeholder.com/300x200?text=No+Image';
    const contactName = item.contact_name || 'N/A';
    const phone       = item.phone || 'N/A';

    col.innerHTML =
      '<div class="item-card" onclick="openItemModal(' + item.id + ')">' +
        '<div class="item-card-img-wrap">' +
          '<img src="' + escHtml(imgSrc) + '" alt="' + escHtml(item.name) + '" class="item-card-img" onerror="this.src=\'https://via.placeholder.com/300x200?text=No+Image\'">' +
          '<span class="status-badge ' + statusClass + '">' + escHtml(statusLabel) + '</span>' +
        '</div>' +
        '<div class="item-card-body">' +
          '<h5 class="item-card-title">' + escHtml(item.name) + '</h5>' +
          '<p class="item-card-meta"><span class="meta-icon">📍</span>' + escHtml(item.location || 'Unknown') + '</p>' +
          '<p class="item-card-meta"><span class="meta-icon">👤</span>' + escHtml(contactName) + '</p>' +
          '<p class="item-card-hint">Click to view details</p>' +
        '</div>' +
      '</div>';

    container.appendChild(col);
  });
}

// ─── Open item detail modal ────────────────────────────────────────────────────
function openItemModal(id) {
  const item = allItems.find(function (i) { return i.id === id; });
  if (!item) return;

  currentItemId = id;

  const imgSrc = item.image || 'https://via.placeholder.com/300x200?text=No+Image';
  document.getElementById('modalImage').src = imgSrc;
  document.getElementById('modalImage').onerror = function () {
    this.src = 'https://via.placeholder.com/300x200?text=No+Image';
  };
  document.getElementById('modalItemName').textContent    = item.name || '—';
  document.getElementById('modalFoundLocation').textContent = item.location || '—';
  document.getElementById('modalStatus').textContent      = item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : '—';
  document.getElementById('modalDescription').textContent = item.description || '—';
  document.getElementById('modalContactName').textContent = item.contact_name || '—';
  document.getElementById('modalPhone').textContent       = item.phone || '—';

  // Show delete button only for authenticated users
  const deleteBtn = document.getElementById('modalDeleteBtn');
  if (localStorage.getItem('authToken')) {
    deleteBtn.classList.remove('d-none');
  } else {
    deleteBtn.classList.add('d-none');
  }

  itemModalInstance.show();
}

// ─── Delete item from modal ────────────────────────────────────────────────────
function deleteItemFromModal() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    alert('You must be logged in to delete items.');
    return;
  }
  if (!currentItemId) return;

  if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;

  fetch('/api/items/' + currentItemId, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(function (res) {
    if (!res.ok) throw new Error('Deletion failed. You may not be authorised.');
    return res.json();
  })
  .then(function () {
    itemModalInstance.hide();
    currentItemId = null;
    loadItems();
  })
  .catch(function (err) {
    console.error('Failed to delete:', err);
    alert(err.message);
  });
}

// ─── Open add-item modal ───────────────────────────────────────────────────────
function openAddItemDialog() {
  addItemModalInstance.show();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function showError(msg) {
  const container = document.getElementById('cards');
  container.innerHTML = '<p class="text-danger text-center w-100 py-4">' + msg + '</p>';
  document.getElementById('itemCount').textContent = '0 items found';
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
