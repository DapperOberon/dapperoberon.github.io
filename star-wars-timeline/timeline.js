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
    color: '#D4A574',
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
let _currentModalSection = null;
let _currentModalEntry = null;

// Filter state
let filters = {
  canon: true,
  legends: true,
  search: '',
  type: 'all', // 'all', 'films', 'shows'
  progress: 'all' // 'all', 'not-started', 'in-progress', 'completed'
};

// Calculate statistics
function calculateStats() {
  let totalEpisodes = 0;
  let watchedEpisodes = 0;
  let completedShows = 0;
  let totalShows = 0;

  TIMELINE_DATA.forEach(section => {
    section.entries.forEach(entry => {
      totalEpisodes += entry.episodes;
      watchedEpisodes += entry.watched;
      totalShows++;
      if (entry.watched === entry.episodes && entry.episodes > 0) {
        completedShows++;
      }
    });
  });

  const overallProgress = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

  return {
    overallProgress,
    watchedEpisodes,
    completedShows,
    totalShows,
    totalEpisodes
  };
}

// Render the timeline
function render() {
  const app = document.getElementById('app');
  const stats = calculateStats();
  
  app.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <header class="site-hero">
      <div class="header-container">
        <div class="hero-title">
          <h1><span class="hero-strong">GALACTIC</span> <span class="hero-accent">ARCHIVE</span></h1>
          <p class="hero-sub">A comprehensive chronological guide to the Star Wars universe. Track your progress across the stars.</p>
        </div>
      </div>
      
      <!-- Statistics Section -->
      <div class="stats-container">
        <div class="stat-box">
          <div class="stat-value">${stats.overallProgress}%</div>
          <div class="stat-label">OVERALL PROGRESS</div>
          <div class="stat-progress">
            <div class="stat-progress-bar" style="width: ${stats.overallProgress}%"></div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${stats.watchedEpisodes}</div>
          <div class="stat-label">EPISODES WATCHED</div>
          <div class="stat-progress">
            <div class="stat-progress-bar" style="width: ${(stats.watchedEpisodes / stats.totalEpisodes * 100)}%"></div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${stats.completedShows}/${stats.totalShows}</div>
          <div class="stat-label">COMPLETED SHOWS</div>
          <div class="stat-progress">
            <div class="stat-progress-bar" style="width: ${(stats.completedShows / stats.totalShows * 100)}%"></div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${stats.totalEpisodes}</div>
          <div class="stat-label">TOTAL EPISODES</div>
        </div>
      </div>
      
      <!-- Search and Filters -->
      <div class="filters-container">
        <div class="search-wrapper">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input type="text" id="search-input" class="search-input" placeholder="Search by title, year, or type..." />
        </div>
        
        <div class="filter-group">
          <button class="filter-btn active" data-canon-filter="all">All</button>
          <button class="filter-btn" data-canon-filter="canon">Canon</button>
          <button class="filter-btn" data-canon-filter="legends">Legends</button>
        </div>
        
        <div class="filter-group">
          <button class="filter-btn active" data-type-filter="all">All Types</button>
          <button class="filter-btn" data-type-filter="films">Films</button>
          <button class="filter-btn" data-type-filter="shows">Shows</button>
        </div>
      </div>
      
      <div class="progress-filters">
        <button class="progress-filter-btn active" data-progress-filter="all">All Progress</button>
        <button class="progress-filter-btn" data-progress-filter="not-started">Not Started</button>
        <button class="progress-filter-btn" data-progress-filter="in-progress">In Progress</button>
        <button class="progress-filter-btn" data-progress-filter="completed">Completed</button>
      </div>
      
      <!-- Legend -->
      <div class="timeline-legend">
        <div class="legend-item">
          <span class="legend-badge canon">CANON</span>
          <span class="legend-text">Official Continuity</span>
        </div>
        <div class="legend-item">
          <span class="legend-badge legends">LEGENDS</span>
          <span class="legend-text">Non-Canon</span>
        </div>
      </div>
    </header>

    <main class="timeline-container" id="main-content" tabindex="-1">
      <div id="no-results" style="display: none; text-align: center; padding: 2rem; color: var(--text-secondary); grid-column: 1 / -1;">
        <p>No entries match the selected filters.</p>
      </div>

      ${TIMELINE_DATA.map((section, idx) => {
        const itemCount = section.entries.length;
        const itemLabel = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
        return `
        <section class="timeline-section" style="--section-color: ${section.color}">
          <h2>${section.era} <span class="era-count">${itemLabel}</span></h2>
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
                                stroke-dasharray="${progress * 2.827}, 282.7" stroke-dashoffset="0" 
                                  style="transition: stroke-dasharray 0.3s ease;" />
                        </svg>
                        <span class="progress-text">${progress}%</span>
                      </div>
                      <p class="lore-label">Click to view details</p>
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
      `;
      }).join('')}
    </main>

    <footer>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <p>© 2026 DapperOberon. Star Wars is a trademark of Lucasfilm Ltd.</p>
        <button id="reset-progress-btn" title="Reset all watched progress">Reset Progress</button>
      </div>
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
  attachFilterHandlers();
  attachEntryHandlers();
  attachResetButton();
}

