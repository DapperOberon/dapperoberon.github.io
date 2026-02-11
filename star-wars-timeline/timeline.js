// Star Wars Timeline Data
const TIMELINE_DATA = [
  {
    era: 'Ancient Sith Era',
    events: [
      {
        year: '~25000 BBY',
        title: 'The Infinite Empire',
        description: 'The ancient Sith Empire rules under the dark side philosophy.'
      },
      {
        year: '~7000 BBY',
        title: 'The Sith-Jedi War',
        description: 'Conflict between the Sith and Jedi Order begins in earnest.'
      }
    ]
  },
  {
    era: 'Old Republic Era',
    events: [
      {
        year: '~3959 BBY',
        title: 'Knights of the Old Republic',
        description: 'The Jedi Civil War and the return of the Sith Lord Revan.'
      },
      {
        year: '~3642 BBY',
        title: 'Old War Drawdown',
        description: 'The Old Sith Empire falls; a fragile peace emerges.'
      }
    ]
  },
  {
    era: 'Rise of the Empire',
    events: [
      {
        year: '32 BBY',
        title: 'The Phantom Menace',
        description: 'Anakin Skywalker is discovered as a Force user; the Naboo crisis occurs.'
      },
      {
        year: '22 BBY',
        title: 'Attack of the Clones',
        description: 'The Clone Wars begin; Anakin and Padmé fall in love.'
      },
      {
        year: '19 BBY',
        title: 'Revenge of the Sith',
        description: 'Order 66 executed; the Jedi Order is destroyed; Anakin becomes Darth Vader.'
      }
    ]
  },
  {
    era: 'Galactic Empire',
    events: [
      {
        year: '0 ABY / BBY',
        title: 'A New Hope',
        description: 'Luke Skywalker joins the Rebellion and destroys the first Death Star.'
      },
      {
        year: '3 ABY',
        title: 'The Empire Strikes Back',
        description: 'The Rebellion faces devastating losses; Luke trains as a Jedi.'
      },
      {
        year: '4 ABY',
        title: 'Return of the Jedi',
        description: 'The Rebellion defeats the Empire; Anakin redeems himself; Emperor dies.'
      }
    ]
  },
  {
    era: 'New Republic Era',
    events: [
      {
        year: '34 ABY',
        title: 'The Force Awakens',
        description: 'The First Order rises from the ashes of the Empire; the Resistance is formed.'
      },
      {
        year: '35 ABY',
        title: 'The Last Jedi',
        description: 'Luke Skywalker confronts Kylo Ren; the Rebellion faces new challenges.'
      },
      {
        year: '36 ABY',
        title: 'The Rise of Skywalker',
        description: 'The final confrontation between light and dark; the Skywalker saga concludes.'
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
      ${TIMELINE_DATA.map((section, idx) => `
        <section class="timeline-section">
          <h2>${section.era}</h2>
          ${section.events.map((event, eventIdx) => `
            <div class="timeline-event">
              <div class="timeline-marker">${eventIdx + 1}</div>
              <div class="timeline-content">
                <div class="timeline-year">${event.year}</div>
                <h3>${event.title}</h3>
                <p>${event.description}</p>
              </div>
            </div>
          `).join('')}
        </section>
      `).join('')}
    </main>

    <footer>
      <p>© 2026 DapperOberon. Star Wars is a trademark of Lucasfilm Ltd.</p>
    </footer>
  `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', render);
