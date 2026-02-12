// Star Wars Timeline Data with Posters
const TIMELINE_DATA = [
  {
    era: 'The High Republic',
    color: '#DDB152',
    entries: [
      {
        title: 'Young Jedi Adventures',
        year: '232 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/young-jedi-adventures-poster.jpg',
        episodes: 55,
        watched: 0
      }
    ]
  },
  {
    era: 'Fall of the Jedi',
    color: '#532814',
    entries: [
      {
        title: 'The Acolyte',
        year: '132 BBY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/acolyte-poster.jpg',
        episodes: 8,
        watched: 8
      },
      {
        title: 'Tales of the Jedi',
        year: '68-19 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/tales-of-the-jedi.jpg',
        episodes: 6,
        watched: 3
      },
      {
        title: 'The Phantom Menace',
        year: '32 BBY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/the-phantom-menace-poster.jpg',
        episodes: 1,
        watched: 1
      },
      {
        title: 'Attack of the Clones',
        year: '22 BBY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/attack-of-the-clones-poster.jpg',
        episodes: 1,
        watched: 0
      },
      {
        title: 'Clone Wars (2003)',
        year: '22-19 BBY',
        type: 'Animated Show (Legends)',
        canon: false,
        poster: './posters/clone-wars-poster.jpg',
        episodes: 50,
        watched: 20
      },
      {
        title: 'The Clone Wars',
        year: '22-19 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/the-clone-wars-poster.jpg',
        episodes: 133,
        watched: 0
      }
    ]
  },
  {
    era: 'Reign of the Empire',
    color: '#fff',
    entries: [
      {
        title: 'Revenge of the Sith',
        year: '19 BBY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/revenge-of-the-sith-poster.jpg',
        episodes: 1,
        watched: 0
      },
      {
        title: 'Tales of the Empire',
        year: '20 BBY - 9 ABY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/tales-of-the-empire.jpg',
        episodes: 6,
        watched: 1
      },
      {
        title: 'Tales of the Underworld',
        year: '62-18 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/tales-of-the-underworld-poster.jpg',
        episodes: 6,
        watched: 0
      },
      {
        title: 'The Bad Batch',
        year: '19-18 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/the-bad-batch-poster.jpg',
        episodes: 47,
        watched: 0
      },
      {
        title: 'Star Wars: Droids',
        year: '15 BBY',
        type: 'Animated Show (Legends)',
        canon: false,
        poster: './posters/droids-poster.jpg',
        episodes: 45,
        watched: 0
      },
      {
        title: 'Solo: A Star Wars Story',
        year: '10 BBY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/solo-poster.jpg',
        episodes: 1,
        watched: 0
      },
      {
        title: 'Obi-Wan Kenobi',
        year: '9 BBY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/obi-wan-kenobi-poster.jpg',
        episodes: 6,
        watched: 0
      },
      {
        title: 'Andor',
        year: '5-1 BBY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/andor-poster.jpg',
        episodes: 24,
        watched: 0
      },
      {
        title: 'Star Wars Rebels',
        year: '5-1 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/rebels-poster.jpg',
        episodes: 75,
        watched: 0
      }
    ]
  },
  {
    era: 'Age of the Rebellion',
    color: '#ef4444',
    entries: [
      {
        title: 'Rogue One',
        year: '0 BBY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/rogue-one-poster.jpg',
        episodes: 1,
        watched: 0
      },
      {
        title: 'A New Hope',
        year: '0 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/a-new-hope-poster.jpg',
        episodes: 1,
        watched: 0
      },
      {
        title: 'The Star Wars Holiday Special',
        year: '1 ABY',
        type: 'Live Action TV Film (Legends)',
        canon: false,
        poster: './posters/holiday-special-poster.jpg',
        episodes: 1,
        watched: 0
      },
      {
        title: 'The Empire Strikes Back',
        year: '3 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/the-empire-strikes-back-poster.jpg',
        episodes: 1,
        watched: 0
      },
      {
        title: 'Ewoks',
        year: '3 ABY',
        type: 'Animated Show (Legends)',
        canon: false,
        poster: './posters/ewoks-poster.jpg',
        episodes: 35,
        watched: 0,
        episodeDetails: [
          { title: 'The Cries of the Trees', time: '' },
          { title: 'The Haunted Village', time: '' },
          { title: 'Rampage of the Phlogs', time: '' },
          { title: 'To Save Deej', time: '' },
          { title: 'The Travelling Jindas', time: '' },
          { title: 'The Tree of Light', time: '' },
          { title: 'The Curse of the Jindas', time: '' },
          { title: 'The Land of the Gupins', time: '' },
          { title: 'Sunstar vs. Shadowstone', time: '' },
          { title: "Wicket's Wagon", time: '' },
          { title: 'The Three Lessons', time: '' },
          { title: 'Blue Harvest', time: '' },
          { title: 'Asha', time: '' },
          { title: 'The Crystal Cloak', time: '' },
          { title: 'The Wish Plan', time: '' },
          { title: 'Home is Where the Shrieks Are', time: '' },
          { title: 'Princess Latara', time: '' },
          { title: 'The Raich', time: '' },
          { title: 'The Totem Master', time: '' },
          { title: 'A Gift for Shodu', time: '' },
          { title: 'Night of the Stranger', time: '' },
          { title: 'Gone With the Mimphs', time: '' },
          { title: 'The First Apprentice', time: '' },
          { title: 'Hard Sell', time: '' },
          { title: 'A Warrior and a Lurdo', time: '' },
          { title: 'The Season Scepter', time: '' },
          { title: 'Prow Beaten', time: '' },
          { title: "Baga's Rival", time: '' },
          { title: "Horville's Hut of Horrors", time: '' },
          { title: 'The Tragic Flute', time: '' },
          { title: 'Just My Luck', time: '' },
          { title: 'Bringing Up Norky', time: '' },
          { title: 'Battle for the Sunstar', time: '' },
          { title: 'Party Ewok', time: '' },
          { title: 'Malani the Warrior', time: '' }
        ]
      },
      {
        title: 'Caravan of Courage: An Ewok Adventure',
        year: '3 ABY',
        type: 'Live Action TV Film (Legends)',
        canon: false,
        poster: './posters/caravan-of-courage-poster.jpg',
        episodes: 1,
        watched: 0,
        episodeDetails: [ { title: 'Caravan of Courage: An Ewok Adventure', time: '' } ]
      },
      {
        title: 'Ewoks: The Battle for Endor',
        year: '3 ABY',
        type: 'Live Action TV Film (Legends)',
        canon: false,
        poster: './posters/ewoks-battle-for-endor-poster.jpg',
        episodes: 1,
        watched: 0,
        episodeDetails: [ { title: 'Ewoks: The Battle for Endor', time: '' } ]
      },
      {
        title: 'Return of the Jedi',
        year: '4 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/return-of-the-jedi-poster.jpg',
        episodes: 1,
        watched: 0
      }
    ]
  },
  {
    era: 'The New Republic',
    color: '#3455A1',
    entries: [
      {
        title: 'The Mandalorian',
        year: '9 ABY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/the-mandalorian-poster.jpg',
        episodes: 24,
        watched: 0
      },
      {
        title: 'The Book of Boba Fett',
        year: '9 ABY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/the-book-of-boba-fett-poster.jpg',
        episodes: 7,
        watched: 0
      },
      {
        title: 'Ahsoka',
        year: '9 ABY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/ahsoka-poster.jpg',
        episodes: 8,
        watched: 0
      },
      {
        title: 'Skeleton Crew',
        year: '9 ABY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/skeleton-crew-poster.jpg',
        episodes: 8,
        watched: 0
      }
    ]
  },
  {
    era: 'Rise of the First Order',
    color: '#ff0000',
    entries: [
      {
        title: 'Star Wars Resistance',
        year: '34 ABY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/resistance-poster.jpg',
        episodes: 39,
        watched: 0
      },
      {
        title: 'The Force Awakens',
        year: '34 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/the-force-awakens-poster.jpg',
        episodes: 1,
        watched: 0
      },
      {
        title: 'The Last Jedi',
        year: '34 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/the-last-jedi-poster.jpg',
        episodes: 1,
        watched: 0
      },
      {
        title: 'The Rise of Skywalker',
        year: '35 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/rise-of-skywalker-poster.jpg',
        episodes: 1,
        watched: 0
      }
    ]
  },
  {
    era: 'Non-Canon Stories',
    color: '#64748b',
    entries: [
      {
        title: 'Star Wars: Visions',
        year: 'Various',
        type: 'Animated Anthology',
        canon: false,
        poster: './posters/visions-poster.jpg',
        episodes: 27,
        watched: 0
      }
    ]
  }
];

