async function renderHome() {
  const app = document.getElementById("app");
  const user = auth.getUser();

  app.innerHTML = `
    <div class="hero">
      <h1>Your <span>Cinema</span> World</h1>
      <p>Share films, series and music. Rate, review and discover.</p>
      ${!user ? `
        <div class="hero-buttons">
          <button class="btn" onclick="navigate('register')">Get Started</button>
          <button class="btn btn-outline" onclick="navigate('explore')">Explore</button>
        </div>` : `
        <div class="hero-buttons">
          <button class="btn" onclick="openCreatePostModal()">+ New Post</button>
          <button class="btn btn-outline" onclick="navigate('explore')">Explore Content</button>
        </div>`
      }
    </div>
    <div class="section">
      <div class="section-header">
        <div class="section-title">📰 Latest Posts</div>
      </div>
      <div id="posts-feed"><p style="color:var(--text-muted)">Loading...</p></div>
    </div>
  `;

  await loadPostsFeed();
}

async function loadPostsFeed() {
  try {
    const posts = await api.getAllPosts();
    const container = document.getElementById("posts-feed");

    if (posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎬</div>
          <p>No posts yet. Be the first to share!</p>
        </div>`;
      return;
    }

    const contentMap = {};
    await Promise.all(
      posts
        .filter(p => p.content_id)
        .map(async p => {
          try {
            const content = await api.getContentById(p.content_id);
            contentMap[p.content_id] = content;
          } catch {
            // içerik bulunamazsa boş bırak
          }
        })
    );

    container.innerHTML = posts.map(post => {
      const content = post.content_id ? contentMap[post.content_id] : null;
      return renderPostCard(post, content);
    }).join("");

  } catch (err) {
    document.getElementById("posts-feed").innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
  }
}

function renderPostCard(post, content = null) {
  const user = auth.getUser();
  const isOwner = user && user.id === post.user_id;
  const coverUrl = content ? content.cover_url : null;

  return `
    <div class="post-card" id="post-${post.id}">
      <div class="post-header">
        <div class="avatar">${getInitial(post.username)}</div>
        <div>
          <div class="post-username">${post.username}</div>
          <div class="post-time">${timeAgo(post.created_at)}</div>
        </div>
        ${isOwner ? `
          <div style="margin-left:auto; display:flex; gap:8px">
            <button class="btn btn-outline btn-sm" onclick="openEditPostModal(${post.id}, '${escapeStr(post.caption)}')">Edit</button>
            <button class="btn btn-sm" style="background:var(--danger)" onclick="handleDeletePost(${post.id})">Delete</button>
          </div>` : ""}
      </div>
      
      ${post.content_title ? `
        <div class="post-content-wrapper" style="display:flex; gap:12px; background: rgba(255,255,255,0.05); padding:12px; border-radius:8px; margin:10px 0;">
          ${coverUrl ? `
            <img src="${coverUrl}" alt="${post.content_title}" style="width:70px; height:100px; object-fit:cover; border-radius:6px;" />
          ` : `
            <div style="width:70px; height:100px; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; border-radius:6px; font-size:24px;">
              ${getTypeEmoji(post.content_type)}
            </div>
          `}
          <div style="display:flex; flex-direction:column; justify-content:center;">
            <div class="post-content-tag" style="margin-bottom:4px;">
              ${getTypeEmoji(post.content_type)} ${post.content_type ? post.content_type.toUpperCase() : 'MEDIA'}
            </div>
            <div style="font-weight:bold; font-size:16px; color:var(--text-main);">${post.content_title}</div>
            ${post.content_creator ? `<div style="font-size:13px; color:rgba(255,255,255,0.6); margin-top:2px;">${post.content_creator}</div>` : ""}
          </div>
        </div>
      ` : ""}

      ${post.caption ? `<div class="post-caption">${post.caption}</div>` : ""}
      <div class="post-actions">
        <button class="action-btn" onclick="handleToggleLike(${post.id}, this)">
          ❤️ <span class="like-count">${post.like_count}</span>
        </button>
        <button class="action-btn" onclick="toggleComments(${post.id})">
          💬 ${post.comment_count} Comments
        </button>
      </div>
      <div id="comments-${post.id}" style="display:none"></div>
    </div>
  `;
}

async function handleToggleLike(postId, btn) {
  if (!auth.isLoggedIn()) return showToast("Login to like posts", "error");
  try {
    const result = await api.toggleLike(postId);
    const countEl = btn.querySelector(".like-count");
    const current = parseInt(countEl.textContent);
    countEl.textContent = result.liked ? current + 1 : current - 1;
    btn.classList.toggle("liked", result.liked);
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function toggleComments(postId) {
  const container = document.getElementById(`comments-${postId}`);
  if (container.style.display === "block") {
    container.style.display = "none";
    return;
  }
  container.style.display = "block";
  container.innerHTML = `<p style="color:var(--text-muted); padding:10px">Loading...</p>`;
  await loadComments(postId);
}

async function loadComments(postId) {
  const container = document.getElementById(`comments-${postId}`);
  try {
    const comments = await api.getCommentsByPost(postId);
    const user = auth.getUser();

    container.innerHTML = `
      <div class="comments-section">
        ${comments.length === 0 ? `<p style="color:var(--text-muted); font-size:0.85rem">No comments yet.</p>` :
          comments.map(c => `
            <div class="comment-item">
              <div class="avatar" style="width:32px;height:32px;font-size:0.8rem">${getInitial(c.username)}</div>
              <div class="comment-body">
                <div class="comment-author">${c.username}</div>
                <div class="comment-text">${c.text}</div>
              </div>
              ${user && user.id === c.user_id ? `
                <button class="action-btn btn-sm" onclick="handleDeleteComment(${c.id}, ${postId})">✕</button>` : ""}
            </div>`).join("")}
        ${user ? `
          <div class="comment-input-row">
            <input type="text" id="comment-input-${postId}" placeholder="Write a comment..." />
            <button class="btn btn-sm" onclick="handleAddComment(${postId})">Post</button>
          </div>` : `<p style="color:var(--text-muted); font-size:0.8rem">Login to comment</p>`}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
  }
}

async function handleAddComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return showToast("Comment cannot be empty", "error");
  try {
    await api.createComment({ post_id: postId, text });
    input.value = "";
    await loadComments(postId);
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleDeleteComment(commentId, postId) {
  try {
    await api.deleteComment(commentId);
    await loadComments(postId);
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleDeletePost(postId) {
  if (!confirm("Delete this post?")) return;
  try {
    await api.deletePost(postId);
    document.getElementById(`post-${postId}`).remove();
    showToast("Post deleted", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ─── CREATE POST MODAL ───────────────────────────────────────────────────────

function openCreatePostModal() {
  if (!auth.isLoggedIn()) return navigate("login");
  openModal(`
    <div class="modal-title">📝 Create Post</div>
    <div class="form-group">
      <label>Caption</label>
      <textarea id="post-caption" placeholder="What's on your mind?"></textarea>
    </div>
    <div class="form-group">
      <label>Link to Content (optional)</label>
      <div style="display:flex; gap:10px; margin-bottom:8px">
        <input type="text" id="post-content-search" placeholder="Search films, series, music..." style="flex:1" oninput="handlePostContentSearch()" />
      </div>
      <div id="post-content-results"></div>
      <div id="post-content-selected" style="display:none; background:rgba(255,255,255,0.05); border-radius:8px; padding:10px; margin-top:8px;">
        <span id="post-content-selected-text" style="color:var(--text-main)"></span>
        <button class="btn btn-sm btn-outline" style="margin-left:10px" onclick="clearPostContentSelection()">✕</button>
      </div>
      <input type="hidden" id="post-content-id" value="" />
    </div>
    <button type="submit" onclick="handleCreatePost()" style="width:100%">Post</button>
  `);
}

let postContentSearchTimeout;
async function handlePostContentSearch() {
  clearTimeout(postContentSearchTimeout);
  postContentSearchTimeout = setTimeout(async () => {
    const query = document.getElementById("post-content-search").value.trim();
    const resultsDiv = document.getElementById("post-content-results");

    if (!query) {
      resultsDiv.innerHTML = "";
      return;
    }

    resultsDiv.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem">Searching...</p>`;

    try {
      const items = await api.getAllContent("", query);

      if (items.length === 0) {
        resultsDiv.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem">No results found.</p>`;
        return;
      }

      resultsDiv.innerHTML = items.slice(0, 5).map(item => `
        <div onclick="selectPostContent(${item.id}, '${escapeStr(item.title)}', '${item.type}')"
          style="display:flex; align-items:center; gap:10px; padding:8px; border-radius:8px; cursor:pointer; background:rgba(255,255,255,0.05); margin-bottom:6px;">
          ${item.cover_url
            ? `<img src="${item.cover_url}" style="width:36px;height:52px;object-fit:cover;border-radius:4px;flex-shrink:0" />`
            : `<div style="width:36px;height:52px;background:var(--bg-input);border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${getTypeEmoji(item.type)}</div>`}
          <div>
            <div style="font-weight:600; font-size:0.9rem">${item.title}</div>
            <div style="font-size:0.78rem; color:var(--text-muted)">
              <span class="badge badge-${item.type}">${item.type}</span>
              ${item.release_year ? `· ${item.release_year}` : ""}
            </div>
          </div>
        </div>
      `).join("");
    } catch (err) {
      resultsDiv.innerHTML = `<p style="color:var(--danger); font-size:0.85rem">${err.message}</p>`;
    }
  }, 400);
}

function selectPostContent(id, title, type) {
  document.getElementById("post-content-id").value = id;
  document.getElementById("post-content-search").value = "";
  document.getElementById("post-content-results").innerHTML = "";
  document.getElementById("post-content-selected-text").textContent = `${getTypeEmoji(type)} ${title}`;
  document.getElementById("post-content-selected").style.display = "block";
}

function clearPostContentSelection() {
  document.getElementById("post-content-id").value = "";
  document.getElementById("post-content-selected").style.display = "none";
  document.getElementById("post-content-selected-text").textContent = "";
}

async function handleCreatePost() {
  const caption = document.getElementById("post-caption").value.trim();
  const contentId = document.getElementById("post-content-id").value;
  try {
    await api.createPost({ caption, content_id: contentId ? parseInt(contentId) : null });
    closeModal();
    showToast("Post created!", "success");
    await loadPostsFeed();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ─── EDIT POST MODAL ─────────────────────────────────────────────────────────

function openEditPostModal(postId, caption) {
  openModal(`
    <div class="modal-title">✏️ Edit Post</div>
    <div class="form-group">
      <label>Caption</label>
      <textarea id="edit-caption">${caption}</textarea>
    </div>
    <button type="submit" onclick="handleEditPost(${postId})" style="width:100%">Save</button>
  `);
}

async function handleEditPost(postId) {
  const caption = document.getElementById("edit-caption").value.trim();
  try {
    await api.updatePost(postId, { caption });
    closeModal();
    showToast("Post updated!", "success");
    await loadPostsFeed();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function escapeStr(str) {
  return str ? str.replace(/'/g, "\\'").replace(/"/g, '\\"') : "";
}