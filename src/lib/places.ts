/**
 * Stand-in for a Places autocomplete service. Everything here is fabricated
 * sample data — swap `searchPlaces` for a real request when an API key exists.
 */

import type { LocationMode } from "@/lib/booking";

export type PlacePrediction = {
  id: string;
  /** Venue or street line, shown first. */
  mainText: string;
  /** City / state line, shown muted beneath. */
  secondaryText: string;
  /** Airports are offered on the Airport tab and hidden from the Location tab. */
  isAirport?: boolean;
};

const PLACES: PlacePrediction[] = [
  {
    id: "clintons-bar",
    mainText: "Clintons Bar & Grille",
    secondaryText: "High Street, Clinton, MA, USA",
  },
  {
    isAirport: true,
    id: "logan-b",
    mainText: "Logan Airport Terminal B",
    secondaryText: "Boston, MA, USA",
  },
  {
    isAirport: true,
    id: "logan-c",
    mainText: "Logan Airport Terminal C",
    secondaryText: "Boston, MA, USA",
  },
  {
    isAirport: true,
    id: "logan-e",
    mainText: "Logan Airport Terminal E",
    secondaryText: "Boston, MA, USA",
  },
  {
    id: "south-station",
    mainText: "South Station",
    secondaryText: "700 Atlantic Ave, Boston, MA, USA",
  },
  {
    id: "north-station",
    mainText: "North Station",
    secondaryText: "135 Causeway St, Boston, MA, USA",
  },
  {
    id: "back-bay",
    mainText: "Back Bay Station",
    secondaryText: "145 Dartmouth St, Boston, MA, USA",
  },
  {
    id: "fenway",
    mainText: "Fenway Park",
    secondaryText: "4 Jersey St, Boston, MA, USA",
  },
  {
    id: "td-garden",
    mainText: "TD Garden",
    secondaryText: "100 Legends Way, Boston, MA, USA",
  },
  {
    id: "faneuil",
    mainText: "Faneuil Hall Marketplace",
    secondaryText: "4 S Market St, Boston, MA, USA",
  },
  {
    id: "copley",
    mainText: "Copley Place",
    secondaryText: "100 Huntington Ave, Boston, MA, USA",
  },
  {
    id: "prudential",
    mainText: "Prudential Center",
    secondaryText: "800 Boylston St, Boston, MA, USA",
  },
  {
    id: "mgh",
    mainText: "Massachusetts General Hospital",
    secondaryText: "55 Fruit St, Boston, MA, USA",
  },
  {
    id: "mit",
    mainText: "Massachusetts Institute of Technology",
    secondaryText: "77 Massachusetts Ave, Cambridge, MA, USA",
  },
  {
    id: "harvard",
    mainText: "Harvard University",
    secondaryText: "Massachusetts Hall, Cambridge, MA, USA",
  },
  {
    id: "harvard-sq",
    mainText: "Harvard Square",
    secondaryText: "Cambridge, MA, USA",
  },
  {
    id: "kendall",
    mainText: "Kendall/MIT Station",
    secondaryText: "Main St, Cambridge, MA, USA",
  },
  {
    id: "assembly",
    mainText: "Assembly Row",
    secondaryText: "Somerville, MA, USA",
  },
  {
    id: "worcester",
    mainText: "Worcester Union Station",
    secondaryText: "2 Washington Sq, Worcester, MA, USA",
  },
  {
    isAirport: true,
    id: "manchester",
    mainText: "Manchester-Boston Regional Airport",
    secondaryText: "Manchester, NH, USA",
  },
  {
    isAirport: true,
    id: "providence",
    mainText: "T.F. Green Airport",
    secondaryText: "Warwick, RI, USA",
  },
  {
    id: "salem",
    mainText: "Salem Ferry Terminal",
    secondaryText: "10 Blaney St, Salem, MA, USA",
  },
  {
    id: "plymouth",
    mainText: "Plymouth Rock",
    secondaryText: "79 Water St, Plymouth, MA, USA",
  },
  {
    id: "hyannis",
    mainText: "Hyannis Transportation Center",
    secondaryText: "215 Iyannough Rd, Hyannis, MA, USA",
  },
  {
    isAirport: true,
    id: "logan-a",
    mainText: "Logan Airport Terminal A",
    secondaryText: "Boston, MA, USA",
  },
  {
    isAirport: true,
    id: "bradley",
    mainText: "Bradley International Airport",
    secondaryText: "Windsor Locks, CT, USA",
  },
  {
    isAirport: true,
    id: "worcester-rgnl",
    mainText: "Worcester Regional Airport",
    secondaryText: "Worcester, MA, USA",
  },
  {
    isAirport: true,
    id: "nantucket",
    mainText: "Nantucket Memorial Airport",
    secondaryText: "Nantucket, MA, USA",
  },
  {
    isAirport: true,
    id: "marthas",
    mainText: "Martha's Vineyard Airport",
    secondaryText: "Vineyard Haven, MA, USA",
  },
  {
    isAirport: true,
    id: "portland-me",
    mainText: "Portland International Jetport",
    secondaryText: "Portland, ME, USA",
  },
];

const MAX_SUGGESTIONS = 6;

export function placeToAddress(place: PlacePrediction) {
  return `${place.mainText}, ${place.secondaryText}`;
}

/**
 * Ranks name-prefix matches above name matches above city matches, so typing
 * "log" surfaces the Logan terminals before anything merely in Boston. The
 * `mode` picks which set to search; the two are disjoint.
 */
export function searchPlaces(query: string, mode: LocationMode = "location") {
  const wantAirports = mode === "airport";
  const pool = PLACES.filter((place) =>
    wantAirports ? place.isAirport : !place.isAirport,
  );
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return pool.slice(0, MAX_SUGGESTIONS);
  }

  const scored = pool
    .map((place) => {
      const main = place.mainText.toLowerCase();
      const secondary = place.secondaryText.toLowerCase();

      if (main.startsWith(needle)) return { place, score: 0 };
      if (main.includes(needle)) return { place, score: 1 };
      if (secondary.includes(needle)) return { place, score: 2 };
      if (placeToAddress(place).toLowerCase().includes(needle))
        return { place, score: 3 };
      return { place, score: -1 };
    })
    .filter((entry) => entry.score >= 0);

  scored.sort((a, b) => a.score - b.score);

  return scored.slice(0, MAX_SUGGESTIONS).map((entry) => entry.place);
}