// Filter handlers
function attachFilterHandlers() {
  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filters.search = e.target.value.toLowerCase();
      updateFilters();
    });
  }
  
  // Canon/Legends filters
  document.querySelectorAll('[data-canon-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-canon-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.canonFilter;
      if (filter === 'all') {
        filters.canon = true;
        filters.legends = true;
      } else if (filter === 'canon') {
        filters.canon = true;
        filters.legends = false;
      } else if (filter === 'legends') {
        filters.canon = false;
        filters.legends = true;
      }
      updateFilters();
    });
  });
  
  // Type filters
  document.querySelectorAll('[data-type-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-type-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filters.type = btn.dataset.typeFilter;
      updateFilters();
    });
  });
  
  // Progress filters
  document.querySelectorAll('[data-progress-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-progress-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filters.progress = btn.dataset.progressFilter;
      updateFilters();
    });
  });
  
  // initial filter pass
  updateFilters();
}

function updateFilters() {
  let visibleCount = 0;
  
  document.querySelectorAll('.entry-card').forEach(card => {
    const sectionIdx = parseInt(card.dataset.section);
    const entryIdx = parseInt(card.dataset.entry);
    const entry = TIMELINE_DATA[sectionIdx].entries[entryIdx];
    const isCanon = card.dataset.canon === 'true';
    
    // Canon/Legends filter
    let canonMatch = false;
    if (filters.canon && filters.legends) {
      canonMatch = true;
    } else if (filters.canon && isCanon) {
      canonMatch = true;
    } else if (filters.legends && !isCanon) {
      canonMatch = true;
    }
    
    // Search filter
    const searchText = filters.search;
    const searchMatch = !searchText || 
      entry.title.toLowerCase().includes(searchText) ||
      entry.year.toLowerCase().includes(searchText) ||
      entry.type.toLowerCase().includes(searchText);
    
    // Type filter
    let typeMatch = true;
    if (filters.type === 'films') {
      typeMatch = entry.type.toLowerCase().includes('film');
    } else if (filters.type === 'shows') {
      typeMatch = entry.type.toLowerCase().includes('show');
    }
    
    // Progress filter
    let progressMatch = true;
    if (filters.progress === 'not-started') {
      progressMatch = entry.watched === 0;
    } else if (filters.progress === 'in-progress') {
      progressMatch = entry.watched > 0 && entry.watched < entry.episodes;
    } else if (filters.progress === 'completed') {
      progressMatch = entry.watched === entry.episodes && entry.episodes > 0;
    }
    
    if (canonMatch && searchMatch && typeMatch && progressMatch) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  // Hide sections with no visible entries
  document.querySelectorAll('.timeline-section').forEach(section => {
    const visibleCards = section.querySelectorAll('.entry-card:not([style*="display: none"])').length;
    section.style.display = visibleCards === 0 ? 'none' : '';
  });
  
  const noResults = document.getElementById('no-results');
  if (noResults) {
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }
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

function attachResetButton() {
  const resetBtn = document.getElementById('reset-progress-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure? This will reset all watched progress. This cannot be undone.')) {
        TIMELINE_DATA.forEach(section => {
          section.entries.forEach(entry => {
            entry._watchedArray = new Array(entry.episodes).fill(false);
            entry.watched = 0;
            const key = 'watched_' + entry.title.replace(/\s+/g, '_');
            try { localStorage.removeItem(key); } catch (e) {}
            const sectionIdx = TIMELINE_DATA.indexOf(section);
            const entryIdx = section.entries.indexOf(entry);
            updateEntryUI(sectionIdx, entryIdx);
          });
        });
      }
    });
  }
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
  const progressCircle = card.querySelector('.progress-circle'); if (progressCircle) progressCircle.setAttribute('stroke-dasharray', `${progress * 2.827}, 282.7`);
  const episodesText = card.querySelector('.entry-episodes'); if (episodesText) episodesText.textContent = `${watchedCount}/${entry.episodes} watched`;
  const movieCheckbox = card.querySelector('.card-movie-checkbox');
  if (movieCheckbox) {
    movieCheckbox.checked = Array.isArray(entry._watchedArray) ? Boolean(entry._watchedArray[0]) : Boolean(entry.watched);
  }
  
  // Update stats in header
  updateStats();
}