// Render the timeline
function render() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <header>
      <div class="header-container">
        <a href="/" class="header-back">← Back to Home</a>
        <h1>Star Wars Timeline</h1>
      </div>
    </header>

    <main class="timeline-container">
      <div class="timeline-legend">
        <span class="legend-item"><span class="legend-badge canon">Canon</span> Official Continuity</span>
        <span class="legend-item"><span class="legend-badge legends">Legends</span> Non-Canon</span>
      </div>

      ${TIMELINE_DATA.map((section, idx) => `
        <section class="timeline-section" style="--section-color: ${section.color}">
          <h2>${section.era}</h2>
          <div class="entries-grid">
            ${section.entries.map((entry, entryIdx) => {
              const progress = entry.episodes > 0 ? Math.round((entry.watched / entry.episodes) * 100) : 0;
              return `
                <div class="entry-card" data-canon="${entry.canon}" data-section="${idx}" data-entry="${entryIdx}">
                  <div class="entry-poster">
                    <img src="${entry.poster}" alt="${entry.title}" />
                    <div class="entry-overlay">
                      <div class="progress-ring">
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--section-color)" stroke-width="3" 
                                  stroke-dasharray="${progress * 2.827}" stroke-dashoffset="0" 
                                  style="transition: stroke-dasharray 0.3s ease;" />
                        </svg>
                        <span class="progress-text">${progress}%</span>
                      </div>
                    </div>
                  </div>
                  <div class="entry-content">
                    <h3>${entry.title}</h3>
                    <p class="entry-meta">${entry.year} • ${entry.type}</p>
                    <p class="entry-episodes">${entry.watched}/${entry.episodes} watched</p>
                    <span class="entry-badge ${entry.canon ? 'canon' : 'legends'}">
                      ${entry.canon ? 'Canon' : 'Legends'}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      `).join('')}
    </main>

    <footer>
      <p>© 2026 DapperOberon. Star Wars is a trademark of Lucasfilm Ltd.</p>
    </footer>
  `;

  // ensure a modal container exists in the document body
  if (!document.getElementById('modal')) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal';
    modalDiv.className = 'modal hidden';
    modalDiv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(modalDiv);
  }

  // initialize watched arrays and attach click handlers
  initializeWatchedState();
  attachEntryHandlers();
}

