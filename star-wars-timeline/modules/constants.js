export const ERA_ASSETS = {
  "The High Republic": "./images/eras/high-republic.png",
  "Fall of the Jedi": "./images/eras/fall-of-the-jedi.png",
  "Reign of the Empire": "./images/eras/reign-of-the-empire.png",
  "Age of Rebellion": "./images/eras/age-of-the-rebellion.png",
  "Age of the Rebellion": "./images/eras/age-of-the-rebellion.png",
  "The New Republic": "./images/eras/new-republic.png",
  "Rise of the First Order": "./images/eras/rise-of-the-first-order.png",
  "New Jedi Order": "./images/eras/new-jedi-order.png",
  "Dawn of the Jedi": "./images/eras/dawn-of-the-jedi.png",
  "Old Republic": "./images/eras/old-republic.png",
  "Non-Timeline": "./images/eras/non-timeline.svg"
};

export const TYPE_LABELS = [
  [/movie/i, "Movie"],
  [/animated/i, "Animated"],
  [/anthology/i, "Anthology"],
  [/short/i, "Short"],
  [/live/i, "Live Action"],
  [/series|show/i, "Series"]
];

export const STORY_ARC_OPTIONS = [
  ["all", "All Arcs"],
  ["clone-wars", "Clone Wars"],
  ["mandoverse", "Mandoverse"],
  ["sequel-era", "Sequel Era"],
  ["george-lucas", "George Lucas"]
];

export const STORY_ARC_MATCHERS = {
  "clone-wars": (entry, section) => {
    const title = String(entry.title || "").toLowerCase();
    const era = String((section && section.era) || "").toLowerCase();
    return (
      title.includes("clone wars")
      || title.includes("attack of the clones")
      || title.includes("revenge of the sith")
      || title.includes("bad batch")
      || title.includes("tales of the jedi")
      || title.includes("tales of the underworld")
      || era.includes("fall of the jedi")
    );
  },
  mandoverse: (entry, section) => {
    const title = String(entry.title || "").toLowerCase();
    const era = String((section && section.era) || "").toLowerCase();
    return (
      title.includes("the mandalorian")
      || title.includes("book of boba fett")
      || title.includes("ahsoka")
      || title.includes("skeleton crew")
      || era.includes("new republic")
    );
  },
  "sequel-era": (entry, section) => {
    const title = String(entry.title || "").toLowerCase();
    const era = String((section && section.era) || "").toLowerCase();
    return (
      title.includes("the force awakens")
      || title.includes("the last jedi")
      || title.includes("the rise of skywalker")
      || title.includes("star wars resistance")
      || era.includes("rise of the first order")
    );
  },
  "george-lucas": (entry) => {
    const title = String(entry.title || "");
    const titleLower = title.toLowerCase();
    const isEpisodeOneToSix = /\bepisode\s+(i|ii|iii|iv|v|vi)\b/i.test(title);
    const isTheCloneWars = titleLower.includes("the clone wars") || titleLower.includes("star wars: the clone wars");
    return isEpisodeOneToSix || isTheCloneWars;
  }
};

export function mediaLabel(type) {
  const value = type || "Media";
  for (const [pattern, label] of TYPE_LABELS) {
    if (pattern.test(value)) return label;
  }
  return value;
}

export function slugifyEra(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugifyTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getEraAssetPath(era) {
  return ERA_ASSETS[era] || "";
}