function updateStats() {
  const stats = calculateStats();
  const statBoxes = document.querySelectorAll('.stat-box');
  if (statBoxes[0]) {
    statBoxes[0].querySelector('.stat-value').textContent = `${stats.overallProgress}%`;
    const progressBar = statBoxes[0].querySelector('.stat-progress-bar');
    if (progressBar) progressBar.style.width = `${stats.overallProgress}%`;
  }
  if (statBoxes[1]) {
    statBoxes[1].querySelector('.stat-value').textContent = stats.watchedEpisodes;
    const progressBar = statBoxes[1].querySelector('.stat-progress-bar');
    if (progressBar) progressBar.style.width = `${(stats.watchedEpisodes / stats.totalEpisodes * 100)}%`;
  }
  if (statBoxes[2]) {
    statBoxes[2].querySelector('.stat-value').textContent = `${stats.completedShows}/${stats.totalShows}`;
    const progressBar = statBoxes[2].querySelector('.stat-progress-bar');
    if (progressBar) progressBar.style.width = `${(stats.completedShows / stats.totalShows * 100)}%`;
  }
}

function openModal(sectionIdx, entryIdx) {
  // store indices for closeModal to use
  _currentModalSection = sectionIdx;
  _currentModalEntry = entryIdx;
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
  const progressPercent = entry.episodes > 0 ? Math.round((watchedCount / entry.episodes) * 100) : 0;
  const episodeCountText = showEpisodes ? `${watchedCount}/${entry.episodes} watched (${progressPercent}%)` : '';

  const modalHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-content">
      <button class="modal-close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="modal-left"><img src="${entry.poster}" alt="${entry.title}"/></div>
      <div class="modal-right">
        <h2>${entry.title}</h2>
        <div class="modal-meta">
          <span class="modal-meta-text">${entry.year} • ${entry.type}</span>
          <span class="modal-badge ${entry.canon ? 'canon' : 'legends'}">${entry.canon ? 'CANON' : 'LEGENDS'}</span>
        </div>
        ${synopsis ? `<p class="modal-synopsis">${synopsis}</p>` : ''}
        ${showEpisodes ? `
          <div class="modal-episodes">
            <div class="modal-episodes-header">
              <span class="modal-episodes-title">Episodes</span>
              <span id="modal-episode-count" class="modal-episodes-count">${episodeCountText}</span>
            </div>
            <div class="episode-list-wrapper"><div class="episode-list">${episodesHTML}</div></div>
          </div>
        ` : ''}
        <div class="modal-actions">
          ${showEpisodes ? `<button class="modal-primary-btn" id="mark-all-watched">Mark All Watched</button>` : ''}
          <button class="modal-close-btn">Close</button>
        </div>
      </div>
    </div>
  `;
  
  modal.innerHTML = modalHTML;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');

  // lock background scrolling: save scroll position and fix body
  _savedScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.style.top = `-${_savedScrollY}px`;
  document.body.classList.add('modal-open');

  modal.querySelector('.modal-close').addEventListener('click', () => closeModal());
  modal.querySelector('.modal-close-btn').addEventListener('click', () => closeModal());
  modal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal());

  const updateModalCount = () => {
    const updatedCount = entry._watchedArray.filter(Boolean).length;
    const percent = entry.episodes > 0 ? Math.round((updatedCount / entry.episodes) * 100) : 0;
    const countEl = modal.querySelector('#modal-episode-count');
    if (countEl) {
      countEl.textContent = `${updatedCount}/${entry.episodes} watched (${percent}%)`;
    }
    
    // Update button text based on state
    const markAllBtn = modal.querySelector('#mark-all-watched');
    if (markAllBtn) {
      const allChecked = entry._watchedArray.every(Boolean);
      markAllBtn.textContent = allChecked ? 'Unmark All' : 'Mark All Watched';
    }
  };

  const markAllBtn = modal.querySelector('#mark-all-watched');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      const allChecked = entry._watchedArray.every(Boolean);
      const newState = !allChecked;
      
      entry._watchedArray = new Array(entry.episodes).fill(newState);
      modal.querySelectorAll('.episode-item input[type="checkbox"]').forEach((cb, idx) => {
        cb.checked = newState;
        entry._watchedArray[idx] = newState;
      });
      saveWatchedState(entry);
      updateEntryUI(sectionIdx, entryIdx);
      updateModalCount();
    });
    
    // Set initial button text
    updateModalCount();
  }

  // Handle checkboxes for series/shows
  const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const idx = Number(cb.dataset.ep);
      entry._watchedArray[idx] = cb.checked;
      saveWatchedState(entry);
      updateEntryUI(sectionIdx, entryIdx);
      // Update the modal episode count
      updateModalCount();
    });
  });
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (!modal || modal.classList.contains('hidden')) return;
  
  const scrollY = _savedScrollY || 0;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollY);
  _savedScrollY = 0;
  
  // update card UI to reflect any watched changes
  if (_currentModalSection !== null && _currentModalEntry !== null) {
    updateEntryUI(_currentModalSection, _currentModalEntry);
  }
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
