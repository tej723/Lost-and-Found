/**
 * app.js — Lost & Found Portal - IITK
 *
 * Responsibilities:
 *  - Fetch items from GET /api/items on page load
 *  - Render item cards dynamically in a responsive grid
 *  - Open a detail modal on card click (name, description, location, phone, image)
 *  - Show Delete button in modal only when authenticated (JWT in localStorage)
 *  - Handle DELETE /api/items/:id with Bearer token, then refresh the list
 *  - Handle POST /api/items (Add Item form) with Bearer token
 *  - Login / Logout button visibility based on authToken
 *  - Dark mode toggle
 *  - Live search filter
 */

/* ------------------------------------------------------------------ */
/*  Placeholder image used when an item has no image set               */
/* ------------------------------------------------------------------ */
const PLACEHOLDER_IMG = 'https://placehold.co/400x300/e9ecef/6c757d?text=No+Image';

/* ------------------------------------------------------------------ */
/*  Utility: get auth token from localStorage                          */
/* ------------------------------------------------------------------ */
function getToken() {
  return localStorage.getItem('authToken');
}

/* ------------------------------------------------------------------ */
/*  Auth UI — show/hide Login, Logout, Add-Item button                 */
/* ------------------------------------------------------------------ */
function updateAuthUI() {
  const token = getToken();
  const loginBtn   = document.getElementById('loginBtn');
  const logoutBtn  = document.getElementById('logoutBtn');
  const addItemBtn = document.getElementById('addItemBtn');

  if (token) {
    loginBtn.classList.add('d-none');
    logoutBtn.classList.remove('d-none');
    if (addItemBtn) addItemBtn.classList.remove('d-none');
  } else {
    loginBtn.classList.remove('d-none');
    logoutBtn.classList.add('d-none');
    if (addItemBtn) addItemBtn.classList.add('d-none');
  }
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                 */
/* ------------------------------------------------------------------ */
function statusBadgeClass(status) {
  if (!status) return 'status-other';
  const s = status.toLowerCase();
  if (s === 'lost')  return 'status-lost';
  if (s === 'found') return 'status-found';
  return 'status-other';
}

/* ------------------------------------------------------------------ */
/*  Render a single item card                                           */
/* ------------------------------------------------------------------ */
function createCard(item) {
  const col = document.createElement('div');
  col.className = 'col-sm-6 col-lg-4 col-xl-3';

  const imgSrc = item.image && item.image.trim() !== '' ? item.image : PLACEHOLDER_IMG;
  const badgeClass = statusBadgeClass(item.status);
  const statusLabel = item.status || 'unknown';
  const description = item.description || 'No description provided.';
  const location    = item.location    || 'Unknown location';
  const contact     = item.contact_name || 'N/A';
  const phone       = item.phone        || 'N/A';

  col.innerHTML = `
    <div class="item-card" tabindex="0" role="button"
         aria-label="View details for ${escapeHtml(item.name)}"
         data-id="${item.id}">
      <img src="${escapeHtml(imgSrc)}"
           alt="${escapeHtml(item.name)}"
           class="item-card-img"
           onerror="this.src='${PLACEHOLDER_IMG}'">
      <div class="item-card-body">
        <span class="status-badge ${badgeClass}">${escapeHtml(statusLabel)}</span>
        <h5 class="item-card-title">${escapeHtml(item.name)}</h5>
        <p class="item-card-desc">${escapeHtml(description)}</p>
        <p class="item-card-meta"><strong>Location:</strong> ${escapeHtml(location)}</p>
        <p class="item-card-meta"><strong>Contact:</strong> ${escapeHtml(contact)}</p>
      </div>
    </div>
  `;

  /* Click / keyboard handler to open detail modal */
  const card = col.querySelector('.item-card');
  const openDetail = () => openItemModal(item);
  card.addEventListener('click', openDetail);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetail();
    }
  });

  return col;
}

/* ------------------------------------------------------------------ */
/*  Escape HTML to prevent XSS when injecting user data                */
/* ------------------------------------------------------------------ */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ------------------------------------------------------------------ */
/*  Open the item detail modal                                          */
/* ------------------------------------------------------------------ */
let currentItemId = null; // track which item the modal is showing

function openItemModal(item) {
  currentItemId = item.id;

  const imgSrc = item.image && item.image.trim() !== '' ? item.image : PLACEHOLDER_IMG;

  /* Populate fields */
  document.getElementById('modalImage').src         = imgSrc;
  document.getElementById('modalImage').alt         = item.name || 'Item image';
  document.getElementById('modalItemName').textContent    = item.name        || '—';
  document.getElementById('modalDescription').textContent = item.description || 'No description provided.';
  document.getElementById('modalFoundLocation').textContent = item.location  || 'Unknown';
  document.getElementById('modalContactName').textContent  = item.contact_name || 'N/A';
  document.getElementById('modalPhone').textContent        = item.phone      || 'N/A';

  /* Status badge */
  const statusEl = document.getElementById('modalStatus');
  const s = (item.status || 'unknown').toLowerCase();
  statusEl.textContent = item.status || 'unknown';
  statusEl.className = 'badge'; // reset
  if (s === 'lost')  { statusEl.classList.add('bg-warning', 'text-dark'); }
  else if (s === 'found') { statusEl.classList.add('bg-success'); }
  else               { statusEl.classList.add('bg-secondary'); }

  /* Delete button — only visible when authenticated */
  const deleteBtn = document.getElementById('modalDeleteBtn');
  if (getToken()) {
    deleteBtn.classList.remove('d-none');
  } else {
    deleteBtn.classList.add('d-none');
  }

  /* Show modal */
  const modal = new bootstrap.Modal(document.getElementById('itemModal'));
  modal.show();
}

