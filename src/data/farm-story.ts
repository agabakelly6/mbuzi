// src/data/farm-story.ts
//
// Non-copy structural data for /farm-story. Written copy (headings,
// paragraphs, timeline/pillar labels) lives in content/farm-story.ts —
// this file now holds only what genuinely isn't "content": one-off image
// paths/alt text (not part of a reusable media/ collection) and the team
// roster's role/group assignments (a people/org relationship, not prose).

export const BRAND_STORY_IMAGE = {
  src: "/images/farm/brand-story.jpg",
  alt: "The original YPA family farm outside Kampala",
};

export interface TeamRosterEntry {
  /** References a TeamImage.id in src/media/team.ts — that's where the name/photo live. */
  imageId: string;
  role: string;
  group: "Farmers" | "Chefs" | "Restaurant Team";
}

export const TEAM_ROSTER: TeamRosterEntry[] = [
  { imageId: "team-joseph-k", role: "Head Farmer", group: "Farmers" },
  { imageId: "team-immaculate-n", role: "Livestock Manager", group: "Farmers" },
  { imageId: "team-ronald-m", role: "Executive Chef", group: "Chefs" },
  { imageId: "team-patience-a", role: "Grill Master", group: "Chefs" },
  { imageId: "team-david-o", role: "Restaurant Manager", group: "Restaurant Team" },
  { imageId: "team-grace-l", role: "Guest Experience Lead", group: "Restaurant Team" },
];

export const SUSTAINABILITY_IMAGE = {
  src: "/images/farm/sustainability.jpg",
  alt: "Rotational grazing pasture at the YPA farm",
};