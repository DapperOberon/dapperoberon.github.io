
// --- Data ---
const PROJECTS = [
  {
    id: 'blurgen',
    title: 'Blurgen Translator',
    description: 'A sophisticated English to Blurgen language translator with real-time phonetic mapping and custom slang support.',
    link: './blurgen-translator',
    tags: ['Linguistics', 'Algorithm', 'Frontend'],
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800',
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
function render() {
  const container = document.getElementById('app');
  if (!container) return;

  const filteredProjects = PROJECTS.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(state.searchTerm.toLowerCase()) || 
                          p.tags.some(t => t.toLowerCase().includes(state.searchTerm.toLowerCase()));
    const matchesCategory = state.selectedCategory === 'All' || p.category === state.selectedCategory;
    return matchesSearch && matchesCategory;
  });

  container.innerHTML = `
    <div class="min-h-screen flex flex-col">
      <!-- Navbar -->
      <nav class="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2 cursor-pointer" onclick="window.scrollTo({top:0, behavior:'smooth'})">
            <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span class="text-white font-bold text-xl">D</span>
            </div>
            <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-orange-400">DapperOberon</h1>
          </div>
          <div class="relative w-full md:w-96">
            <input id="search-input" type="text" placeholder="Search the catalog..." value="${state.searchTerm}" 
                   class="w-full bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
            <svg class="absolute left-3 top-2.5 h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="https://github.com" class="hover:text-orange-500 transition-colors">Github</a>
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
          <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            ${CATEGORIES.map(cat => `
              <button data-cat="${cat}" class="cat-btn whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold border transition-all ${state.selectedCategory === cat ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}">
                ${cat}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="flex justify-center">
          <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-8 max-w-2xl w-full">
            ${filteredProjects.length > 0 ? filteredProjects.map(p => `
              <div class="animate-fade-in group bg-slate-800/40 rounded-[2.5rem] border border-slate-700/50 overflow-hidden hover:border-orange-500/50 transition-all duration-500 flex flex-col backdrop-blur-sm hover:shadow-[0_0_50px_-12px_rgba(249,115,22,0.3)]">
                <div class="relative h-80 overflow-hidden">
                  <img src="${p.image}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
                  <h4 class="text-4xl font-bold mb-4 text-white group-hover:text-orange-400 transition-colors leading-tight">${p.title}</h4>
                  <p class="text-slate-400 text-lg leading-relaxed mb-10">${p.description}</p>
                  <div class="mt-auto">
                    <a href="${p.link}" class="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-orange-600 transition-all group/btn">
                      Launch Translator
                      <svg class="w-5 h-5 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div class="py-20 text-center w-full"><p class="text-slate-500 italic">No matches found. Try another search!</p></div>
            `}
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-slate-950 border-t border-slate-900 py-16 px-6">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div>
            <h5 class="text-white font-bold text-lg mb-2 flex items-center gap-2 justify-center md:justify-start">
              <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
              DapperOberon Studio
            </h5>
            <p class="text-slate-500 text-sm">Exclusively orange, exclusively elegant.</p>
          </div>
          <div class="flex gap-8 text-slate-500 text-sm font-medium">
            <a href="#" class="hover:text-orange-500 transition-colors">Portfolio</a>
            <a href="#" class="hover:text-orange-500 transition-colors">Github</a>
            <a href="#" class="hover:text-orange-500 transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>

      <!-- AI Assistant removed for personal site -->
    </div>
  `;

  attachListeners();
}

function attachListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.focus();
    // Maintain cursor position
    const val = searchInput.value;
    searchInput.value = '';
    searchInput.value = val;
    
    searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value;
      render();
    });
  }

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedCategory = btn.getAttribute('data-cat');
      render();
    });
  });

}

// Initial render
document.addEventListener('DOMContentLoaded', render);