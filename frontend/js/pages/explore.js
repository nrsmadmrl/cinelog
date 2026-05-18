async function renderExplore() {
  const user = auth.getUser();
  const isAdmin = user && user.is_admin;

  document.getElementById("app").innerHTML = `
    <div class="page-title">🔍 Explore</div>
    <p class="page-subtitle">Browse films, series and music</p>

    <div class="search-bar">
      <input type="text" id="search-input" placeholder="Search titles..." oninput="handleSearch()" />
    </div>

    <div class="filter-row">
      <button class="filter-btn active" onclick="filterContent('', this)">All</button>
      <button class="filter-btn" onclick="filterContent('film', this)">🎬 Films</button>
      <button class="filter-btn" onclick="filterContent('series', this)">📺 Series</button>
      <button class="filter-btn" onclick="filterContent('music', this)">🎵 Music</button>
    </div>

    ${isAdmin ? `
      <div style="margin-bottom:20px; display:flex; gap:10px">
        <button class="btn" onclick="openTMDBSearchModal()">🎬 Import from TMDB</button>
        <button class="btn btn-outline" onclick="openAddContentModal()">+ Add Manually</button>
      </div>` : ""}

    <div id="content-grid" class="grid">
      <p style="color:var(--text-muted)">Loading...</p>
    </div>
  `;

  await loadContent();
}

let currentType = "";
let currentSearch = "";

async function loadContent() {
  try {
    const items = await api.getAllContent(currentType, currentSearch);
    const grid = document.getElementById("content-grid");

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🎬</div>
          <p>No content found.</p>
        </div>`;
      return;
    }

    grid.innerHTML = items.map(item => `
      <div class="content-card" onclick="openContentDetail(${item.id})">
        ${item.cover_url
          ? `<img src="${item.cover_url}" alt="${item.title}" style="width:100%;height:280px;object-fit:cover;" onerror="this.parentElement.querySelector('.cover-fallback').style.display='flex'; this.style.display='none'"/>`
          : ""}
        <div class="content-card-cover cover-fallback" style="${item.cover_url ? "display:none" : "display:flex"}">
          ${getTypeEmoji(item.type)}
        </div>
        <div class="content-card-body">
          <div class="content-card-title">${item.title}</div>
          <div class="content-card-meta">
            <span class="badge badge-${item.type}">${item.type}</span>
            ${item.release_year ? `· ${item.release_year}` : ""}
            ${item.genre ? `· ${item.genre}` : ""}
          </div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    document.getElementById("content-grid").innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
  }
}

function filterContent(type, btn) {
  currentType = type;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  loadContent();
}

let searchTimeout;
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSearch = document.getElementById("search-input").value.trim();
    loadContent();
  }, 400);
}

// TMDB Search Modal
function openTMDBSearchModal() {
  openModal(`
    <div class="modal-title">🎬 Import from TMDB</div>
    <div class="form-group">
      <label>Type</label>
      <select id="tmdb-type">
        <option value="all">All</option>
        <option value="film">🎬 Films only</option>
        <option value="series">📺 Series only</option>
      </select>
    </div>
    <div class="form-group">
      <div style="display:flex; gap:10px">
        <input type="text" id="tmdb-query" placeholder="Search TMDB e.g. Inception..." style="flex:1" />
        <button class="btn" onclick="handleTMDBSearch()">Search</button>
      </div>
    </div>
    <div id="tmdb-results"></div>
  `);
}

