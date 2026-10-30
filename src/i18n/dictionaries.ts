// Every text on the page in both languages. Bosnian is the source: the English dictionary has to
// have exactly the same keys (the type check fails otherwise), so nothing can be left untranslated.

export const LANGS = ["bs", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const isLang = (value: string): value is Lang => (LANGS as readonly string[]).includes(value);

/** Each language by its own name, for the language switch. */
export const langNames: Record<Lang, string> = { bs: "Bosanski", en: "English" };

/** Where each language lives: Bosnian at the root, English under /en. */
export const homePath: Record<Lang, string> = { bs: "/", en: "/en" };

/** Bosnian plural forms: 1 aktivnost, 2–4 aktivnosti, 5+ aktivnosti (11–14 take the last form). */
function bsPlural(count: number, one: string, few: string, many: string): string {
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit === 1 && lastTwo !== 11) return one;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

const bs = {
  htmlLang: "bs",
  /** For times like "13:37". */
  timeLocale: "bs-BA",
  meta: {
    description: "Ideje kako i gdje porodice mogu zajedno provesti vrijeme u Bosni i Hercegovini.",
  },
  nav: {
    label: "Glavna navigacija",
    home: "Početna",
    explore: "Istraži",
    map: "Mapa",
    reviews: "Recenzije",
    language: "Jezik",
  },
  soon: "Uskoro",
  soonLabel: (feature: string) => `${feature} (uskoro)`,
  country: "Bosna i Hercegovina",

  header: {
    greeting: "Gdje ćemo danas?",
    intro: "Otkrij zadivljujuća odredišta, stvori nezaboravne uspomene i doživi ljepotu naše zemlje – putovanje po putovanje.",
    search: "Pretraži aktivnosti...",
    searchLabel: "Pretraži aktivnosti",
  },
  hero: {
    weekly: "Izlet sedmice",
    rainy: "Za kišni dan",
    suggested: "Naš prijedlog",
    featured: "Izdvojeno",
    picking: "Biramo…",
    details: "Detalji",
    pickLabel: "Izaberi istaknuti izlet",
    tagline: "Hajmo vani!",
  },
  /** "~45 km od vas". */
  fromYou: (km: string) => `${km} od vas`,
  feature: (title: string) => `Istakni: ${title}`,
  directions: "Kako doći",
  directionsLabel: (title: string) => `Kako doći: ${title} (otvara Google Maps)`,
  calculating: "Računam udaljenost…",
  coffee: "Kafa",
  indoor: "Unutra",
  outdoor: "Vani",
  place: { nature: "Priroda", city: "Grad" },
  cost: { free: "Besplatno", moderate: "Umjereno", expensive: "Skuplje" },

  start: {
    title: "Polazište",
    nearest: "Najbliže",
    useMyLocation: "Koristi moju lokaciju",
    locating: "Tražim lokaciju…",
    pickTownLabel: "Odaberi grad iz kojeg krećete",
    orPickTown: "ili odaberi grad",
    yourLocation: "Tvoja lokacija (u blizini)",
    pickedTown: "Odabrani grad",
    change: "Promijeni",
    unsupported: "Ovaj preglednik ne podržava lokaciju. Odaberi grad iz liste.",
    outside: "Izgleda da nisi u Bosni i Hercegovini. Odaberi grad iz kojeg krećete.",
    denied: "Pristup lokaciji je odbijen. Odaberi grad iz liste.",
    unavailable: "Lokacija trenutno nije dostupna. Odaberi grad iz liste.",
    timeout: "Traženje lokacije je trajalo predugo. Pokušaj ponovo ili odaberi grad.",
    hint: "Odaberi odakle krećete",
    hintOptional: "(nije obavezno)",
    closeHint: "Zatvori uputu",
  },

  list: {
    title: "Aktivnosti za porodice",
    /** "Pronađena 1 aktivnost", "Pronađene 3 aktivnosti", "Pronađeno 5 aktivnosti". */
    found: (count: number) => bsPlural(count, `Pronađena ${count} aktivnost`, `Pronađene ${count} aktivnosti`, `Pronađeno ${count} aktivnosti`),
    noneNearCity: (km: number) => `Nijedna aktivnost u krugu od ${km} km.`,
    none: "Nijedna aktivnost ne odgovara odabiru.",
    nearestFirst: (place: string) => `, najbliže od mjesta ${place} prvo`,
    quickFilters: "Brzi filteri",
    all: "Sve",
    filters: "Filteri",
    nearCity: (city: string) => `Kod: ${city}`,
    leaveCity: (city: string) => `Prikaži aktivnosti i izvan okoline grada ${city}`,
    resetAll: "Poništi sve",
    showLess: "Prikaži manje",
    showAll: (count: number) => `Prikaži sve (${count})`,
  },
  quote: {
    title: "Za inspiraciju",
    text: "„Najljepše uspomene nastaju zajedno, napolju.“",
  },
  suggest: {
    title: "Ne znate kuda?",
    howAbout: (title: string) => `Kako bi bilo: ${title}?`,
    idle: "Pustite nas da predložimo izlet.",
    button: "Predloži",
  },
  comingSoon: {
    label: "Uskoro na Family Time",
    top: "Top destinacije",
    propose: "Predloži destinaciju",
    compare: "Poredi destinacije",
    favourites: "Moji favoriti",
  },
  mapCard: {
    title: "Istraži mapu",
    text: (count: number) => `${count} ${bsPlural(count, "aktivnost", "aktivnosti", "aktivnosti")} širom Bosne i Hercegovine.`,
    open: "Otvori mapu",
  },
  map: {
    title: "Mapa aktivnosti",
    help: "Klikni grad za aktivnosti u blizini, ili tačku za karticu.",
    teaser: "Mapa Bosne i Hercegovine s aktivnostima",
    notMatching: (title: string) => `${title} (ne odgovara filterima)`,
    cityShowAll: "Klikni za sve aktivnosti",
    cityShowNear: "Klikni za aktivnosti u blizini",
    lensLabel: (city: string | undefined) => `Okvir za uvećani prikaz${city ? `, kod: ${city}` : ""} – pomjeri ga mišem ili strelicama`,
    lens: "Uvećani prikaz",
    lensHelp: "pomjeri okvir na mapi",
    /** Landmarks next to the city badges, by their Bosnian name; Bosnian needs none. */
    landmarks: {} as Record<string, string>,
  },

  filters: {
    title: "Filteri",
    reset: "Poništi filtere",
    any: "Svejedno",
    natureOrCity: "Priroda ili grad",
    setting: "Unutra ili vani",
    distance: "Daljina",
    near: "Blizu",
    far: "Daleko",
    radius: (place: string) => `Udaljenost cestom od polazišta (${place})`,
    upToKm: (km: string) => `Do ${km} km`,
    radiusHint: "Postavi polazište (📍 iznad filtera) da biraš aktivnosti po kilometrima.",
    budget: "Budžet",
    budgetAny: "Nebitno",
    budgetFree: "Džabe",
    more: "Više opcija",
    coffee: "Kafa za roditelje",
    cancel: "Odustani",
    /** "Prikaži 1 rezultat", "Prikaži 3 rezultata", "Prikaži 5 rezultata". */
    show: (count: number) => (count % 10 === 1 && count % 100 !== 11 ? `Prikaži ${count} rezultat` : `Prikaži ${count} rezultata`),
  },

  detail: {
    close: "Zatvori",
    /** "~45 km od mjesta Tuzla · 🚗 50 min vožnje". */
    trip: (km: string, place: string, drive: string | null) => `${km} od mjesta ${place}${drive ? ` · 🚗 ${drive} vožnje` : ""}`,
    setStart: "Postavi polazište da vidiš udaljenost i vrijeme vožnje.",
    share: "Podijeli",
    copied: "Link kopiran",
    notCopied: "Link nije kopiran",
    website: "Web stranica ↗",
    info: "Praktične informacije",
    /** A line under the practical information explaining the currency; Bosnian readers need none. */
    priceNote: "",
    age: "Uzrast",
    allAges: "Za sve uzraste",
    /** "Od 1 godine", "Od 3 godine", "Od 5 godina". */
    fromAge: (years: number) => `Od ${years} ${bsPlural(years, "godine", "godine", "godina")}`,
    duration: "Trajanje",
    hours: (hours: number) => `Oko ${String(hours).replace(".", ",")} h`,
    price: "Cijena",
    where: "Gdje",
    surroundings: "Okruženje",
    forParents: "Za roditelje",
    hasCoffee: "Ima kafa",
    nearby: "U blizini",
  },

  route: {
    title: "Prije nego krenete",
    text: "Ruta je samo okvirna. Navigacija ne zna uvijek za radove na cesti, zatvorene ili makadamske puteve i zimske uslove, posebno u planinama.",
    checkBefore: "Pratite saobraćajne znakove, prije puta provjerite stanje na cestama (npr. na ",
    checkAfter: ") i ne oslanjajte se samo na navigaciju.",
    dontShow: "Ne prikazuj više",
    cancel: "Odustani",
    open: "Otvori Google Maps",
  },

  weather: {
    clear: "Vedro",
    mostlyClear: "Pretežno vedro",
    partly: "Djelimično oblačno",
    overcast: "Oblačno",
    fog: "Magla",
    drizzle: "Rosulja",
    rain: "Kiša",
    snow: "Snijeg",
    showers: "Pljuskovi",
    snowShowers: "Snježni pljuskovi",
    storm: "Grmljavina",
    changeable: "Promjenljivo",
    label: (place: string) => `Vrijeme: ${place}`,
    unavailable: "Vrijeme trenutno nije dostupno.",
    minMax: (min: number, max: number) => `Min ${min}° · Maks ${max}°`,
    average: (count: number) => `Prosjek ${count} ${count >= 5 ? "gradova" : "grada"}`,
    today: "Min. i maks. za danas",
    source: "Podaci:",
  },

  weekend: {
    title: "Ovaj vikend",
    forecastFor: (place: string) => `Prognoza: ${place}`,
    loading: "Učitavam prognozu…",
    possibleRain: "Moguća kiša",
    rainChance: (percent: number) => `💧 kiša ${percent}%`,
    outdoor: "Dobar dan za vani",
    indoor: "Bolje nešto unutra",
    snow: "Dan za snijeg",
    best: "★ Bolji dan za izlet",
    none: "Nema prijedloga koji odgovaraju odabranim filterima.",
  },

  units: {
    underOneKm: "manje od 1 km",
    /** Straight-line distance, when the road distance is not known. */
    straight: (km: string) => `${km} zračno`,
    underFiveMin: "do 5 min",
  },
  days: ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"],
  months: ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"],
  /** "Subota, 1. nov". */
  dayLabel: (day: string, date: number, month: string) => `${day}, ${date}. ${month}`,
};

export type Dict = typeof bs;

const en: Dict = {
  htmlLang: "en",
  timeLocale: "en-GB",
  meta: {
    description: "Ideas for where families can spend time together in Bosnia and Herzegovina.",
  },
  nav: {
    label: "Main navigation",
    home: "Home",
    explore: "Explore",
    map: "Map",
    reviews: "Reviews",
    language: "Language",
  },
  soon: "Soon",
  soonLabel: (feature) => `${feature} (coming soon)`,
  country: "Bosnia and Herzegovina",

  header: {
    greeting: "Where to today?",
    intro: "Discover breathtaking destinations, create unforgettable memories and experience the beauty of our country – one journey at a time.",
    search: "Search activities...",
    searchLabel: "Search activities",
  },
  hero: {
    weekly: "Trip of the week",
    rainy: "For a rainy day",
    suggested: "Our suggestion",
    featured: "Featured",
    picking: "Picking…",
    details: "Details",
    pickLabel: "Choose the featured trip",
    tagline: "Let's go out!",
  },
  fromYou: (km) => `${km} away`,
  feature: (title) => `Feature: ${title}`,
  directions: "Directions",
  directionsLabel: (title) => `Directions: ${title} (opens Google Maps)`,
  calculating: "Calculating distance…",
  coffee: "Coffee",
  indoor: "Indoors",
  outdoor: "Outdoors",
  place: { nature: "Nature", city: "Town" },
  cost: { free: "Free", moderate: "Moderate", expensive: "Pricier" },

  start: {
    title: "Starting point",
    nearest: "Nearest",
    useMyLocation: "Use my location",
    locating: "Finding your location…",
    pickTownLabel: "Choose the town you are starting from",
    orPickTown: "or choose a town",
    yourLocation: "Your location (nearby)",
    pickedTown: "Chosen town",
    change: "Change",
    unsupported: "This browser does not support location. Choose a town from the list.",
    outside: "You don't seem to be in Bosnia and Herzegovina. Choose the town you are starting from.",
    denied: "Location access was denied. Choose a town from the list.",
    unavailable: "Your location is not available right now. Choose a town from the list.",
    timeout: "Finding your location took too long. Try again or choose a town.",
    hint: "Choose where you are starting from",
    hintOptional: "(optional)",
    closeHint: "Close hint",
  },

  list: {
    title: "Activities for families",
    found: (count) => (count === 1 ? "1 activity found" : `${count} activities found`),
    noneNearCity: (km) => `No activities within ${km} km.`,
    none: "No activities match your choice.",
    nearestFirst: (place) => `, nearest to ${place} first`,
    quickFilters: "Quick filters",
    all: "All",
    filters: "Filters",
    nearCity: (city) => `Near: ${city}`,
    leaveCity: (city) => `Show activities outside the ${city} area too`,
    resetAll: "Clear all",
    showLess: "Show less",
    showAll: (count) => `Show all (${count})`,
  },
  quote: {
    title: "For inspiration",
    text: "“The best memories are made together, outdoors.”",
  },
  suggest: {
    title: "Not sure where to go?",
    howAbout: (title) => `How about: ${title}?`,
    idle: "Let us suggest a trip.",
    button: "Suggest",
  },
  comingSoon: {
    label: "Coming soon to Family Time",
    top: "Top destinations",
    propose: "Suggest a destination",
    compare: "Compare destinations",
    favourites: "My favourites",
  },
  mapCard: {
    title: "Explore the map",
    text: (count) => `${count} ${count === 1 ? "activity" : "activities"} across Bosnia and Herzegovina.`,
    open: "Open the map",
  },
  map: {
    title: "Activity map",
    help: "Click a town for activities nearby, or a dot for its card.",
    teaser: "Map of Bosnia and Herzegovina with activities",
    notMatching: (title) => `${title} (does not match the filters)`,
    cityShowAll: "Click for all activities",
    cityShowNear: "Click for activities nearby",
    lensLabel: (city) => `Magnifier frame${city ? `, near: ${city}` : ""} – move it with the mouse or the arrow keys`,
    lens: "Magnified view",
    lensHelp: "move the frame on the map",
    landmarks: {
      "Tvrđava Kastel": "Kastel Fortress",
      "Panonska jezera": "Pannonian Lakes",
      Željezara: "Steelworks",
      "Stari most": "Old Bridge",
      "Rijeka Una": "Una River",
      "Gradska vijećnica": "City Hall",
      "Tvrđava Gradina": "Gradina Fortress",
      Vinogradi: "Vineyards",
      "Šarena džamija": "Colourful Mosque",
      "Most na Neretvi": "Bridge on the Neretva",
      "Rafting na Neretvi": "Neretva rafting",
      "Mlinčići na Plivi": "Pliva watermills",
    },
  },

  filters: {
    title: "Filters",
    reset: "Clear filters",
    any: "Any",
    natureOrCity: "Nature or town",
    setting: "Indoors or outdoors",
    distance: "Distance",
    near: "Near",
    far: "Far",
    radius: (place) => `Road distance from the starting point (${place})`,
    upToKm: (km) => `Up to ${km} km`,
    radiusHint: "Set a starting point (📍 above the filters) to choose activities by kilometres.",
    budget: "Budget",
    budgetAny: "Any",
    budgetFree: "Free",
    more: "More options",
    coffee: "Coffee for the parents",
    cancel: "Cancel",
    show: (count) => (count === 1 ? "Show 1 result" : `Show ${count} results`),
  },

  detail: {
    close: "Close",
    trip: (km, place, drive) => `${km} from ${place}${drive ? ` · 🚗 ${drive} drive` : ""}`,
    setStart: "Set a starting point to see the distance and driving time.",
    share: "Share",
    copied: "Link copied",
    notCopied: "Link not copied",
    website: "Website ↗",
    info: "Practical information",
    priceNote: "Prices are in convertible marks (KM, also written BAM): €1 is about 1.96 KM. Euros are accepted in many places.",
    age: "Age",
    allAges: "All ages",
    fromAge: (years) => `From ${years} ${years === 1 ? "year" : "years"}`,
    duration: "Duration",
    hours: (hours) => `About ${hours} h`,
    price: "Price",
    where: "Where",
    surroundings: "Setting",
    forParents: "For the parents",
    hasCoffee: "Coffee available",
    nearby: "Nearby",
  },

  route: {
    title: "Before you set off",
    text: "The route is only a guide. Navigation apps don't always know about roadworks, closed or gravel roads and winter conditions, especially in the mountains.",
    checkBefore: "Follow the road signs, check road conditions before you leave (for example on ",
    checkAfter: ", in the local language) and don't rely on navigation alone.",
    dontShow: "Don't show this again",
    cancel: "Cancel",
    open: "Open Google Maps",
  },

  weather: {
    clear: "Clear",
    mostlyClear: "Mostly clear",
    partly: "Partly cloudy",
    overcast: "Cloudy",
    fog: "Fog",
    drizzle: "Drizzle",
    rain: "Rain",
    snow: "Snow",
    showers: "Showers",
    snowShowers: "Snow showers",
    storm: "Thunderstorm",
    changeable: "Changeable",
    label: (place) => `Weather: ${place}`,
    unavailable: "The weather is not available right now.",
    minMax: (min, max) => `Min ${min}° · Max ${max}°`,
    average: (count) => `Average of ${count} towns`,
    today: "Today's min. and max.",
    source: "Data:",
  },

  weekend: {
    title: "This weekend",
    forecastFor: (place) => `Forecast: ${place}`,
    loading: "Loading the forecast…",
    possibleRain: "Possible rain",
    rainChance: (percent) => `💧 rain ${percent}%`,
    outdoor: "Good day to be outside",
    indoor: "Better something indoors",
    snow: "A day for the snow",
    best: "★ Better day for a trip",
    none: "No suggestions match the chosen filters.",
  },

  units: {
    underOneKm: "under 1 km",
    straight: (km) => `${km} as the crow flies`,
    underFiveMin: "under 5 min",
  },
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  dayLabel: (day, date, month) => `${day}, ${date} ${month}`,
};

export const dictionaries: Record<Lang, Dict> = { bs, en };
