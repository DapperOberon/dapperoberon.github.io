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
        releaseYear: '2023-2025',
        seasons: 3,
        synopsis: 'The young Jedi take on new missions across the galaxy as they try to stop the rise of the pirates!',
        episodeDetails: [
          // S1 (25 episodes)
          { title: 'S1.E1 - The Young Jedi / Yoda\'s Mission', time: '232 BBY' },
          { title: 'S1.E2 - Nash\'s Race Day / The Lost Jedi Ship', time: '232 BBY' },
          { title: 'S1.E3 - Get Well Nubs / The Junk Giant', time: '232 BBY' },
          { title: 'S1.E4 - Lys and the Snowy Mountain Rescue / Attack of the Training Droids', time: '232 BBY' },
          { title: 'S1.E5 - The Jellyfruit Pursuit / Creature Safari', time: '232 BBY' },
          { title: 'S1.E6 - Squadron / Forest Defenders', time: '232 BBY' },
          { title: 'S1.E7 - The Jedi and the Thief / The Missing Kibbin', time: '232 BBY' },
          { title: 'S1.E8 - The Girl and her Gargantua / The Show Must Go On', time: '232 BBY' },
          { title: 'S1.E9 - The Princess and the Jedi / Kai\'s Bad Day', time: '232 BBY' },
          { title: 'S1.E10 - Visitor\'s Day / The Growing Green Danger', time: '232 BBY' },
          { title: 'S1.E11 - The Ganguls / Bad Egg', time: '232 BBY' },
          { title: 'S1.E12 - Off the Rails / The Thieves of Tharnaka', time: '232 BBY' },
          { title: 'S1.E13 - Tree Troubles / Big Brother\'s Bounty', time: '232 BBY' },
          { title: 'S1.E14 - Charhound Chase / Creature Comforts', time: '232 BBY' },
          { title: 'S1.E15 - An Adventure with Yoda / The Talon Takeover', time: '232 BBY' },
          { title: 'S1.E16 - Mystery of the Opal Cave / Clash', time: '232 BBY' },
          { title: 'S1.E17 - Stuck in the Muck / Junkyard Sleepover', time: '232 BBY' },
          { title: 'S1.E18 - The Great Leaf Glide / The Harvest Feast', time: '232 BBY' },
          { title: 'S1.E19 - Life Day / Raxlo Strikes Back', time: '232 BBY' },
          { title: 'S1.E20 - Aftershock / Feather Frenzy', time: '232 BBY' },
          { title: 'S1.E21 - Best Friends / Happy Trails, Nubs', time: '232 BBY' },
          { title: 'S1.E22 - The Tale of Short Spire / The Team Up', time: '232 BBY' },
          { title: 'S1.E23 - The Caves of Batuu / Finders Keepers', time: '232 BBY' },
          { title: 'S1.E24 - The Starship Show / Nash\'s Super Busy Day', time: '232 BBY' },
          { title: 'S1.E25 - The Prince and the Pirate', time: '232 BBY' },
          // S2 (23 episodes)
          { title: 'S2.E1 - Heroes and Hotshots / A Jedi or a Pirate', time: '232 BBY' },
          { title: 'S2.E2 - The Rustler Roundup / A New Discovery', time: '232 BBY' },
          { title: 'S2.E3 - A Pirate\'s Pet / The Secret Ship', time: '232 BBY' },
          { title: 'S2.E4 - Nub\'s Big Mistake / The Jedi Rescue', time: '232 BBY' },
          { title: 'S2.E5 - Terror of Tenoo / The Prince of Masks', time: '232 BBY' },
          { title: 'S2.E6 - Battle for the Band / Uprooted', time: '232 BBY' },
          { title: 'S2.E7 - Mine and Ours / The Andraven Circuit', time: '232 BBY' },
          { title: 'S2.E8 - The Great Gomgourd Quest / A Sticy Situation', time: '232 BBY' },
          { title: 'S2.E9 - The Missing Life Day Feast / The Lost Treasure of Tenoo', time: '232 BBY' },
          { title: 'S2.E10 - The Wild Aklyrr / Lys\' Lost Lightsaber', time: '232 BBY' },
          { title: 'S2.E11 - Tower Run / The Jumping Jetpack', time: '232 BBY' },
          { title: 'S2.E12 - Unmasked', time: '232 BBY' },
          { title: 'S2.E13 - Just Like Wes / Raxlo to the Rescue', time: '232 BBY' },
          { title: 'S2.E14 - The Helpful Harvester / Lost Little Droid', time: '232 BBY' },
          { title: 'S2.E15 - Tenoo\'s Fastest / Home Sweet Temple', time: '232 BBY' },
          { title: 'S2.E16 - The Firehawk Feud / The Chop Shop Calamity', time: '232 BBY' },
          { title: 'S2.E17 - Big Pooba Problems / Best Bounty Buddies', time: '232 BBY' },
          { title: 'S2.E18 - The Rainy Day Beast / Upgraded', time: '232 BBY' },
          { title: 'S2.E19 - Journey to the Bracca Badlands / The Search for the Missing Dunnels', time: '232 BBY' },
          { title: 'S2.E20 - The Spaceport Setback / The Mission Mixup', time: '232 BBY' },
          { title: 'S2.E21 - Yoda Rescue / Fossil Hunt', time: '232 BBY' },
          { title: 'S2.E22 - A Mission to Remember / The Bounty Hunter and the Thief', time: '232 BBY' },
          { title: 'S2.E23 - The Battle of Tenoo', time: '232 BBY' },
          // S3 (7 episodes)
          { title: 'S3.E1 - The New Droid Friends / Batuu Bonanza', time: '232 BBY' },
          { title: 'S3.E2 - Music Mayhem / The Night Lights of Tenoo', time: '232 BBY' },
          { title: 'S3.E3 - Journey to the Bottom of Naboo / Speeder Surprise', time: '232 BBY' },
          { title: 'S3.E4 - Scrapping for a Song / Bell and the Band', time: '232 BBY' },
          { title: 'S3.E5 - To Do Good / Nubs and the Bumbling Bandits', time: '232 BBY' },
          { title: 'S3.E6 - Apexx Awakens / Harvester Madness', time: '232 BBY' },
          { title: 'S3.E7 - Making Friends', time: '232 BBY' }
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
        releaseYear: '2024-2024',
        seasons: 1,
        synopsis: 'An investigation into a crime spree pits a Jedi Master against a dangerous warrior from his past.',
        episodeDetails: [
          { title: 'S1.E1 - Lost / Found', time: '132 BBY' },
          { title: 'S1.E2 - Revenge / Justice', time: '132 BBY' },
          { title: 'S1.E3 - Destiny', time: '132 BBY' },
          { title: 'S1.E4 - Day', time: '132 BBY' },
          { title: 'S1.E5 - Night', time: '132 BBY' },
          { title: 'S1.E6 - Teach / Corrupt', time: '132 BBY' },
          { title: 'S1.E7 - Choice', time: '132 BBY' },
          { title: 'S1.E8 - The Acolyte', time: '132 BBY' }
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
        releaseYear: '2022-2022',
        seasons: 1,
        synopsis: 'Tales built around Jedi from the prequel era will feature Ahsoka Tano, Count Dooku, and others.',
        episodeDetails: [
          { title: 'Life and Death', time: '36-35 BBY' },
          { title: 'Justice', time: 'between 68 and 68 BBY' },
          { title: 'Choices', time: 'between 50 and 42 BBY' },
          { title: 'The Sith Lord', time: '32 BBY' },
          { title: 'Practice Makes Perfect', time: 'between 21 and 19 BBY (the ending takes place parallel to The Clone Wars S7E12).' },
          { title: 'Resolve', time: 'between 18 and 5 BBY (the beginning takes place parallel to Revenge of the Sith in 19 BBY)' }
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
        releaseYear: '1999',
        synopsis: 'Jedi discover Anakin Skywalker, a boy unusually strong in the force.',
        episodeDetails: [
          { title: 'Star Wars: Episode I - The Phantom Menace', time: '32 BBY' }
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
        releaseYear: '2002',
        synopsis: 'Young Anakin and Padmé fall in love as galactic war looms.',
        episodeDetails: [
          { title: 'Star Wars: Episode II - Attack of the Clones', time: '22 BBY' }
        ],
        _watchedArray: [true]
      },
      {
        title: 'Clone Wars',
        year: '22-19 BBY',
        type: 'Animated Show',
        canon: false,
        poster: './posters/clone-wars-poster.jpg',
        episodes: 25,
        watched: 21,
        releaseYear: '2003-2005',
        seasons: 2,
        synopsis: 'Enjoy this thrilling, Emmy® Award-winning animated series that continues the Star Wars story.',
        episodeDetails: [
          { title: 'Volume 1 Chapter 6', time: '22 BBY (Disney+ S1.E1 at 16:24-19:43)' },
          { title: 'Volume 1 Chapter 7', time: '22 BBY (Disney+ S1.E1 at 19:44-22:58)' },
          { title: 'Volume 1 Chapter 1', time: '22 BBY (Disney+ S1.E1 at 00:00-03:30)' },
          { title: 'Volume 1 Chapter 2', time: '22 BBY (Disney+ S1.E1 at 03:31-06:40)' },
          { title: 'Volume 1 Chapter 3', time: '22 BBY (Disney+ S1.E1 at 06:41-09:58)' },
          { title: 'Volume 1 Chapter 4', time: '22 BBY (Disney+ S1.E1 at 13:07-16:23)' },
          { title: 'Volume 1 Chapter 12', time: '22 BBY (Disney+ S1.E1 at 35:45-38:57)' },
          { title: 'Volume 1 Chapter 13', time: '22 BBY (Disney+ S1.E1 at 38:58-42:07)' },
          { title: 'Volume 1 Chapter 14', time: '22 BBY (Disney+ S1.E1 at 42:08-46:27)' },
          { title: 'Volume 1 Chapter 15', time: '22 BBY (Disney+ S1.E1 at 46:28-48:50)' },
          { title: 'Volume 1 Chapter 16', time: '22 BBY (Disney+ S1.E1 at 48:51-52:07)' },
          { title: 'Volume 1 Chapter 5', time: '22 BBY (Disney+ S1.E1 at 09:59-13:06)' },
          { title: 'Volume 1 Chapter 8', time: '22 BBY (Disney+ S1.E1 at 22:59-25:59)' },
          { title: 'Volume 1 Chapter 9', time: '22 BBY (Disney+ S1.E1 at 26:00-29:06)' },
          { title: 'Volume 1 Chapter 10', time: '22 BBY (Disney+ S1.E1 at 29:07-32:22)' },
          { title: 'Volume 1 Chapter 11', time: '22 BBY (Disney+ S1.E1 at 32:23-38:56)' },
          { title: 'Volume 1 Chapter 17', time: '22 BBY (Disney+ S1.E1 at 52:08-55:20)' },
          { title: 'Volume 1 Chapter 18', time: '22 BBY (Disney+ S1.E1 at 55:21-58:29)' },
          { title: 'Volume 1 Chapter 19', time: '22 BBY (Disney+ S1.E1 at 58:30-1:01:30)' },
          { title: 'Volume 1 Chapter 20', time: '22 BBY (Disney+ S1.E1 at 1:01:31-end)' },
          { title: 'Volume 2 Chapter 21', time: '22 BBY (Disney+ S1.E2 at 00:00-12:47)' },
          { title: 'Volume 2 Chapter 22', time: '19 BBY (Disney+ S1.E2 at 12:48-15:25)' },
          { title: 'Volume 2 Chapter 23', time: '19 BBY (Disney+ S1.E2 at 15:26-33:20)' },
          { title: 'Volume 2 Chapter 24', time: '19 BBY (Disney+ S1.E2 at 33:21-50:00)' },
          { title: 'Volume 2 Chapter 25', time: '19 BBY (Disney+ S1.E2 at 50:00-end, Legends version of the events leading into Star Wars Ep. 3)' }
        ],
        _watchedArray: [...Array(21).fill(true), ...Array(4).fill(false)]
      },
      {
        title: 'The Clone Wars',
        year: '22-19 BBY',
        type: 'Animated Show',
        canon: true,
        poster: './posters/the-clone-wars-poster.jpg',
        episodes: 133,
        watched: 98,
        releaseYear: '2008-2020',
        seasons: 7,
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
      },
      {
        title: 'The Clone Wars',
        year: '22 BBY',
        type: 'Animated Film',
        canon: true,
        poster: './posters/the-clone-wars-film-poster.jpg',
        episodes: 1,
        watched: 1,
        releaseYear: '2008',
        episodeDetails: [
          { title: 'The Clone Wars', time: '22 BBY' }
        ],
        _watchedArray: [true]
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
        releaseYear: '2005',
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
        releaseYear: '2024-2024',
        seasons: 1,
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
        releaseYear: '2025-2025',
        seasons: 1,
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
        releaseYear: '2021-2024',
        seasons: 3,
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
        type: 'Animated Show',
        canon: false,
        poster: './posters/droids-poster.jpg',
        episodes: 45,
        watched: 0,
        releaseYear: '1985-1986',
        seasons: 1,
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
        releaseYear: '2018',
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
        releaseYear: '2022-2022',
        seasons: 1,
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
        releaseYear: '2022-2025',
        seasons: 2,
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
        releaseYear: '2014-2018',
        seasons: 4,
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
        watched: 0,
        releaseYear: '2016'
      },
      {
        title: 'A New Hope',
        year: '0 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/a-new-hope-poster.jpg',
        episodes: 1,
        watched: 0,
        releaseYear: '1977'
      },
      {
        title: 'The Star Wars Holiday Special',
        year: '1 ABY',
        type: 'Live Action TV Film',
        canon: false,
        poster: './posters/holiday-special-poster.jpg',
        episodes: 1,
        watched: 0,
        releaseYear: '1978'
      },
      {
        title: 'The Empire Strikes Back',
        year: '3 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/the-empire-strikes-back-poster.jpg',
        episodes: 1,
        watched: 0,
        releaseYear: '1980'
      },
      {
        title: 'Ewoks',
        year: '3 ABY',
        type: 'Animated Show',
        canon: false,
        poster: './posters/ewoks-poster.jpg',
        episodes: 35,
        watched: 0,
        releaseYear: '1985-1986',
        seasons: 2,
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
        type: 'Live Action TV Film',
        canon: false,
        poster: './posters/caravan-of-courage-poster.jpg',
        episodes: 1,
        watched: 0,
        releaseYear: '1984',
        episodeDetails: [ { title: 'Caravan of Courage: An Ewok Adventure', time: '' } ]
      },
      {
        title: 'Ewoks: The Battle for Endor',
        year: '3 ABY',
        type: 'Live Action TV Film',
        canon: false,
        poster: './posters/ewoks-battle-for-endor-poster.jpg',
        episodes: 1,
        watched: 0,
        releaseYear: '1985',
        episodeDetails: [ { title: 'Ewoks: The Battle for Endor', time: '' } ]
      },
      {
        title: 'Return of the Jedi',
        year: '4 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/return-of-the-jedi-poster.jpg',
        episodes: 1,
        watched: 0,
        releaseYear: '1983'
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
        watched: 0,
        releaseYear: '2019-2023',
        seasons: 3
      },
      {
        title: 'The Book of Boba Fett',
        year: '9 ABY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/the-book-of-boba-fett-poster.jpg',
        episodes: 7,
        watched: 0,
        releaseYear: '2021-2021',
        seasons: 1
      },
      {
        title: 'Ahsoka',
        year: '9 ABY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/ahsoka-poster.jpg',
        episodes: 8,
        watched: 0,
        releaseYear: '2023-2023',
        seasons: 1
      },
      {
        title: 'Skeleton Crew',
        year: '9 ABY',
        type: 'Live Action Show',
        canon: true,
        poster: './posters/skeleton-crew-poster.jpg',
        episodes: 8,
        watched: 0,
        releaseYear: '2024-2025',
        seasons: 1
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
        watched: 0,
        releaseYear: '2018-2020',
        seasons: 2
      },
      {
        title: 'The Force Awakens',
        year: '34 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/the-force-awakens-poster.jpg',
        episodes: 1,
        watched: 0,
        releaseYear: '2015'
      },
      {
        title: 'The Last Jedi',
        year: '34 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/the-last-jedi-poster.jpg',
        episodes: 1,
        watched: 0,
        releaseYear: '2017'
      },
      {
        title: 'The Rise of Skywalker',
        year: '35 ABY',
        type: 'Live Action Film',
        canon: true,
        poster: './posters/rise-of-skywalker-poster.jpg',
        episodes: 1,
        watched: 0,
        releaseYear: '2019'
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
        watched: 0,
        releaseYear: '2021-2025',
        seasons: 3
      }
    ]
  }
];

