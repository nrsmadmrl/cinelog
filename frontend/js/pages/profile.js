async function renderProfile() {
  const user = auth.getUser();
  if (!user) return navigate("login");

  const app = document.getElementById("app");
  app.innerHTML = `<p style="color:var(--text-muted)">Loading profile...</p>`;

  try {
    const [profile, posts, reviews, lists] = await Promise.all([
      api.getUserById(user.id),
      api.getPostsByUser(user.id),
      api.getReviewsByUser(user.id),
      api.getListsByUser(user.id)
    ]);

    app.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${getInitial(profile.username)}</div>
        <div>
          <div class="profile-name">${profile.username}</div>
          <div class="profile-bio">${profile.bio || "No bio yet."}</div>
          <div style="color:var(--text-muted); font-size:0.8rem; margin-top:4px">
            Joined ${new Date(profile.created_at).toLocaleDateString()}
          </div>
        </div>
        <button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="openEditProfileModal()">Edit Profile</button>
      </div>

      <div class="tabs">
        <button class="tab active" onclick="switchTab('posts', this)">Posts (${posts.length})</button>
        <button class="tab" onclick="switchTab('reviews', this)">Reviews (${reviews.length})</button>
        <button class="tab" onclick="switchTab('lists', this)">Lists (${lists.length})</button>
      </div>

      <div id="tab-content"></div>
    `;

    window._profileData = { posts, reviews, lists };
    renderProfileTab("posts");
  } catch (err) {
    app.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
  }
}

function switchTab(tab, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  renderProfileTab(tab);
}

function renderProfileTab(tab) {
  const container = document.getElementById("tab-content");
  const { posts, reviews, lists } = window._profileData;

  if (tab === "posts") {
    if (posts.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><p>No posts yet.</p></div>`;
      return;
    }
    container.innerHTML = posts.map(p => renderPostCard(p)).join("");
  }

  if (tab === "reviews") {
    if (reviews.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⭐</div><p>No reviews yet.</p></div>`;
      return;
    }
    container.innerHTML = reviews.map(r => `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <div>
            <strong>${r.title}</strong>
            <span class="badge badge-${r.type}" style="margin-left:8px">${r.type}</span>
          </div>
          <div style="display:flex; gap:8px; align-items:center">
            <span style="color:#f5c518">⭐ ${r.rating}/10</span>
            <button class="btn btn-sm" style="background:var(--danger)" onclick="handleDeleteReview(${r.id})">Delete</button>
          </div>
        </div>
        ${r.opinion ? `<p style="color:var(--text-muted); margin-top:8px; font-size:0.875rem">${r.opinion}</p>` : ""}
      </div>
    `).join("");
  }

  if (tab === "lists") {
    container.innerHTML = `
      <div style="margin-bottom:16px">
        <button class="btn" onclick="openCreateListModal()">+ Create List</button>
      </div>
      ${lists.length === 0
        ? `<div class="empty-state"><div class="empty-state-icon">📋</div><p>No lists yet.</p></div>`
        : lists.map(l => `
          <div class="card" style="display:flex; justify-content:space-between; align-items:center">
            <div>
              <strong>${l.name}</strong>
              <span class="badge" style="margin-left:8px; background:var(--bg-input); color:var(--text-muted)">${l.type}</span>
            </div>
            <div style="display:flex; gap:8px">
              <button class="btn btn-outline btn-sm" onclick="openListDetail(${l.id})">View</button>
              <button class="btn btn-sm" style="background:var(--danger)" onclick="handleDeleteList(${l.id})">Delete</button>
            </div>
          </div>`).join("")}
    `;
  }
}

async function handleDeleteReview(id) {
  if (!confirm("Delete this review?")) return;
  try {
    await api.deleteReview(id);
    showToast("Review deleted", "success");
    await renderProfile();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleDeleteList(id) {
  if (!confirm("Delete this list?")) return;
  try {
    await api.deleteList(id);
    showToast("List deleted", "success");
    await renderProfile();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function openListDetail(listId) {
  try {
    const list = await api.getListWithItems(listId);
    openModal(`
      <div class="modal-title">📋 ${list.name}</div>
      <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px">${list.type}</p>
      ${list.items.length === 0
        ? `<p style="color:var(--text-muted)">No items in this list.</p>`
        : list.items.map(item => `
          <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
            <div>
              <span>${getTypeEmoji(item.type)}</span>
              <strong style="margin-left:8px">${item.title}</strong>
              ${item.genre ? `<span style="color:var(--text-muted); font-size:0.8rem; margin-left:8px">${item.genre}</span>` : ""}
            </div>
            <button class="btn btn-sm" style="background:var(--danger)" onclick="handleRemoveFromList(${listId}, ${item.content_id})">Remove</button>
          </div>`).join("")}
    `);
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleRemoveFromList(listId, contentId) {
  try {
    await api.removeFromList(listId, contentId);
    showToast("Removed from list", "success");
    openListDetail(listId);
  } catch (err) {
    showToast(err.message, "error");
  }
}

function openCreateListModal() {
  openModal(`
    <div class="modal-title">📋 Create List</div>
    <div class="form-group">
      <label>Name *</label>
      <input type="text" id="list-name" placeholder="e.g. My Favorites" />
    </div>
    <div class="form-group">
      <label>Type *</label>
      <select id="list-type">
        <option value="watchlater">Watch Later</option>
        <option value="playlist">Playlist</option>
        <option value="custom">Custom</option>
      </select>
    </div>
    <button type="submit" onclick="handleCreateList()" style="width:100%">Create</button>
  `);
}

async function handleCreateList() {
  const name = document.getElementById("list-name").value.trim();
  const type = document.getElementById("list-type").value;
  if (!name) return showToast("Name is required", "error");
  try {
    await api.createList({ name, type });
    closeModal();
    showToast("List created!", "success");
    await renderProfile();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function openEditProfileModal() {
  const user = auth.getUser();
  openModal(`
    <div class="modal-title">✏️ Edit Profile</div>
    <div class="form-group">
      <label>Username</label>
      <input type="text" id="edit-username" value="${user.username}" />
    </div>
    <div class="form-group">
      <label>Bio</label>
      <textarea id="edit-bio" placeholder="Tell us about yourself..."></textarea>
    </div>
    <button type="submit" onclick="handleEditProfile()" style="width:100%">Save</button>
  `);
}

async function handleEditProfile() {
  const username = document.getElementById("edit-username").value.trim();
  const bio = document.getElementById("edit-bio").value.trim();
  const user = auth.getUser();
  try {
    const updated = await api.updateUser(user.id, { username, bio });
    auth.save(auth.getToken(), { ...user, username: updated.username });
    auth.updateNavbar();
    closeModal();
    showToast("Profile updated!", "success");
    await renderProfile();
  } catch (err) {
    showToast(err.message, "error");
  }
}