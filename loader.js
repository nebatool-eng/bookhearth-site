// Bookhearth — content loader
// Fetches the JSON content files (edited via /admin) at page load time,
// so every page always reflects the latest published content.

async function loadContent(path) {
  try {
    const res = await fetch(path + "?_=" + Date.now()); // cache-bust so edits show up immediately
    if (!res.ok) throw new Error("Failed to load " + path);
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

function getReviews() { return loadContent("content/reviews.json").then(d => d?.reviews || []); }
function getStories() { return loadContent("content/stories.json").then(d => d?.stories || []); }
function getReadingLists() { return loadContent("content/reading-lists.json").then(d => d?.readingLists || []); }
function getSettings() { return loadContent("content/settings.json"); }

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Turns "paragraph one\n\nparagraph two" into safe <p> tags.
function paragraphsToHTML(text) {
  if (!text) return "";
  return text
    .split(/\n\s*\n/)
    .map(p => `<p>${escapeHTML(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function starString(rating) {
  return "&#9733;".repeat(rating) + "&#9734;".repeat(5 - rating);
}

function showEmptyState(mount, message) {
  mount.innerHTML = `<p style="color: var(--ink-soft); padding: 20px 0;">${message}</p>`;
}