// Watched state and modal helpers
function initializeWatchedState() {
  TIMELINE_DATA.forEach(section => {
    section.entries.forEach(entry => {
      const key = 'watched_' + entry.title.replace(/\s+/g, '_');
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length === entry.episodes) {
            entry._watchedArray = arr;
            entry.watched = arr.filter(Boolean).length;
            return;
          }
        }
      } catch (e) {}
      // If the author supplied a prefilled _watchedArray in the data, use it
      if (Array.isArray(entry._watchedArray) && entry._watchedArray.length === entry.episodes) {
        entry.watched = entry._watchedArray.filter(Boolean).length;
        return;
      }
      entry._watchedArray = new Array(entry.episodes).fill(false);
      entry.watched = entry.watched || 0;
    });
  });
  // update UI counts
  TIMELINE_DATA.forEach((section, sidx) => {
    section.entries.forEach((entry, eidx) => updateEntryUI(sidx, eidx));
  });
}

function attachEntryHandlers() {
  document.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => {
      const s = Number(card.dataset.section);
      const e = Number(card.dataset.entry);
      openModal(s, e);
    });
  });
}

function saveWatchedState(entry) {
  const key = 'watched_' + entry.title.replace(/\s+/g, '_');
  try { localStorage.setItem(key, JSON.stringify(entry._watchedArray)); } catch (e) {}
  entry.watched = entry._watchedArray.filter(Boolean).length;
}

function updateEntryUI(sectionIdx, entryIdx) {
  const entry = TIMELINE_DATA[sectionIdx].entries[entryIdx];
  const selector = `.entry-card[data-section="${sectionIdx}"][data-entry="${entryIdx}"]`;
  const card = document.querySelector(selector);
  if (!card) return;
  const watchedCount = entry._watchedArray ? entry._watchedArray.filter(Boolean).length : entry.watched;
  const progress = entry.episodes > 0 ? Math.round((watchedCount / entry.episodes) * 100) : 0;
  const progressText = card.querySelector('.progress-text'); if (progressText) progressText.textContent = progress + '%';
  const progressCircle = card.querySelector('.progress-circle'); if (progressCircle) progressCircle.setAttribute('stroke-dasharray', String(progress * 2.827));
  const episodesText = card.querySelector('.entry-episodes'); if (episodesText) episodesText.textContent = `${watchedCount}/${entry.episodes} watched`;
}