/* ------------------------------------------------------------------ */
/*  Open the Add Item modal                                             */
/* ------------------------------------------------------------------ */
function openAddItemDialog() {
  const token = getToken();
  if (!token) {
    alert('You must be logged in to add items.');
    window.location.href = 'login.html';
    return;
  }
  const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
  modal.show();
}

/* ------------------------------------------------------------------ */
/*  All items cache (used by filter + search)                           */
/* ------------------------------------------------------------------ */
let allItems = [];
let activeFilter = 'all';

/* ------------------------------------------------------------------ */
/*  Render items from cache applying current filter                     */
/* ------------------------------------------------------------------ */
function renderItems() {
  const container  = document.getElementById('cards');
  const emptyState = document.getElementById('emptyState');
  const itemCount  = document.getElementById('itemCount');

  const filtered = activeFilter === 'all'
    ? allItems
    : allItems.filter((i) => (i.status || '').toLowerCase() === activeFilter);

  container.innerHTML = '';

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('d-none');
    if (itemCount)  itemCount.textContent = '0 items';
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');
  if (itemCount)  itemCount.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''} found`;

  filtered.forEach((item) => container.appendChild(createCard(item)));
}

/* ------------------------------------------------------------------ */
/*  Fetch and render all items                                          */
/* ------------------------------------------------------------------ */
function loadItems() {
  const spinner   = document.getElementById('loadingSpinner');
  const container = document.getElementById('cards');
  const itemCount = document.getElementById('itemCount');

  if (spinner) spinner.style.display = 'block';
  container.innerHTML = '';

  fetch('/api/items')
    .then((res) => {
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (spinner) spinner.style.display = 'none';

      if (!Array.isArray(data) || data.length === 0) {
        allItems = [];
        if (itemCount) itemCount.textContent = '0 items';
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.classList.remove('d-none');
        return;
      }

      allItems = data;
      renderItems();
    })
    .catch((err) => {
      if (spinner) spinner.style.display = 'none';
      console.error('Error fetching items:', err);
      if (itemCount) itemCount.textContent = 'Error loading items';
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <p class="text-danger">Could not load items. Please try again later.</p>
        </div>`;
    });
}

/* ------------------------------------------------------------------ */
/*  Delete an item by ID                                                */
/* ------------------------------------------------------------------ */
function deleteItem(id) {
  const token = getToken();
  if (!token) {
    alert('You must be logged in to delete items.');
    return;
  }

  if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;

  fetch(`/api/items/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Delete failed with status ${res.status}`);
      return res.json();
    })
    .then(() => {
      /* Close the modal, then refresh the list */
      const modalEl = document.getElementById('itemModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      loadItems();
    })
    .catch((err) => {
      console.error('Failed to delete item:', err);
      alert('Could not delete the item. You may not be authorised, or the server is unavailable.');
    });
}

/* ------------------------------------------------------------------ */
/*  DOMContentLoaded — wire up everything                               */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---- Auth UI ---- */
  updateAuthUI();

  /* ---- Logout handler ---- */
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    updateAuthUI();
    loadItems(); // re-render cards (hides delete buttons)
  });

  /* ---- Dark mode toggle ---- */
  document.getElementById('toggleDarkMode').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  /* ---- Live search filter ---- */
  document.getElementById('searchBar').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    document.querySelectorAll('#cards .item-card').forEach((card) => {
      const title = card.querySelector('.item-card-title')?.textContent.toLowerCase() || '';
      const desc  = card.querySelector('.item-card-desc')?.textContent.toLowerCase()  || '';
      const meta  = Array.from(card.querySelectorAll('.item-card-meta'))
                        .map((el) => el.textContent.toLowerCase()).join(' ');
      const match = title.includes(query) || desc.includes(query) || meta.includes(query);
      const col = card.closest('[class*="col-"]');
      if (col) col.style.display = match ? '' : 'none';
    });
  });

  /* ---- Status filter buttons ---- */
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter || 'all';
      renderItems();
    });
  });

  /* ---- Modal delete button ---- */
  document.getElementById('modalDeleteBtn').addEventListener('click', () => {
    if (currentItemId !== null) {
      deleteItem(currentItemId);
    }
  });

  /* ---- Add Item form submission ---- */
  document.getElementById('addItemForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      alert('You must be logged in to add items.');
      return;
    }

    const form = e.target;
    const name         = form.querySelector('[name="name"]').value.trim();
    const description  = form.querySelector('[name="description"]').value.trim();
    const location     = form.querySelector('[name="location"]').value.trim();
    const contact_name = form.querySelector('[name="contact_name"]').value.trim();
    const phone        = form.querySelector('[name="phone"]').value.trim();
    const image        = form.querySelector('[name="image"]').value.trim();
    const statusEl     = form.querySelector('[name="status"]');
    const status       = statusEl ? statusEl.value : 'found';

    if (!name || !location || !contact_name || !phone) {
      alert('Please fill in all required fields.');
      return;
    }

    const newItem = {
      name,
      description: description || `Found at ${location}`,
      status,
      location,
      image,
      contact_name,
      phone,
    };

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newItem),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then(() => {
        form.reset();
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
        if (modalInstance) modalInstance.hide();
        loadItems();
      })
      .catch((err) => {
        console.error('Failed to add item:', err);
        alert('Could not add the item. Please check your connection and try again.');
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Item';
      });
  });

  /* ---- Initial data load ---- */
  loadItems();
});