function isShowEntry(entry) {
  return /show|anthology/i.test(entry.type) && entry.episodes > 1;
}

function getEntryMetaText(entry) {
  const parts = [`${entry.year}`, entry.type];

  if (entry.releaseYear) {
    let releaseYearText = entry.releaseYear;
    if (isShowEntry(entry) && entry.seasons === 1) {
      const yearRangeMatch = String(entry.releaseYear).match(/^(\d{4})\s*-\s*(\d{4})$/);
      if (yearRangeMatch && yearRangeMatch[1] === yearRangeMatch[2]) {
        releaseYearText = yearRangeMatch[1];
      }
    }
    parts.push(releaseYearText);
  }

  if (isShowEntry(entry) && typeof entry.seasons === 'number') {
    parts.push(`${entry.seasons} Season${entry.seasons === 1 ? '' : 's'}`);
  }

  return parts.join(' • ');
}

function getEntrySearchText(entry) {
  const episodeTitles = Array.isArray(entry.episodeDetails)
    ? entry.episodeDetails.map(ep => ep && ep.title ? ep.title : '').join(' ')
    : '';

  const searchParts = [
    entry.title,
    entry.year,
    entry.type,
    entry.synopsis || '',
    String(entry.episodes),
    String(entry.watched),
    entry.canon ? 'canon official continuity' : 'legends non canon',
    entry.releaseYear || '',
    typeof entry.seasons === 'number' ? `${entry.seasons} season ${entry.seasons} seasons` : '',
    getEntryMetaText(entry),
    episodeTitles
  ];

  return searchParts.join(' ').toLowerCase();
}

