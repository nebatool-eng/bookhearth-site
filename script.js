// Bookhearth — shared behavior across all pages

const NAV_LINKS = [
  { href: "index.html", label: "Home" },
  { href: "reviews.html", label: "Book Reviews" },
  { href: "stories.html", label: "Stories" },
  { href: "journal.html", label: "Journal" },
  { href: "reading-lists.html", label: "Reading Lists" },
  { href: "about.html", label: "About" },
];

function currentPage() {
  const p = window.location.pathname.split("/").pop();
  return p === "" ? "index.html" : p;
}

function renderHeader(settings) {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  const here = currentPage();
  const links = NAV_LINKS.map(l =>
    `<a href="${l.href}" ${l.href === here ? 'aria-current="page"' : ''}>${l.label}</a>`
  ).join("");

  const siteName = settings?.siteName || "Bookhearth";
  const logoHTML = settings?.logoImage
    ? `<img src="${settings.logoImage}" alt="${siteName}" style="height:36px; width:auto;">`
    : `<span class="mark">${siteName.charAt(0)}</span>${siteName.slice(1)}`;

  mount.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="logo">${logoHTML}</a>
      <nav class="primary" id="primary-nav">${links}</nav>
      <div class="header-tools">
        <a class="icon-btn" href="search.html" aria-label="Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </a>
        <button class="icon-btn" id="dark-toggle" aria-label="Toggle dark mode">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <button class="icon-btn menu-toggle" id="menu-toggle" aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById("menu-toggle").addEventListener("click", () => {
    document.getElementById("primary-nav").classList.toggle("open");
  });
}

function renderFooter(settings) {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  const siteName = settings?.siteName || "Bookhearth";
  mount.innerHTML = `
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <h4>${siteName}</h4>
          <p>A home for readers and writers. Honest reviews, original stories, journal entries, and curated reading lists.</p>
        </div>
        <div>
          <h4>Read</h4>
          <ul>
            <li><a href="reviews.html">Book Reviews</a></li>
            <li><a href="stories.html">Stories</a></li>
            <li><a href="journal.html">Journal</a></li>
            <li><a href="reading-lists.html">Reading Lists</a></li>
          </ul>
        </div>
        <div>
          <h4>Say hello</h4>
          <ul>
            <li><a href="about.html">About</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="search.html">Search the archive</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${new Date().getFullYear()} ${siteName}. Built for slow reading.</span>
        <span>A home for readers and writers.</span>
      </div>
    </div>
  `;
}

function initDarkMode() {
  const root = document.documentElement;
  if (localStorage.getItem("bookhearth-theme") === "dark") root.classList.add("dark");
  const btn = document.getElementById("dark-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    root.classList.toggle("dark");
    localStorage.setItem("bookhearth-theme", root.classList.contains("dark") ? "dark" : "light");
  });
}

function initReadingProgress() {
  const bar = document.querySelector(".progress-bar");
  if (!bar) return;
  window.addEventListener("scroll", () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = scrolled + "%";
  });
}

function initFontSizeControl() {
  const inc = document.getElementById("font-inc");
  const dec = document.getElementById("font-dec");
  const body = document.querySelector(".story-body");
  if (!inc || !dec || !body) return;
  let size = 1.18;
  const apply = () => body.style.setProperty("--story-size", size + "rem");
  inc.addEventListener("click", () => { size = Math.min(size + 0.12, 1.7); apply(); });
  dec.addEventListener("click", () => { size = Math.max(size - 0.12, 0.95); apply(); });
}

// Renders "Share by email" and "Share on Facebook" links for a detail page (review/story/journal entry).
function renderShareRow(title) {
  const mounts = document.querySelectorAll("[data-share-row]");
  if (!mounts.length) return;
  const url = window.location.href;
  const mailto = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent("Thought you'd like this: " + url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  mounts.forEach(mount => {
    mount.innerHTML = `
      <a href="${mailto}" class="btn ghost">Share by email</a>
      <a href="${fb}" class="btn ghost" target="_blank" rel="noopener">Share on Facebook</a>
    `;
  });
}

async function initSearch() {
  const input = document.getElementById("search-input");
  if (!input) return;
  const resultsMount = document.getElementById("search-results");
  const emptyState = document.getElementById("search-empty");
  const chips = document.querySelectorAll(".filter-chip");
  let activeFilter = "all";

  const [reviews, stories, journal, readingLists] = await Promise.all([
    getReviews(), getStories(), getJournal(), getReadingLists()
  ]);

  const allItems = [
    ...reviews.map(r => ({ type: "Review", title: r.title, excerpt: r.excerpt, href: `review.html?slug=${r.slug}` })),
    ...stories.map(s => ({ type: "Story", title: s.title, excerpt: s.excerpt, href: `story.html?slug=${s.slug}` })),
    ...journal.map(j => ({ type: "Journal", title: j.title, excerpt: j.body.slice(0, 140), href: `journal-entry.html?slug=${j.slug}` })),
    ...readingLists.map(l => ({ type: "Reading List", title: l.title, excerpt: l.description || l.count, href: "reading-lists.html" })),
  ];

  function render() {
    const q = input.value.trim().toLowerCase();
    const filtered = allItems.filter(item => {
      const matchesType = activeFilter === "all" || item.type === activeFilter;
      const matchesQuery = !q || item.title.toLowerCase().includes(q) || item.excerpt.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });

    resultsMount.innerHTML = filtered.map(item => `
      <a class="row-item" href="${item.href}" style="grid-template-columns: 1fr auto;">
        <div>
          <div class="meta">${item.type}</div>
          <h3>${item.title}</h3>
          <p class="excerpt">${item.excerpt}</p>
        </div>
        <span class="arrow">&#8594;</span>
      </a>
    `).join("");

    emptyState.style.display = filtered.length ? "none" : "block";
  }

  input.addEventListener("input", render);
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      render();
    });
  });

  render();
}

// Real submission via Netlify Forms (works once the site is deployed on Netlify).
// The person sets which email address receives these in their own Netlify dashboard
// under Forms → Form notifications — no code needed for that part.
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const note = document.getElementById("contact-note");
    const data = new FormData(form);

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString(),
    })
      .then(() => {
        note.textContent = "Thanks — your message has been sent.";
        note.style.color = "var(--forest)";
        note.style.display = "block";
        form.reset();
      })
      .catch(() => {
        note.textContent = "Something went wrong sending that. Please try again in a moment.";
        note.style.color = "var(--rust)";
        note.style.display = "block";
      });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await getSettings();
  renderHeader(settings);
  renderFooter(settings);
  initDarkMode();
  initReadingProgress();
  initFontSizeControl();
  initSearch();
  initContactForm();
});