async function handleTMDBSearch() {
  const query = document.getElementById("tmdb-query").value.trim();
  const type = document.getElementById("tmdb-type").value;
  if (!query) return showToast("Enter a search term", "error");

  const resultsDiv = document.getElementById("tmdb-results");
  resultsDiv.innerHTML = `<p style="color:var(--text-muted)">Searching...</p>`;

  try {
    const endpoint = `/tmdb/search?q=${encodeURIComponent(query)}&type=${type}`;
    const results = await api.get(endpoint);

    if (results.length === 0) {
      resultsDiv.innerHTML = `<p style="color:var(--text-muted)">No results found.</p>`;
      return;
    }

    resultsDiv.innerHTML = results.map(r => `
      <div class="card" style="display:flex; gap:12px; align-items:center; margin-bottom:10px">
        ${r.cover_url
          ? `<img src="${r.cover_url}" style="width:50px;height:75px;object-fit:cover;border-radius:6px" />`
          : `<div style="width:50px;height:75px;background:var(--bg-input);border-radius:6px;display:flex;align-items:center;justify-content:center">${getTypeEmoji(r.type)}</div>`}
        <div style="flex:1">
          <div style="font-weight:600">${r.title}</div>
          <div style="color:var(--text-muted); font-size:0.8rem">
            <span class="badge badge-${r.type}">${r.type}</span>
            ${r.release_year ? `· ${r.release_year}` : ""}
          </div>
          ${r.description ? `<div style="color:var(--text-muted); font-size:0.78rem; margin-top:4px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical">${r.description}</div>` : ""}
        </div>
        <button class="btn btn-sm" onclick='handleImportTMDB(${JSON.stringify(r).replace(/'/g, "&#39;")})'>Import</button>
      </div>
    `).join("");
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
  }
}

