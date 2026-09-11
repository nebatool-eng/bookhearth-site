// Bookhearth — shared behavior across all pages

const NAV_LINKS = [
  { href: "index.html", label: "Home" },
  { href: "reviews.html", label: "Book Reviews" },
  { href: "stories.html", label: "Stories" },
  { href: "reading-lists.html", label: "Reading Lists" },
  { href: "about.html", label: "About" },
];

function currentPage() {
  const p = window.location.pathname.split("/").pop();
  return p === "" ? "index.html" : p;
}

function renderHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  const here = currentPage();
  const links = NAV_LINKS.map(l =>
    `<a href="${l.href}" ${l.href === here ? 'aria-current="page"' : ''}>${l.label}</a>`
  ).join("");

  mount.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="logo"><span class="mark">B</span>ookhearth</a>
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

function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  mount.innerHTML = `
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <h4>Bookhearth</h4>
          <p>A home for readers and writers. Honest reviews, original stories, and curated reading lists.</p>
        </div>
        <div>
          <h4>Read</h4>
          <ul>
            <li><a href="reviews.html">Book Reviews</a></li>
            <li><a href="stories.html">Stories</a></li>
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
        <span>&copy; ${new Date().getFullYear()} Bookhearth. Built for slow reading.</span>
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

async function initSearch() {
  const input = document.getElementById("search-input");
  if (!input) return;
  const resultsMount = document.getElementById("search-results");
  const emptyState = document.getElementById("search-empty");
  const chips = document.querySelectorAll(".filter-chip");
  let activeFilter = "all";

  const [reviews, stories, readingLists] = await Promise.all([getReviews(), getStories(), getReadingLists()]);

  const allItems = [
    ...reviews.map(r => ({ type: "Review", title: r.title, excerpt: r.excerpt, href: `review.html?slug=${r.slug}` })),
    ...stories.map(s => ({ type: "Story", title: s.title, excerpt: s.excerpt, href: `story.html?slug=${s.slug}` })),
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

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const note = document.getElementById("contact-note");
    note.textContent = "This form is for preview only — connect it to your email service to receive messages.";
    note.style.display = "block";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  initDarkMode();
  initReadingProgress();
  initFontSizeControl();
  initSearch();
  initContactForm();
});
