
// --- Data ---
const PROJECTS = [
  {
    id: 'blurgen',
    title: 'Blurgen Translator',
    description: 'A sophisticated English to Blurgen language translator with real-time phonetic mapping and custom slang support.',
    link: './blurgen-translator',
    linkText: 'Launch Translator',
    tags: ['Linguistics', 'Algorithm', 'Frontend'],
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800',
    category: 'Tool'
  },
  {
    id: 'star-wars-timeline',
    title: 'Star Wars Timeline',
    description: 'An interactive chronological explorer spanning millennia of Star Wars lore. Navigate key events from the Old Republic through the Skywalker Saga with rich details and cross-era connections.',
    link: './star-wars-timeline',
    linkText: 'Explore Timeline',
    tags: ['Timeline', 'Star Wars', 'Interactive'],
    image: 'https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?auto=format&fit=crop&q=80&w=800',
    category: 'Tool'
  }
];

const CATEGORIES = ['All', 'Tool'];

// --- State ---
const state = {
  searchTerm: '',
  selectedCategory: 'All'
};

// AI assistant removed — site is now a static personal portfolio.

// --- UI Rendering ---
let _initialized = false;

function render() {
  const container = document.getElementById('app');
  if (!container) return;

  // Render static shell once. Projects will be updated by `renderProjects()`
  if (!_initialized) {
    container.innerHTML = `
    <div class="min-h-screen flex flex-col">
      <!-- Navbar -->
      <nav class="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div class="max-w-7xl mx-auto relative flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="/" class="flex items-center gap-2" aria-label="DapperOberon home">
            <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span class="text-white font-bold text-xl">D</span>
            </div>
            <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-orange-400">DapperOberon</h1>
          </a>
          <div class="relative w-full md:w-96 max-w-md mx-auto md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
            <input id="search-input" type="text" placeholder="Search the catalog..." value="${state.searchTerm}" 
                   class="w-full bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
            <svg class="absolute left-3 top-2.5 h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#catalog" class="hover:text-orange-500 transition-colors">Projects</a>
            <a href="https://github.com/DapperOberon" class="hover:text-orange-500 transition-colors">Github</a>
          </div>
        </div>
      </nav>

      <!-- Hero -->
      <header class="relative py-24 px-6 overflow-hidden">
        <div class="absolute inset-0 opacity-20 pointer-events-none">
          <div class="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600 rounded-full blur-[120px]"></div>
          <div class="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-400 rounded-full blur-[120px]"></div>
        </div>
        <div class="max-w-4xl mx-auto text-center relative z-10">
          <span class="inline-block py-1 px-4 mb-8 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold uppercase border border-orange-500/20 tracking-widest animate-pulse">
            Focused Development
          </span>
          <h2 class="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tighter text-white">
            The <span class="text-orange-500">Orange</span> Portfolio
          </h2>
          <p class="text-slate-400 text-lg md:text-2xl leading-relaxed mb-12 font-light">
            Quality over quantity. Exploring the frontiers of linguistics through purposeful code.
          </p>
          <div class="flex justify-center gap-4">
            <button onclick="document.getElementById('catalog').scrollIntoView({behavior:'smooth'})" class="bg-white text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-orange-500 hover:text-white transition-all shadow-xl hover:shadow-orange-500/30">
              View Project
            </button>
          </div>
        </div>
      </header>

      <!-- Catalog Section -->
      <main id="catalog" class="max-w-7xl mx-auto px-6 py-20 w-full flex-grow">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 border-b border-slate-800 pb-8">
          <div>
            <h3 class="text-3xl font-bold text-white mb-2">Project Showcase</h3>
            <p class="text-slate-500 text-sm">A singular focus on excellence.</p>
          </div>
          <div id="categories" class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            ${CATEGORIES.map(cat => `
              <button data-cat="${cat}" aria-pressed="${state.selectedCategory === cat ? 'true' : 'false'}" class="cat-btn whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold border transition-all ${state.selectedCategory === cat ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}">
                ${cat}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="flex justify-center">
          <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl w-full">
            <!-- Projects will be injected here -->
          </div>
        </div>

        <div id="results-count" class="sr-only" aria-live="polite"></div>
      </main>

      
        <!-- Footer -->
        <footer class="bg-slate-950 border-t border-slate-900 py-16 px-6">
          <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div class="flex-1 text-center md:text-left">
              <h5 class="text-white font-bold text-lg mb-2 flex items-center gap-2 justify-center md:justify-start">
                <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                DapperOberon Studio
              </h5>
              <p class="text-slate-500 text-sm">Exclusively orange, exclusively elegant.</p>
            </div>

            <div class="flex-1">
              <div class="flex justify-center md:justify-center gap-8 text-slate-500 text-sm font-medium">
                <a href="#catalog" class="hover:text-orange-500 transition-colors">Projects</a>
                <a href="https://github.com/DapperOberon" class="hover:text-orange-500 transition-colors">Github</a>
                <a href="https://www.linkedin.com/in/cameron-t-smith" class="hover:text-orange-500 transition-colors">LinkedIn</a>
              </div>
            </div>

            <div class="flex-1 text-center md:text-right mt-4 md:mt-0 text-slate-500 text-sm">
              © ${new Date().getFullYear()} DapperOberon. All rights reserved.
            </div>
          </div>
        </footer>

    </div>
  `;

    attachListeners();
    _initialized = true;
  }

  // Update only the projects grid on subsequent calls
  renderProjects();
}

const _projectEls = new Map();

function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const q = state.searchTerm.toLowerCase();

  // Create DOM nodes for all projects once
  if (_projectEls.size === 0) {
    PROJECTS.forEach(p => {
      const card = document.createElement('div');
      card.className = 'project-card group bg-slate-800/40 rounded-[2.5rem] border border-slate-700/50 overflow-hidden transition-all duration-200 flex flex-col backdrop-blur-sm';
      card.dataset.id = p.id;

      card.innerHTML = `
        <div class="relative h-48 overflow-hidden">
          <img src="${p.image}" alt="${p.title} project preview image" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          <div class="absolute bottom-6 left-8 flex gap-2">
            ${p.tags.map(t => `<span class="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-orange-400/30">${t}</span>`).join('')}
          </div>
        </div>
        <div class="p-10 flex-grow flex flex-col">
          <div class="flex justify-between items-center mb-6">
            <span class="text-orange-500 text-xs font-bold uppercase tracking-widest">${p.category}</span>
            <div class="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></div>
          </div>
          <h4 class="text-4xl font-bold mb-4 text-white transition-colors leading-tight">${p.title}</h4>
          <p class="text-slate-400 text-lg leading-relaxed mb-10">${p.description}</p>
          <div class="mt-auto">
            <a href="${p.link}" class="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-orange-600 transition-all group/btn">
              ${p.linkText}
            </a>
          </div>
        </div>
      `;

      // manage transitionend to set display:none after hiding
      card.addEventListener('transitionend', (ev) => {
        if (card.classList.contains('is-hidden')) {
          card.style.display = 'none';
        }
      });

      grid.appendChild(card);
      _projectEls.set(p.id, { el: card, data: p });
    });
  }

  // Toggle visibility without rebuilding DOM to avoid flashes
  let anyVisible = false;
  let visibleCount = 0;
  _projectEls.forEach(({ el, data }) => {
    const matchesSearch = data.title.toLowerCase().includes(q) || data.tags.some(t => t.toLowerCase().includes(q));
    const matchesCategory = state.selectedCategory === 'All' || data.category === state.selectedCategory;
    const show = matchesSearch && matchesCategory;
    if (show) {
      // if hidden due to display:none, make visible then remove hidden class to animate in
      if (el.style.display === 'none') {
        el.style.display = '';
        // ensure starting from hidden state before removing class
        el.classList.add('is-hidden');
        requestAnimationFrame(() => el.classList.remove('is-hidden'));
      } else {
        el.classList.remove('is-hidden');
      }
      anyVisible = true;
    } else {
      // only start hide animation if currently visible
      if (el.style.display !== 'none' && !el.classList.contains('is-hidden')) {
        el.classList.add('is-hidden');
        // `transitionend` listener will set display:none after animation
      }
    }
  });

  if (!anyVisible) {
    // Show a single empty message row instead of rebuilding grid
    // Remove existing message if any
    let msg = document.getElementById('no-results-msg');
    if (!msg) {
      msg = document.createElement('div');
      msg.id = 'no-results-msg';
      msg.className = 'py-20 text-center w-full text-slate-500 italic';
      msg.textContent = 'No matches found. Try another search!';
      grid.appendChild(msg);
    }
  } else {
    const msg = document.getElementById('no-results-msg');
    if (msg) msg.remove();
  }

  // Update aria-live region with visible count
  _projectEls.forEach(({ el, data }) => {
    if (el.style.display !== 'none' && !el.classList.contains('is-hidden')) visibleCount++;
  });
  const live = document.getElementById('results-count');
  if (live) live.textContent = `${visibleCount} project${visibleCount === 1 ? '' : 's'} shown`;
}

function attachListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    // Maintain cursor position
    const val = searchInput.value;
    searchInput.value = '';
    searchInput.value = val;
    
    searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value;
      renderProjects();
    });
  }

  // Category buttons: update selected category and toggle active classes
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat');
      if (!cat) return;
      state.selectedCategory = cat;

      // Update active classes and aria-pressed
      document.querySelectorAll('.cat-btn').forEach(b => {
        const isActive = b.getAttribute('data-cat') === state.selectedCategory;
        b.className = isActive
          ? 'cat-btn whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold border transition-all bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20'
          : 'cat-btn whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold border transition-all bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700';
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      renderProjects();
    });
  });

}

// Initial render
document.addEventListener('DOMContentLoaded', render);