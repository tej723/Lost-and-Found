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

