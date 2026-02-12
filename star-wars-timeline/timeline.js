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
        watched: 0,
        synopsis: 'The young Jedi take on new missions across the galaxy as they try to stop the rise of the pirates!',
        episodeDetails: [
          // S1 (25 episodes)
          { title: 'S1.E1 - The Young Jedi / Yoda\'s Mission', time: '' },
          { title: 'S1.E2 - Nash\'s Race Day / The Lost Jedi Ship', time: '' },
          { title: 'S1.E3 - Get Well Nubs / The Junk Giant', time: '' },
          { title: 'S1.E4 - Lys and the Snowy Mountain Rescue / Attack of the Training Droids', time: '' },
          { title: 'S1.E5 - The Jellyfruit Pursuit / Creature Safari', time: '' },
          { title: 'S1.E6 - Squadron / Forest Defenders', time: '' },
          { title: 'S1.E7 - The Jedi and the Thief / The Missing Kibbin', time: '' },
          { title: 'S1.E8 - The Girl and her Gargantua / The Show Must Go On', time: '' },
          { title: 'S1.E9 - The Princess and the Jedi / Kai\'s Bad Day', time: '' },
          { title: 'S1.E10 - Visitor\'s Day / The Growing Green Danger', time: '' },
          { title: 'S1.E11 - The Ganguls / Bad Egg', time: '' },
          { title: 'S1.E12 - Off the Rails / The Thieves of Tharnaka', time: '' },
          { title: 'S1.E13 - Tree Troubles / Big Brother\'s Bounty', time: '' },
          { title: 'S1.E14 - Charhound Chase / Creature Comforts', time: '' },
          { title: 'S1.E15 - An Adventure with Yoda / The Talon Takeover', time: '' },
          { title: 'S1.E16 - Mystery of the Opal Cave / Clash', time: '' },
          { title: 'S1.E17 - Stuck in the Muck / Junkyard Sleepover', time: '' },
          { title: 'S1.E18 - The Great Leaf Glide / The Harvest Feast', time: '' },
          { title: 'S1.E19 - Life Day / Raxlo Strikes Back', time: '' },
          { title: 'S1.E20 - Aftershock / Feather Frenzy', time: '' },
          { title: 'S1.E21 - Best Friends / Happy Trails, Nubs', time: '' },
          { title: 'S1.E22 - The Tale of Short Spire / The Team Up', time: '' },
          { title: 'S1.E23 - The Caves of Batuu / Finders Keepers', time: '' },
          { title: 'S1.E24 - The Starship Show / Nash\'s Super Busy Day', time: '' },
          { title: 'S1.E25 - The Prince and the Pirate', time: '' },
          // S2 (23 episodes)
          { title: 'S2.E1 - Heroes and Hotshots / A Jedi or a Pirate', time: '' },
          { title: 'S2.E2 - The Rustler Roundup / A New Discovery', time: '' },
          { title: 'S2.E3 - A Pirate\'s Pet / The Secret Ship', time: '' },
          { title: 'S2.E4 - Nub\'s Big Mistake / The Jedi Rescue', time: '' },
          { title: 'S2.E5 - Terror of Tenoo / The Prince of Masks', time: '' },
          { title: 'S2.E6 - Battle for the Band / Uprooted', time: '' },
          { title: 'S2.E7 - Mine and Ours / The Andraven Circuit', time: '' },
          { title: 'S2.E8 - The Great Gomgourd Quest / A Sticy Situation', time: '' },
          { title: 'S2.E9 - The Missing Life Day Feast / The Lost Treasure of Tenoo', time: '' },
          { title: 'S2.E10 - The Wild Aklyrr / Lys\' Lost Lightsaber', time: '' },
          { title: 'S2.E11 - Tower Run / The Jumping Jetpack', time: '' },
          { title: 'S2.E12 - Unmasked', time: '' },
          { title: 'S2.E13 - Just Like Wes / Raxlo to the Rescue', time: '' },
          { title: 'S2.E14 - The Helpful Harvester / Lost Little Droid', time: '' },
          { title: 'S2.E15 - Tenoo\'s Fastest / Home Sweet Temple', time: '' },
          { title: 'S2.E16 - The Firehawk Feud / The Chop Shop Calamity', time: '' },
          { title: 'S2.E17 - Big Pooba Problems / Best Bounty Buddies', time: '' },
          { title: 'S2.E18 - The Rainy Day Beast / Upgraded', time: '' },
          { title: 'S2.E19 - Journey to the Bracca Badlands / The Search for the Missing Dunnels', time: '' },
          { title: 'S2.E20 - The Spaceport Setback / The Mission Mixup', time: '' },
          { title: 'S2.E21 - Yoda Rescue / Fossil Hunt', time: '' },
          { title: 'S2.E22 - A Mission to Remember / The Bounty Hunter and the Thief', time: '' },
          { title: 'S2.E23 - The Battle of Tenoo', time: '' },
          // S3 (7 episodes)
          { title: 'S3.E1 - The New Droid Friends / Batuu Bonanza', time: '' },
          { title: 'S3.E2 - Music Mayhem / The Night Lights of Tenoo', time: '' },
          { title: 'S3.E3 - Journey to the Bottom of Naboo / Speeder Surprise', time: '' },
          { title: 'S3.E4 - Scrapping for a Song / Bell and the Band', time: '' },
          { title: 'S3.E5 - To Do Good / Nubs and the Bumbling Bandits', time: '' },
          { title: 'S3.E6 - Apexx Awakens / Harvester Madness', time: '' },
          { title: 'S3.E7 - Making Friends', time: '' }
        ],
        _watchedArray: Array(55).fill(false)
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
        watched: 8,
        synopsis: '',
        episodeDetails: [
          { title: 'Lost / Found', time: '' },
          { title: 'Revenge / Justice', time: '' },
          { title: 'Destiny', time: '' },
          { title: 'Day', time: '' },
          { title: 'Night', time: '' },
          { title: 'Teach / Corrupt', time: '' },
          { title: 'Choice', time: '' },
          { title: 'The Acolyte', time: '' }
        ],
        _watchedArray: [true, true, true, true, true, true, true, true]
      },
      {
        title: 'Tales of the Jedi',
        year: '68-19 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/tales-of-the-jedi.jpg',
        episodes: 6,
        watched: 3,
        episodeDetails: [
          { title: 'Life and Death', time: '' },
          { title: 'Justice', time: '' },
          { title: 'Choices', time: '' },
          { title: 'The Sith Lord', time: '' },
          { title: 'Practice Makes Perfect', time: '' },
          { title: 'Resolve', time: '' }
        ],
        _watchedArray: [true, true, true, false, false, false]
      },
      {
        title: 'The Phantom Menace',
        year: '32 BBY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/the-phantom-menace-poster.jpg',
        episodes: 1,
        watched: 1,
        synopsis: '',
        episodeDetails: [
          { title: 'Star Wars: Episode I - The Phantom Menace', time: '' }
        ],
        _watchedArray: [true]
      },
      {
        title: 'Attack of the Clones',
        year: '22 BBY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/attack-of-the-clones-poster.jpg',
        episodes: 1,
        watched: 1,
        episodeDetails: [
          { title: 'Star Wars: Episode II - Attack of the Clones', time: '' }
        ],
        _watchedArray: [true]
      },
      {
        title: 'Clone Wars (2003)',
        year: '22-19 BBY',
        type: 'Animated Show (Legends)',
        canon: false,
        poster: './posters/clone-wars-poster.jpg',
        episodes: 50,
        watched: 21,
        episodeDetails: Array.from({length: 50}, (_, i) => ({ title: `Chapter ${i + 1}`, time: '' })),
        _watchedArray: Array.from({length: 50}, (_, i) => i < 21)
      },
      {
        title: 'The Clone Wars',
        year: '22-19 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/the-clone-wars-poster.jpg',
        episodes: 133,
        watched: 98,
        episodeDetails: [
          // S1 (22 episodes, all watched)
          ...Array.from({length: 22}, (_, i) => ({ title: `S1.E${i + 1}`, time: '' })),
          // S2 (22 episodes, all watched)
          ...Array.from({length: 22}, (_, i) => ({ title: `S2.E${i + 1}`, time: '' })),
          // S3 (22 episodes, all watched)
          ...Array.from({length: 22}, (_, i) => ({ title: `S3.E${i + 1}`, time: '' })),
          // S4 (22 episodes, all watched)
          ...Array.from({length: 22}, (_, i) => ({ title: `S4.E${i + 1}`, time: '' })),
          // S5 (20 episodes, first 10 watched)
          ...Array.from({length: 20}, (_, i) => ({ title: `S5.E${i + 1}`, time: '' })),
          // S6 (13 episodes, none watched)
          ...Array.from({length: 13}, (_, i) => ({ title: `S6.E${i + 1}`, time: '' })),
          // S7 (12 episodes, none watched)
          ...Array.from({length: 12}, (_, i) => ({ title: `S7.E${i + 1}`, time: '' }))
        ],
        _watchedArray: [
          ...Array(88).fill(true),  // S1-4 all watched
          ...Array(10).fill(true),  // S5 first 10 watched
          ...Array(10).fill(false), // S5 remaining 10 not watched
          ...Array(13).fill(false), // S6 not watched
          ...Array(12).fill(false)  // S7 not watched
        ]
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
        watched: 0,
        episodeDetails: [
          { title: 'Star Wars: Episode III - Revenge of the Sith', time: '' }
        ],
        _watchedArray: [false]
      },
      {
        title: 'Tales of the Empire',
        year: '20 BBY - 9 ABY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/tales-of-the-empire.jpg',
        episodes: 6,
        watched: 0,
        episodeDetails: [
          { title: 'Ident', time: '' },
          { title: 'The Path', time: '' },
          { title: 'Resolve', time: '' },
          { title: 'The Duel', time: '' },
          { title: 'The Sisters', time: '' },
          { title: 'The Jedi', time: '' }
        ],
        _watchedArray: [false, false, false, false, false, false]
      },
      {
        title: 'Tales of the Underworld',
        year: '62-18 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/tales-of-the-underworld-poster.jpg',
        episodes: 6,
        watched: 3,
        episodeDetails: [
          { title: 'A Way Forward', time: '' },
          { title: 'Friends', time: '' },
          { title: 'One Warrior to Another', time: '' },
          { title: 'The Good Life', time: '' },
          { title: 'A Good Turn', time: '' },
          { title: 'One Good Deed', time: '' }
        ],
        _watchedArray: [false, false, false, true, true, true]
      },
      {
        title: 'The Bad Batch',
        year: '19-18 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/the-bad-batch-poster.jpg',
        episodes: 47,
        watched: 0,
        episodeDetails: [
          ...Array.from({length: 16}, (_, i) => ({ title: `S1.E${i + 1}`, time: '' })),
          ...Array.from({length: 15}, (_, i) => ({ title: `S2.E${i + 1}`, time: '' })),
          ...Array.from({length: 16}, (_, i) => ({ title: `S3.E${i + 1}`, time: '' }))
        ],
        _watchedArray: Array(47).fill(false)
      },
      {
        title: 'Star Wars: Droids',
        year: '15 BBY',
        type: 'Animated Show (Legends)',
        canon: false,
        poster: './posters/droids-poster.jpg',
        episodes: 45,
        watched: 0,
        episodeDetails: Array.from({length: 45}, (_, i) => ({ title: `Episode ${i + 1}`, time: '' })),
        _watchedArray: Array(45).fill(false)
      },
      {
        title: 'Solo: A Star Wars Story',
        year: '10 BBY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/solo-poster.jpg',
        episodes: 1,
        watched: 0,
        episodeDetails: [
          { title: 'Solo: A Star Wars Story', time: '' }
        ],
        _watchedArray: [false]
      },
      {
        title: 'Obi-Wan Kenobi',
        year: '9 BBY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/obi-wan-kenobi-poster.jpg',
        episodes: 6,
        watched: 0,
        episodeDetails: [
          { title: 'E1', time: '' },
          { title: 'E2', time: '' },
          { title: 'E3', time: '' },
          { title: 'E4', time: '' },
          { title: 'E5', time: '' },
          { title: 'E6', time: '' }
        ],
        _watchedArray: [false, false, false, false, false, false]
      },
      {
        title: 'Andor',
        year: '5-1 BBY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/andor-poster.jpg',
        episodes: 24,
        watched: 0,
        episodeDetails: [
          ...Array.from({length: 12}, (_, i) => ({ title: `S1.E${i + 1}`, time: '' })),
          ...Array.from({length: 12}, (_, i) => ({ title: `S2.E${i + 1}`, time: '' }))
        ],
        _watchedArray: Array(24).fill(false)
      },
      {
        title: 'Star Wars Rebels',
        year: '5-1 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/rebels-poster.jpg',
        episodes: 75,
        watched: 0,
        episodeDetails: [
          ...Array.from({length: 16}, (_, i) => ({ title: `S1.E${i + 1}`, time: '' })),
          ...Array.from({length: 22}, (_, i) => ({ title: `S2.E${i + 1}`, time: '' })),
          ...Array.from({length: 22}, (_, i) => ({ title: `S3.E${i + 1}`, time: '' })),
          ...Array.from({length: 15}, (_, i) => ({ title: `S4.E${i + 1}`, time: '' }))
        ],
        _watchedArray: Array(75).fill(false)
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

// saved scroll position while modal is open
let _savedScrollY = 0;

// Render the timeline
function render() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <header class="site-hero">
      <div class="header-container">
        <div class="hero-title">
          <h1><span class="hero-strong">GALACTIC</span> <span class="hero-accent">ARCHIVE</span></h1>
          <p class="hero-sub">A comprehensive chronological guide to the Star Wars universe. Track your progress across the stars.</p>
        </div>
      </div>
    </header>

    <main class="timeline-container">
      <div class="timeline-legend">
        <button class="legend-filter" data-filter="canon" aria-pressed="true">
          <span class="legend-badge canon">Canon</span>
          <span class="legend-label">Official Continuity</span>
        </button>
        <button class="legend-filter" data-filter="legends" aria-pressed="true">
          <span class="legend-badge legends">Legends</span>
          <span class="legend-label">Non-Canon</span>
        </button>
      </div>

      ${TIMELINE_DATA.map((section, idx) => `
        <section class="timeline-section" style="--section-color: ${section.color}">
          <h2>${section.era}</h2>
          <div class="entries-grid">
            ${section.entries.map((entry, entryIdx) => {
              const progress = entry.episodes > 0 ? Math.round((entry.watched / entry.episodes) * 100) : 0;
              const isMovie = /film/i.test(entry.type) && entry.episodes === 1;
              return `
                <div class="entry-card" data-canon="${entry.canon}" data-section="${idx}" data-entry="${entryIdx}">
                  <div class="entry-poster">
                    <img src="${entry.poster}" alt="${entry.title}" />
                    <span class="entry-badge ${entry.canon ? 'canon' : 'legends'}">
                      ${entry.canon ? 'Canon' : 'Legends'}
                    </span>
                    <div class="entry-overlay">
                      <div class="progress-ring">
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" />
                          <circle class="progress-circle" cx="50" cy="50" r="45" fill="none" stroke="var(--section-color)" stroke-width="3" 
                                  stroke-dasharray="${progress * 2.827}" stroke-dashoffset="0" 
                                  style="transition: stroke-dasharray 0.3s ease;" />
                        </svg>
                        <span class="progress-text">${progress}%</span>
                      </div>
                      <button class="lore-btn">LORE INTEL</button>
                    </div>
                  </div>
                  <div class="entry-content">
                    <h3>${entry.title}</h3>
                    <p class="entry-meta">${entry.year} • ${entry.type}</p>
                    <div class="entry-row">
                      <p class="entry-episodes">${entry.watched}/${entry.episodes} watched</p>
                      ${isMovie ? `<label class="card-checkbox-inline" title="Mark as watched"><input type="checkbox" class="card-movie-checkbox" data-section="${idx}" data-entry="${entryIdx}" /><span class="card-checkbox-box"></span></label>` : ''}
                    </div>
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
  attachLegendHandlers();
  attachEntryHandlers();
}

// Legend filter handlers
function attachLegendHandlers() {
  document.querySelectorAll('.legend-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!pressed));
      updateFilters();
    });
  });
  // initial filter pass
  updateFilters();
}