function getLegacyWatchedStorageKey(entry) {
  return 'watched_' + entry.title.replace(/\s+/g, '_');
}

function getEntryStorageId(entry) {
  if (entry && entry.id) {
    return String(entry.id);
  }

  const firstEpisodeTitle = Array.isArray(entry.episodeDetails) && entry.episodeDetails.length > 0 && entry.episodeDetails[0].title
    ? entry.episodeDetails[0].title
    : '';

  const fingerprint = [
    entry.title || '',
    entry.year || '',
    entry.type || '',
    String(entry.episodes || ''),
    entry.releaseYear || '',
    typeof entry.seasons === 'number' ? String(entry.seasons) : '',
    firstEpisodeTitle
  ].join('|').toLowerCase();

  return fingerprint.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function getWatchedStorageKey(entry) {
  return 'watched_' + getEntryStorageId(entry);
}

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

let _flowLineRaf = null;

function scheduleFlowLinesRedraw() {
  if (_flowLineRaf) {
    cancelAnimationFrame(_flowLineRaf);
  }
  _flowLineRaf = requestAnimationFrame(() => {
    _flowLineRaf = null;
    drawTimelineFlowLines();
  });
}

function drawTimelineFlowLines() {
  const svgNs = 'http://www.w3.org/2000/svg';
  document.querySelectorAll('.timeline-flow-svg').forEach((existingSvg) => existingSvg.remove());

  const container = document.querySelector('.timeline-container');
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const rowTolerance = 8;
  const allRows = [];

  document.querySelectorAll('.entries-grid').forEach((grid) => {
    const cards = Array.from(grid.querySelectorAll('.entry-card')).filter((card) => {
      const style = window.getComputedStyle(card);
      return style.display !== 'none' && card.offsetParent !== null;
    });

    if (cards.length === 0) return;

    cards.sort((a, b) => {
      if (a.offsetTop !== b.offsetTop) return a.offsetTop - b.offsetTop;
      return a.offsetLeft - b.offsetLeft;
    });

    const rows = [];
    let gridMinLeft = Infinity;
    let gridMaxRight = -Infinity;
    cards.forEach((card) => {
      const top = card.offsetTop;
      const bottom = top + card.offsetHeight;
      const left = card.offsetLeft;
      const right = left + card.offsetWidth;
      gridMinLeft = Math.min(gridMinLeft, left);
      gridMaxRight = Math.max(gridMaxRight, right);
      let row = rows.find((candidate) => Math.abs(candidate.top - top) <= rowTolerance);
      if (!row) {
        row = { top, bottom, minLeft: left, maxRight: right, cards: [{ left, right }] };
        rows.push(row);
      } else {
        row.top = Math.min(row.top, top);
        row.bottom = Math.max(row.bottom, bottom);
        row.minLeft = Math.min(row.minLeft, left);
        row.maxRight = Math.max(row.maxRight, right);
        row.cards.push({ left, right });
      }
    });

    rows.forEach((row) => {
      row.centerY = (row.top + row.bottom) / 2;
      const sortedCards = (row.cards || []).slice().sort((a, b) => a.left - b.left);
      row.gapCenters = [];
      for (let i = 0; i < sortedCards.length - 1; i++) {
        const currentCard = sortedCards[i];
        const nextCard = sortedCards[i + 1];
        if (nextCard.left > currentCard.right) {
          row.gapCenters.push((currentCard.right + nextCard.left) / 2);
        }
      }
    });

    const gridRect = grid.getBoundingClientRect();
    const gridOffsetTop = gridRect.top - containerRect.top;
    const gridOffsetLeft = gridRect.left - containerRect.left;

    rows.forEach((row) => {
      allRows.push({
        top: gridOffsetTop + row.top,
        bottom: gridOffsetTop + row.bottom,
        centerY: gridOffsetTop + row.centerY,
        minLeft: gridOffsetLeft + row.minLeft,
        maxRight: gridOffsetLeft + row.maxRight,
        gridMinLeft: gridOffsetLeft + gridMinLeft,
        gridMaxRight: gridOffsetLeft + gridMaxRight,
        gapCenters: (row.gapCenters || []).map((x) => gridOffsetLeft + x)
      });
    });
  });

  if (allRows.length === 0) return;

  // Find the widest bounds across all rows to use for all rows
  let overallMinLeft = Infinity;
  let overallMaxRight = -Infinity;
  allRows.forEach(row => {
    overallMinLeft = Math.min(overallMinLeft, row.gridMinLeft);
    overallMaxRight = Math.max(overallMaxRight, row.gridMaxRight);
  });

  const headerCenters = Array.from(document.querySelectorAll('.timeline-section h2')).map((header) => {
    const rect = header.getBoundingClientRect();
    return Math.round(rect.top - containerRect.top + (rect.height / 2));
  });

  allRows.sort((a, b) => a.top - b.top);

  const containerWidth = Math.max(1, container.clientWidth);
  const containerHeight = Math.max(1, container.scrollHeight);
  const overflowX = 28;
  const edgeInset = 10;
  const laneLeftX = Math.round((-overflowX) + edgeInset);
  const laneRightX = Math.round(containerWidth + overflowX - edgeInset);
  const rowEdgePadding = 24;
  const flowColor = '#D4AF37';

  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('class', 'timeline-flow-svg timeline-flow-svg-global');
  svg.setAttribute('viewBox', `${-overflowX} 0 ${containerWidth + (overflowX * 2)} ${containerHeight}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  // Define arrow markers
  const defs = document.createElementNS(svgNs, 'defs');
  
  // Right-pointing marker
  const markerRight = document.createElementNS(svgNs, 'marker');
  markerRight.setAttribute('id', 'arrowhead-right');
  markerRight.setAttribute('markerWidth', '10');
  markerRight.setAttribute('markerHeight', '10');
  markerRight.setAttribute('refX', '5');
  markerRight.setAttribute('refY', '3');
  markerRight.setAttribute('orient', 'auto');
  const arrowPolygonRight = document.createElementNS(svgNs, 'polygon');
  arrowPolygonRight.setAttribute('points', '0 0, 10 3, 0 6');
  arrowPolygonRight.setAttribute('fill', flowColor);
  markerRight.appendChild(arrowPolygonRight);
  defs.appendChild(markerRight);
  
  // Left-pointing marker
  const markerLeft = document.createElementNS(svgNs, 'marker');
  markerLeft.setAttribute('id', 'arrowhead-left');
  markerLeft.setAttribute('markerWidth', '10');
  markerLeft.setAttribute('markerHeight', '10');
  markerLeft.setAttribute('refX', '5');
  markerLeft.setAttribute('refY', '3');
  markerLeft.setAttribute('orient', 'auto');
  const arrowPolygonLeft = document.createElementNS(svgNs, 'polygon');
  arrowPolygonLeft.setAttribute('points', '10 0, 0 3, 10 6');
  arrowPolygonLeft.setAttribute('fill', flowColor);
  markerLeft.appendChild(arrowPolygonLeft);
  defs.appendChild(markerLeft);
  
  svg.appendChild(defs);

  const getRowBounds = (row) => {
    const left = Math.round(Math.max(laneLeftX, overallMinLeft - rowEdgePadding));
    const right = Math.round(Math.min(laneRightX, overallMaxRight + rowEdgePadding));
    return { left, right };
  };

  const firstBounds = getRowBounds(allRows[0]);
  const lastBounds = getRowBounds(allRows[allRows.length - 1]);
  const startPointY = Math.round(allRows[0].centerY);
  const endPointY = Math.round(allRows[allRows.length - 1].centerY);

  let d = '';
  let previousRow = null;

  allRows.forEach((row, rowIndex) => {
    const rowY = Math.round(row.centerY);
    const rowBounds = getRowBounds(row);

    if (rowIndex === 0) {
      d = `M ${rowBounds.left} ${rowY} L ${rowBounds.right} ${rowY}`;
    } else {
      const gapTop = previousRow.bottom;
      const gapBottom = row.top;
      let gapMiddle = gapBottom > gapTop
        ? Math.round((gapTop + gapBottom) / 2)
        : Math.round(gapTop);

      if (gapBottom > gapTop && headerCenters.length > 0) {
        const headersInGap = headerCenters.filter((y) => y > gapTop && y < gapBottom);
        if (headersInGap.length > 0) {
          gapMiddle = headersInGap.reduce((closest, y) => (
            Math.abs(y - gapMiddle) < Math.abs(closest - gapMiddle) ? y : closest
          ), headersInGap[0]);
        }
      }
      const previousBounds = getRowBounds(previousRow);

      d += ` L ${previousBounds.right} ${gapMiddle}`;
      d += ` L ${rowBounds.left} ${gapMiddle}`;
      d += ` L ${rowBounds.left} ${rowY}`;
      d += ` L ${rowBounds.right} ${rowY}`;
    }

    previousRow = row;
  });

  const glowPath = document.createElementNS(svgNs, 'path');
  glowPath.setAttribute('d', d);
  glowPath.setAttribute('class', 'timeline-flow-path timeline-flow-path-glow');
  glowPath.setAttribute('stroke', flowColor);

  const mainPath = document.createElementNS(svgNs, 'path');
  mainPath.setAttribute('d', d);
  mainPath.setAttribute('class', 'timeline-flow-path');
  mainPath.setAttribute('stroke', flowColor);

  // Build list of path segments with their coordinates and direction
  const pathSegments = [];
  previousRow = null;

  allRows.forEach((row, rowIndex) => {
    const rowY = Math.round(row.centerY);
    const rowBounds = getRowBounds(row);

    if (rowIndex === 0) {
      // First row horizontal segment (left to right)
      pathSegments.push({
        type: 'horizontal',
        x1: rowBounds.left,
        x2: rowBounds.right,
        y: rowY,
        direction: 'right',
        arrowPositions: row.gapCenters,
        isRowSegment: true
      });
    } else {
      const gapTop = previousRow.bottom;
      const gapBottom = row.top;
      let gapMiddle = gapBottom > gapTop
        ? Math.round((gapTop + gapBottom) / 2)
        : Math.round(gapTop);

      if (gapBottom > gapTop && headerCenters.length > 0) {
        const headersInGap = headerCenters.filter((y) => y > gapTop && y < gapBottom);
        if (headersInGap.length > 0) {
          gapMiddle = headersInGap.reduce((closest, y) => (
            Math.abs(y - gapMiddle) < Math.abs(closest - gapMiddle) ? y : closest
          ), headersInGap[0]);
        }
      }
      const previousBounds = getRowBounds(previousRow);

      // Vertical segment from previous row to gap
      pathSegments.push({
        type: 'vertical',
        x: previousBounds.right,
        y1: previousRow.centerY,
        y2: gapMiddle,
        direction: 'down'
      });

      // Horizontal segment in gap
      const gapDirection = previousBounds.right > rowBounds.left ? 'left' : 'right';
      const gapArrowPositions = (Array.isArray(previousRow.gapCenters) && previousRow.gapCenters.length > 0)
        ? previousRow.gapCenters
        : row.gapCenters;
      pathSegments.push({
        type: 'horizontal',
        x1: previousBounds.right,
        x2: rowBounds.left,
        y: gapMiddle,
        direction: gapDirection,
        arrowPositions: gapArrowPositions,
        isGapSegment: true
      });

      // Vertical segment from gap to current row
      pathSegments.push({
        type: 'vertical',
        x: rowBounds.left,
        y1: gapMiddle,
        y2: rowY,
        direction: 'down'
      });

      // Current row horizontal segment
      pathSegments.push({
        type: 'horizontal',
        x1: rowBounds.left,
        x2: rowBounds.right,
        y: rowY,
        direction: 'right',
        arrowPositions: row.gapCenters,
        isRowSegment: true
      });
    }

    previousRow = row;
  });

  // Add arrows along each segment
  pathSegments.forEach(segment => {
    if (segment.type === 'horizontal') {
      const segmentWidth = Math.abs(segment.x2 - segment.x1);
      const startX = Math.min(segment.x1, segment.x2);
      const endX = Math.max(segment.x1, segment.x2);
      const markerDirection = segment.direction === 'left' ? 'arrowhead-left' : 'arrowhead-right';
      const arrowInset = 16;
      const arrowSpacing = 315;
      const usableWidth = Math.max(0, segmentWidth - (arrowInset * 2));
      const arrowCount = usableWidth <= 0
        ? 0
        : Math.max(1, Math.floor(usableWidth / arrowSpacing));
      const arrowStep = arrowCount > 0 ? usableWidth / (arrowCount + 1) : 0;
      const gapMidpoint = Math.round((segment.x1 + segment.x2) / 2);
      let arrowXs = [];
      if (segment.isRowSegment) {
        const rawPositions = Array.isArray(segment.arrowPositions) ? segment.arrowPositions : [];
        arrowXs = rawPositions
          .map((x) => Math.round(x))
          .filter((x) => x >= startX + arrowInset && x <= endX - arrowInset);
      } else if (segment.isGapSegment) {
        arrowXs = [gapMidpoint];
      } else {
        arrowXs = Array.from({ length: arrowCount }, (_, index) => (
          Math.round(startX + arrowInset + (arrowStep * (index + 1)))
        ));
      }

      arrowXs.forEach((x) => {
        const arrow = document.createElementNS(svgNs, 'line');
        arrow.setAttribute('x1', String(x - 6));
        arrow.setAttribute('y1', String(Math.round(segment.y)));
        arrow.setAttribute('x2', String(x + 6));
        arrow.setAttribute('y2', String(Math.round(segment.y)));
        arrow.setAttribute('stroke', flowColor);
        arrow.setAttribute('stroke-width', '2');
        arrow.setAttribute('opacity', '0.7');
        arrow.setAttribute('marker-end', `url(#${markerDirection})`);
        svg.appendChild(arrow);
      });
    } else if (segment.type === 'vertical') {
      const segmentHeight = Math.abs(segment.y2 - segment.y1);
      const startY = Math.min(segment.y1, segment.y2);

      // Place arrow at midpoint
      const y = Math.round(startY + segmentHeight / 2);
      const arrow = document.createElementNS(svgNs, 'line');
      arrow.setAttribute('x1', String(Math.round(segment.x)));
      arrow.setAttribute('y1', String(y - 6));
      arrow.setAttribute('x2', String(Math.round(segment.x)));
      arrow.setAttribute('y2', String(y + 6));
      arrow.setAttribute('stroke', flowColor);
      arrow.setAttribute('stroke-width', '2');
      arrow.setAttribute('opacity', '0.7');
      arrow.setAttribute('marker-end', 'url(#arrowhead-right)');
      svg.appendChild(arrow);
    }
  });

  const startGlow = document.createElementNS(svgNs, 'circle');
  startGlow.setAttribute('class', 'timeline-flow-endpoint timeline-flow-endpoint-glow');
  startGlow.setAttribute('cx', String(firstBounds.left));
  startGlow.setAttribute('cy', String(startPointY));
  startGlow.setAttribute('r', '8');
  startGlow.setAttribute('fill', flowColor);

  const endGlow = document.createElementNS(svgNs, 'circle');
  endGlow.setAttribute('class', 'timeline-flow-endpoint timeline-flow-endpoint-glow');
  endGlow.setAttribute('cx', String(lastBounds.right));
  endGlow.setAttribute('cy', String(endPointY));
  endGlow.setAttribute('r', '8');
  endGlow.setAttribute('fill', flowColor);

  const startDot = document.createElementNS(svgNs, 'circle');
  startDot.setAttribute('class', 'timeline-flow-endpoint');
  startDot.setAttribute('cx', String(firstBounds.left));
  startDot.setAttribute('cy', String(startPointY));
  startDot.setAttribute('r', '5');
  startDot.setAttribute('fill', flowColor);

  const endDot = document.createElementNS(svgNs, 'circle');
  endDot.setAttribute('class', 'timeline-flow-endpoint');
  endDot.setAttribute('cx', String(lastBounds.right));
  endDot.setAttribute('cy', String(endPointY));
  endDot.setAttribute('r', '5');
  endDot.setAttribute('fill', flowColor);

  svg.appendChild(glowPath);
  svg.appendChild(startGlow);
  svg.appendChild(endGlow);
  svg.appendChild(mainPath);
  svg.appendChild(startDot);
  svg.appendChild(endDot);
  container.appendChild(svg);
}

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
          <h2><span class="era-title">${section.era}</span> <span class="era-count">${itemLabel}</span></h2>
          <div class="entries-grid">
            ${section.entries.map((entry, entryIdx) => {
              const progress = entry.episodes > 0 ? Math.round((entry.watched / entry.episodes) * 100) : 0;
              const isMovie = /film/i.test(entry.type) && entry.episodes === 1;
              const entryMetaText = getEntryMetaText(entry);
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
                    <p class="entry-meta">${entryMetaText}</p>
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

  if (!document.getElementById('reset-dialog')) {
    const resetDialogDiv = document.createElement('div');
    resetDialogDiv.id = 'reset-dialog';
    resetDialogDiv.className = 'reset-dialog hidden';
    resetDialogDiv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(resetDialogDiv);
  }

  if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
  }

  // initialize watched arrays and attach click handlers
  initializeWatchedState();
  attachFilterHandlers();
  attachEntryHandlers();
  attachResetButton();
  scheduleFlowLinesRedraw();
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
    const searchMatch = !searchText || getEntrySearchText(entry).includes(searchText);
    
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
  
  // Hide sections with no visible entries and center short rows
  document.querySelectorAll('.timeline-section').forEach(section => {
    const visibleCards = section.querySelectorAll('.entry-card:not([style*="display: none"])').length;
    section.style.display = visibleCards === 0 ? 'none' : '';
  });
  
  const noResults = document.getElementById('no-results');
  if (noResults) {
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  scheduleFlowLinesRedraw();
}

// Watched state and modal helpers
function initializeWatchedState() {
  TIMELINE_DATA.forEach(section => {
    section.entries.forEach(entry => {
      const key = getWatchedStorageKey(entry);
      const legacyKey = getLegacyWatchedStorageKey(entry);
      try {
        let raw = localStorage.getItem(key);
        let loadedFromLegacy = false;
        if (!raw) {
          raw = localStorage.getItem(legacyKey);
          loadedFromLegacy = Boolean(raw);
        }
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length === entry.episodes) {
            entry._watchedArray = arr;
            entry.watched = arr.filter(Boolean).length;
            if (loadedFromLegacy) {
              try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
              if (legacyKey !== key) {
                try { localStorage.removeItem(legacyKey); } catch (e) {}
              }
            }
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
        showToast(`${entry.title}: ${cb.checked ? 'Marked as watched' : 'Marked as unwatched'}`, 'info');
      });
    }
  });
}

function attachResetButton() {
  const resetBtn = document.getElementById('reset-progress-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', openResetDialog);
  }
}

function resetAllProgress() {
  TIMELINE_DATA.forEach((section, sectionIdx) => {
    section.entries.forEach((entry, entryIdx) => {
      entry._watchedArray = new Array(entry.episodes).fill(false);
      entry.watched = 0;
      const key = getWatchedStorageKey(entry);
      const legacyKey = getLegacyWatchedStorageKey(entry);
      try { localStorage.removeItem(key); } catch (e) {}
      if (legacyKey !== key) {
        try { localStorage.removeItem(legacyKey); } catch (e) {}
      }
      updateEntryUI(sectionIdx, entryIdx);
    });
  });
}

function openResetDialog() {
  const resetDialog = document.getElementById('reset-dialog');
  if (!resetDialog) return;

  resetDialog.innerHTML = `
    <div class="reset-dialog-backdrop"></div>
    <div class="reset-dialog-content" role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description">
      <h2 id="reset-dialog-title">Reset progress?</h2>
      <p id="reset-dialog-description">This will clear all watched progress across the timeline. This action cannot be undone.</p>
      <div class="reset-dialog-actions">
        <button type="button" class="modal-close-btn" id="reset-dialog-cancel">Cancel</button>
        <button type="button" class="modal-primary-btn" id="reset-dialog-confirm">Reset Progress</button>
      </div>
    </div>
  `;

  resetDialog.classList.remove('hidden');
  resetDialog.setAttribute('aria-hidden', 'false');

  const cancelBtn = resetDialog.querySelector('#reset-dialog-cancel');
  const confirmBtn = resetDialog.querySelector('#reset-dialog-confirm');
  const backdrop = resetDialog.querySelector('.reset-dialog-backdrop');

  const closeOnEscape = (event) => {
    if (event.key === 'Escape') {
      closeResetDialog();
    }
  };

  const handleClose = () => {
    document.removeEventListener('keydown', closeOnEscape);
    closeResetDialog();
  };

  if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
  if (backdrop) backdrop.addEventListener('click', handleClose);
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      resetAllProgress();
      handleClose();
      showToast('All watched progress has been reset.', 'success');
    });
    confirmBtn.focus();
  }

  document.addEventListener('keydown', closeOnEscape);
}