function openModal(sectionIdx, entryIdx) {
  const entry = TIMELINE_DATA[sectionIdx].entries[entryIdx];
  const modal = document.getElementById('modal');
  const arr = entry._watchedArray || new Array(entry.episodes).fill(false);
  const watchedCount = arr.filter(Boolean).length;
  const progress = entry.episodes > 0 ? Math.round((watchedCount / entry.episodes) * 100) : 0;

  let episodesHTML = '';
  for (let i = 0; i < entry.episodes; i++) {
    const checked = arr[i] ? 'checked' : '';
    episodesHTML += `
      <div class="episode-item">
        <label>
          <input type="checkbox" data-ep="${i}" ${checked} />
          <span class="episode-label">S1.E${i+1}</span>
          <span class="episode-title">${(entry.episodeDetails && entry.episodeDetails[i] && entry.episodeDetails[i].title) || ''}</span>
        </label>
      </div>
    `;
  }
  // If only one episode, render it as the main item instead of a list
  if (entry.episodes === 1) {
    const checked = arr[0] ? 'checked' : '';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close" aria-label="Close">×</button>
        <div class="modal-left"><img src="${entry.poster}" alt="${entry.title}"/></div>
        <div class="modal-right">
          <h2>${entry.title}</h2>
          <p class="entry-meta">${entry.year} • ${entry.type}</p>
          <div class="modal-progress">
            <div class="progress-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="6" />
                <circle class="modal-progress-circle" cx="50" cy="50" r="45" fill="none" stroke="${TIMELINE_DATA[sectionIdx].color}" stroke-width="6" stroke-dasharray="${progress * 2.827}" stroke-dashoffset="0" />
              </svg>
              <span class="progress-text">${progress}%</span>
            </div>
            <p>${watchedCount}/${entry.episodes} watched</p>
          </div>
          <div class="single-episode">
            <label>
              <input type="checkbox" class="single-ep-checkbox" data-ep="0" ${checked} />
              <span class="single-ep-title">${(entry.episodeDetails && entry.episodeDetails[0] && entry.episodeDetails[0].title) || entry.title}</span>
            </label>
          </div>
        </div>
      </div>
    `;
  } else {
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close" aria-label="Close">×</button>
        <div class="modal-left"><img src="${entry.poster}" alt="${entry.title}"/></div>
        <div class="modal-right">
          <h2>${entry.title}</h2>
          <p class="entry-meta">${entry.year} • ${entry.type}</p>
          <div class="modal-progress">
            <div class="progress-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="6" />
                <circle class="modal-progress-circle" cx="50" cy="50" r="45" fill="none" stroke="${TIMELINE_DATA[sectionIdx].color}" stroke-width="6" stroke-dasharray="${progress * 2.827}" stroke-dashoffset="0" />
              </svg>
              <span class="progress-text">${progress}%</span>
            </div>
            <p>${watchedCount}/${entry.episodes} watched</p>
          </div>
          <div class="episode-list">${episodesHTML}</div>
        </div>
      </div>
    `;
  }

  modal.classList.remove('hidden');
  modal.querySelector('.modal-close').addEventListener('click', () => closeModal());
  modal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal());

  modal.querySelectorAll('.episode-item input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const idx = Number(cb.dataset.ep);
      entry._watchedArray[idx] = cb.checked;
      saveWatchedState(entry);
      updateEntryUI(sectionIdx, entryIdx);
      const newCount = entry._watchedArray.filter(Boolean).length;
      const newProgress = entry.episodes > 0 ? Math.round((newCount / entry.episodes) * 100) : 0;
      const pText = modal.querySelector('.progress-text'); if (pText) pText.textContent = newProgress + '%';
      const pCircle = modal.querySelector('.modal-progress-circle'); if (pCircle) pCircle.setAttribute('stroke-dasharray', String(newProgress * 2.827));
    });
  });
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  modal.innerHTML = '';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', render);