function updateFilters() {
  const canonOn = document.querySelector('.legend-filter[data-filter="canon"]').getAttribute('aria-pressed') === 'true';
  const legendsOn = document.querySelector('.legend-filter[data-filter="legends"]').getAttribute('aria-pressed') === 'true';
  document.querySelectorAll('.entry-card').forEach(card => {
    const isCanon = String(card.dataset.canon) === 'true';
    if ((isCanon && canonOn) || (!isCanon && legendsOn)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
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

    // movie checkbox handling: stop propagation on input and label, and update watched state
    const cb = card.querySelector('.card-movie-checkbox');
    if (cb) {
      cb.addEventListener('click', (ev) => ev.stopPropagation());
      const label = card.querySelector('.card-checkbox-inline');
      if (label) label.addEventListener('click', (ev) => ev.stopPropagation());
      cb.addEventListener('change', () => {
        const s = Number(cb.dataset.section);
        const e = Number(cb.dataset.entry);
        const entry = TIMELINE_DATA[s].entries[e];
        entry._watchedArray = entry._watchedArray || new Array(entry.episodes).fill(false);
        entry._watchedArray[0] = cb.checked;
        saveWatchedState(entry);
        updateEntryUI(s, e);
      });
    }
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
  const movieCheckbox = card.querySelector('.card-movie-checkbox');
  if (movieCheckbox) {
    movieCheckbox.checked = Array.isArray(entry._watchedArray) ? Boolean(entry._watchedArray[0]) : Boolean(entry.watched);
  }
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
          <span class="episode-title">${(entry.episodeDetails && entry.episodeDetails[i] && entry.episodeDetails[i].title) || ''}</span>
        </label>
      </div>
    `;
  }

  const synopsis = entry.synopsis || '';
  const showEpisodes = entry.episodes > 1; // Only show episodes for series/shows

  const modalHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-content">
      <button class="modal-close" aria-label="Close">×</button>
      <div class="modal-left"><img src="${entry.poster}" alt="${entry.title}"/></div>
      <div class="modal-right">
        <h2>${entry.title}</h2>
        <p class="entry-meta">${entry.year} • ${entry.type}</p>
        ${synopsis ? `<p class="modal-synopsis">${synopsis}</p>` : ''}
        ${showEpisodes ? `<div class="episode-list">${episodesHTML}</div>` : ''}
        <button class="modal-close-btn">Close Archive</button>
      </div>
    </div>
  `;
  
  modal.innerHTML = modalHTML;
  modal.classList.remove('hidden');

  // lock background scrolling: save scroll position and fix body
  _savedScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.style.top = `-${_savedScrollY}px`;
  document.body.classList.add('modal-open');

  modal.querySelector('.modal-close').addEventListener('click', () => closeModal());
  modal.querySelector('.modal-close-btn').addEventListener('click', () => closeModal());
  modal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal());

  // Handle checkboxes for series/shows
  const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const idx = Number(cb.dataset.ep);
      entry._watchedArray[idx] = cb.checked;
      saveWatchedState(entry);
      updateEntryUI(sectionIdx, entryIdx);
    });
  });
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  // remove scroll lock and restore scroll position after modal fade
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  setTimeout(() => {
    modal.innerHTML = '';
    // restore previous scroll position
    window.scrollTo(0, _savedScrollY || 0);
    _savedScrollY = 0;
  }, 300);
}

// Set CSS viewport height variable for mobile (fixes 100vh issues on iOS)
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setVh);
window.addEventListener('orientationchange', setVh);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  setVh();
  render();
});