async function handleImportTMDB(item) {
  try {
    await api.post("/tmdb/import", item, true);
    closeModal();
    showToast(`"${item.title}" imported successfully!`, "success");
    await loadContent();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function openContentDetail(id) {
  try {
    const [content, avgData, reviews] = await Promise.all([
      api.getContentById(id),
      api.getAverageRating(id),
      api.getReviewsByContent(id)
    ]);

    const user = auth.getUser();
    const isAdmin = user && user.is_admin;
    const userReview = reviews.find(r => user && r.user_id === user.id);

    openModal(`
      <div style="display:flex; gap:16px; margin-bottom:16px">
        ${content.cover_url
          ? `<img src="${content.cover_url}" style="width:100px;height:150px;object-fit:cover;border-radius:8px;flex-shrink:0" />`
          : `<div style="width:100px;height:150px;background:var(--bg-input);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;flex-shrink:0">${getTypeEmoji(content.type)}</div>`}
        <div>
          <div class="modal-title" style="margin-bottom:8px">${content.title}</div>
          <span class="badge badge-${content.type}">${content.type}</span>
          ${content.genre ? `<span style="color:var(--text-muted); margin-left:8px">${content.genre}</span>` : ""}
          ${content.release_year ? `<span style="color:var(--text-muted); margin-left:8px">${content.release_year}</span>` : ""}
          <div style="margin-top:10px; background:var(--bg-input); border-radius:8px; padding:10px; display:inline-block">
            ⭐ <strong>${avgData.average}/10</strong>
            <span style="color:var(--text-muted); margin-left:8px">${avgData.total} reviews</span>
          </div>
          ${isAdmin ? `
            <div style="margin-top:10px">
              <button class="btn btn-sm" style="background:var(--danger)" onclick="handleDeleteContent(${content.id})">Delete Content</button>
            </div>` : ""}
        </div>
      </div>

      ${content.description ? `<p style="color:var(--text-muted); margin-bottom:16px; line-height:1.6; font-size:0.9rem">${content.description}</p>` : ""}

      ${user && !userReview ? `
        <div style="margin-bottom:20px; border-top:1px solid var(--border); padding-top:16px">
          <div style="font-weight:600; margin-bottom:10px">Write a Review</div>
          <div class="form-group">
            <label>Rating (1-10)</label>
            <input type="number" id="review-rating" min="1" max="10" placeholder="8" />
          </div>
          <div class="form-group">
            <label>Opinion</label>
            <textarea id="review-opinion" placeholder="What did you think?"></textarea>
          </div>
          <button class="btn" onclick="handleCreateReview(${id})">Submit Review</button>
        </div>` : ""}

      ${user ? `
        <button class="btn btn-outline btn-sm" onclick="openAddToListModal(${id})" style="margin-bottom:16px; width:100%">
          + Add to List
        </button>` : ""}

      <div style="font-weight:600; margin-bottom:10px; border-top:1px solid var(--border); padding-top:16px">
        Reviews (${reviews.length})
      </div>
      ${reviews.length === 0
        ? `<p style="color:var(--text-muted); font-size:0.875rem">No reviews yet.</p>`
        : reviews.map(r => `
          <div class="card" style="margin-bottom:8px">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px">
              <strong style="font-size:0.875rem">${r.username}</strong>
              <span style="color:#f5c518">⭐ ${r.rating}/10</span>
            </div>
            ${r.opinion ? `<p style="color:var(--text-muted); font-size:0.875rem">${r.opinion}</p>` : ""}
          </div>`).join("")}
    `);
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleDeleteContent(id) {
  if (!confirm("Delete this content? This cannot be undone.")) return;
  try {
    await api.deleteContent(id);
    closeModal();
    showToast("Content deleted", "success");
    await loadContent();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleCreateReview(contentId) {
  const rating = parseInt(document.getElementById("review-rating").value);
  const opinion = document.getElementById("review-opinion").value.trim();
  if (!rating) return showToast("Rating is required", "error");
  try {
    await api.createReview({ content_id: contentId, rating, opinion });
    closeModal();
    showToast("Review submitted!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function openAddToListModal(contentId) {
  const user = auth.getUser();
  try {
    const lists = await api.getListsByUser(user.id);
    openModal(`
      <div class="modal-title">📋 Add to List</div>
      ${lists.length === 0
        ? `<p style="color:var(--text-muted)">You have no lists yet. Create one in your profile.</p>`
        : lists.map(l => `
          <div class="card" style="cursor:pointer; margin-bottom:8px" onclick="handleAddToList(${l.id}, ${contentId})">
            <strong>${l.name}</strong>
            <span style="color:var(--text-muted); font-size:0.8rem; margin-left:8px">${l.type}</span>
          </div>`).join("")}
    `);
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleAddToList(listId, contentId) {
  try {
    await api.addToList(listId, contentId);
    closeModal();
    showToast("Added to list!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function openAddContentModal() {
  openModal(`
    <div class="modal-title">➕ Add Content Manually</div>
    <div class="form-group">
      <label>Title *</label>
      <input type="text" id="c-title" placeholder="e.g. Inception" />
    </div>
    <div class="form-group">
      <label>Type *</label>
      <select id="c-type">
        <option value="film">🎬 Film</option>
        <option value="series">📺 Series</option>
        <option value="music">🎵 Music</option>
      </select>
    </div>
    <div class="form-group">
      <label>Genre</label>
      <input type="text" id="c-genre" placeholder="e.g. Sci-Fi" />
    </div>
    <div class="form-group">
      <label>Release Year</label>
      <input type="number" id="c-year" placeholder="e.g. 2010" />
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="c-desc" placeholder="Brief description..."></textarea>
    </div>
    <div class="form-group">
      <label>Cover Image URL</label>
      <input type="text" id="c-cover" placeholder="https://..." />
    </div>
    <button type="submit" onclick="handleAddContent()" style="width:100%">Add</button>
  `);
}

async function handleAddContent() {
  const title = document.getElementById("c-title").value.trim();
  const type = document.getElementById("c-type").value;
  const genre = document.getElementById("c-genre").value.trim();
  const release_year = parseInt(document.getElementById("c-year").value);
  const description = document.getElementById("c-desc").value.trim();
  const cover_url = document.getElementById("c-cover").value.trim();

  if (!title) return showToast("Title is required", "error");

  try {
    await api.createContent({ title, type, genre, release_year, description, cover_url });
    closeModal();
    showToast("Content added!", "success");
    await loadContent();
  } catch (err) {
    showToast(err.message, "error");
  }
}