function closeResetDialog() {
  const resetDialog = document.getElementById('reset-dialog');
  if (!resetDialog) return;
  resetDialog.classList.add('hidden');
  resetDialog.setAttribute('aria-hidden', 'true');
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;

  toastContainer.appendChild(toast);

  const existingToasts = toastContainer.querySelectorAll('.toast');
  if (existingToasts.length > 4) {
    existingToasts[0].remove();
  }

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 220);
  }, 2600);
}

function isShowCompleted(entry) {
  if (!entry || entry.episodes <= 1 || !Array.isArray(entry._watchedArray)) return false;
  return entry._watchedArray.every(Boolean);
}

function saveWatchedState(entry) {
  const key = getWatchedStorageKey(entry);
  const legacyKey = getLegacyWatchedStorageKey(entry);
  try { localStorage.setItem(key, JSON.stringify(entry._watchedArray)); } catch (e) {}
  if (legacyKey !== key) {
    try { localStorage.removeItem(legacyKey); } catch (e) {}
  }
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
    const episodeTitle = (entry.episodeDetails && entry.episodeDetails[i] && entry.episodeDetails[i].title) || '';
    const episodeTime = (entry.episodeDetails && entry.episodeDetails[i] && entry.episodeDetails[i].time) || '';
    const episodeTimeText = String(episodeTime).trim() || '—';
    episodesHTML += `
      <div class="episode-item">
        <label>
          <input type="checkbox" data-ep="${i}" ${checked} />
          <span class="episode-title">${episodeTitle}</span>
          <span class="episode-time">${episodeTimeText}</span>
        </label>
      </div>
    `;
  }

  const synopsis = entry.synopsis || '';
  const showEpisodes = entry.episodes > 1; // Only show episodes for series/shows
  const progressPercent = entry.episodes > 0 ? Math.round((watchedCount / entry.episodes) * 100) : 0;
  const episodeCountText = showEpisodes ? `${watchedCount}/${entry.episodes} watched (${progressPercent}%)` : '';
  const entryMetaText = getEntryMetaText(entry);

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
          <span class="modal-meta-text">${entryMetaText}</span>
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
      const wasCompleted = isShowCompleted(entry);
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
      showToast(`${entry.title}: ${newState ? 'Marked all as watched' : 'Cleared watched status'}`, 'success');
      if (!wasCompleted && isShowCompleted(entry)) {
        showToast(`${entry.title} completed!`, 'success');
      }
    });
    
    // Set initial button text
    updateModalCount();
  }

  // Handle checkboxes for series/shows
  const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const wasCompleted = isShowCompleted(entry);
      const idx = Number(cb.dataset.ep);
      entry._watchedArray[idx] = cb.checked;
      saveWatchedState(entry);
      updateEntryUI(sectionIdx, entryIdx);
      // Update the modal episode count
      updateModalCount();
      if (!wasCompleted && isShowCompleted(entry)) {
        showToast(`${entry.title} completed!`, 'success');
      }
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

window.addEventListener('resize', () => {
  setVh();
  scheduleFlowLinesRedraw();
});

window.addEventListener('orientationchange', () => {
  setVh();
  scheduleFlowLinesRedraw();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  setVh();
  render();
});
