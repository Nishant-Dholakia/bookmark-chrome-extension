// =========================
// DOM ELEMENTS
// =========================
const saveBtn = document.getElementById("saveBtn");
const tagsInput = document.getElementById("tagsInput");
const searchInput = document.getElementById("searchInput");
const tagFilters = document.getElementById("tagFilters");
const bookmarkList = document.getElementById("bookmarkList");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const fileInput = document.getElementById("fileInput");

// =========================
// STATE
// =========================
let bookmarks = [];
let activeFilter = null;

// =========================
// INIT
// =========================
init();

function init() {
  getBookmarks((data) => {
    bookmarks = Array.isArray(data) ? data : [];
    render(getFilteredBookmarks());
    renderTags();
  });

  saveBtn.addEventListener("click", handleSave);
  searchInput.addEventListener("input", handleSearch);
  exportBtn.addEventListener("click", handleExport);
  importBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleImport);
}

// =========================
// SAVE BOOKMARK
// =========================
function handleSave() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;

    const tab = tabs[0];
    const manualTags = parseTags(tagsInput.value);

    const autoTags =
      typeof autoGenerateTags === "function"
        ? autoGenerateTags(tab.url, tab.title)
        : [];

    const finalTags =
      manualTags.length > 0 ? manualTags : autoTags;

    const bookmark = {
      id: Date.now(),
      title: tab.title,
      url: tab.url,
      tags: finalTags,
      timestamp: new Date().toISOString()
    };

    bookmarks.unshift(bookmark);

    setBookmarks(bookmarks, () => {
      tagsInput.value = "";
      activeFilter = null;
      searchInput.value = "";
      render(bookmarks);
      renderTags();
      showNotification("Bookmark saved");
    });
  });
}

// =========================
// RENDER BOOKMARKS
// =========================
function render(list) {
  bookmarkList.innerHTML = "";

  if (!list || list.length === 0) {
    bookmarkList.innerHTML = `
      <li style="text-align:center; opacity:0.6; padding:40px 20px;">
        <div style="font-size:42px;">📚</div>
        <div style="margin-top:8px;">No bookmarks yet</div>
      </li>
    `;
    return;
  }

  list.forEach((b) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="bookmark-header">
        <div class="bookmark-title">
          <a href="${escapeHtml(b.url)}" target="_blank">
            ${escapeHtml(b.title)}
          </a>
        </div>
        <div class="actions">
          <span class="edit" title="Edit tags">✏️</span>
          <span class="delete" title="Delete">✖</span>
        </div>
      </div>

      <div class="bookmark-url">${escapeHtml(b.url)}</div>

      <div class="tags">
        ${b.tags.map(t => `<span>${escapeHtml(t)}</span>`).join("")}
      </div>
    `;

    li.querySelector(".delete").onclick = () => handleDelete(b.id);
    li.querySelector(".edit").onclick = () => handleEdit(b);

    bookmarkList.appendChild(li);
  });
}

// =========================
// DELETE
// =========================
function handleDelete(id) {
  if (!confirm("Delete this bookmark?")) return;

  bookmarks = bookmarks.filter(b => b.id !== id);
  setBookmarks(bookmarks, () => {
    render(getFilteredBookmarks());
    renderTags();
    showNotification("Bookmark deleted");
  });
}

// =========================
// EDIT TAGS
// =========================
function handleEdit(bookmark) {
  const updated = prompt(
    "Edit tags (comma-separated):",
    bookmark.tags.join(", ")
  );

  if (updated === null) return;

  bookmark.tags = parseTags(updated);

  setBookmarks(bookmarks, () => {
    render(getFilteredBookmarks());
    renderTags();
    showNotification("Tags updated");
  });
}

// =========================
// SEARCH
// =========================
function handleSearch(e) {
  activeFilter = null;
  const q = e.target.value.toLowerCase();

  const filtered = bookmarks.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.url.toLowerCase().includes(q) ||
    b.tags.some(t => t.toLowerCase().includes(q))
  );

  render(filtered);
  renderTags();
}

// =========================
// TAG FILTERS
// =========================
function renderTags() {
  const counts = {};

  bookmarks.forEach(b => {
    b.tags.forEach(t => {
      counts[t] = (counts[t] || 0) + 1;
    });
  });

  const tags = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  if (tags.length === 0) {
    tagFilters.innerHTML =
      `<span style="opacity:.5;cursor:default">No tags yet</span>`;
    return;
  }

  tagFilters.innerHTML = tags
    .map(([tag, count]) =>
      `<span data-tag="${escapeHtml(tag)}"
        class="${activeFilter === tag ? "active" : ""}">
        ${escapeHtml(tag)} (${count})
      </span>`
    )
    .join("");

  tagFilters.querySelectorAll("span[data-tag]").forEach(span => {
    span.onclick = () => toggleTagFilter(span.dataset.tag);
  });
}

function toggleTagFilter(tag) {
  activeFilter = activeFilter === tag ? null : tag;
  searchInput.value = "";
  render(getFilteredBookmarks());
  renderTags();
}

function getFilteredBookmarks() {
  if (!activeFilter) return bookmarks;
  return bookmarks.filter(b => b.tags.includes(activeFilter));
}

// =========================
// EXPORT / IMPORT
// =========================
function handleExport() {
  const blob = new Blob(
    [JSON.stringify(bookmarks, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `bookmarks-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showNotification("Bookmarks exported");
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error();

      bookmarks = [...imported, ...bookmarks];
      setBookmarks(bookmarks, () => {
        render(bookmarks);
        renderTags();
        showNotification(`Imported ${imported.length} bookmarks`);
      });
    } catch {
      alert("Invalid bookmark file");
    }
  };

  reader.readAsText(file);
  fileInput.value = "";
}

// =========================
// UTILITIES
// =========================
function parseTags(str) {
  return str
    .split(",")
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(msg) {
  const n = document.createElement("div");
  n.textContent = msg;
  n.style.cssText = `
    position:fixed;
    top:70px;
    left:50%;
    transform:translateX(-50%);
    background:linear-gradient(135deg,#22c55e,#16a34a);
    color:#052e16;
    padding:10px 22px;
    border-radius:10px;
    font-weight:600;
    z-index:999;
    box-shadow:0 8px 24px rgba(34,197,94,0.4);
  `;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2000);
}