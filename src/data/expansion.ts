// src/data/expansion.ts
//
// Cities on YPA's roadmap — not yet open, with no address, hours, or
// coordinates to show. Kept separate from data/locations.ts's LOCATIONS
// array on purpose: LOCATIONS drives booking, structured data, and the
// map, all of which need real contact details a planned city doesn't
// have yet. This is display-only, for the Future Expansion section.

export interface PlannedLocation {
  id: string;
  city: string;
  note: string;
}

export const PLANNED_LOCATIONS: PlannedLocation[] = [
  {
    id: "jinja",
    city: "Jinja",
    note: "Planned — carrying the same farm and fire east to the source of the Nile.",
  },
  {
    id: "masaka",
    city: "Masaka",
    note: "Planned — extending the same fire further along the Masaka road.",
  },
];
