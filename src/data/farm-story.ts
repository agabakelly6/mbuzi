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

export const FOUNDER_PORTRAIT = {
  src: "/images/team/obed-ben.jpg",
  alt: "Portrait of Obed Ben, founder of YPA Farms and YPA Mbuzi Choma",
};

export interface TeamRosterEntry {
  /** References a TeamImage.id in src/media/team.ts — that's where the photo lives. */
  imageId: string;
  role: string;
  group: "Branch Leadership";
}

// Restaurant leadership, not farm staff — each entry is a placeholder
// until a real branch manager's name is confirmed, so TeamImage.title
// holds the branch (not an invented person's name) until then.
export const TEAM_ROSTER: TeamRosterEntry[] = [
  { imageId: "team-rubaga-manager", role: "Branch Manager", group: "Branch Leadership" },
  { imageId: "team-ntinda-manager", role: "Branch Manager", group: "Branch Leadership" },
  { imageId: "team-mbarara-manager", role: "Branch Manager", group: "Branch Leadership" },
];

export const SUSTAINABILITY_IMAGE = {
  src: "/images/farm/sustainability.jpg",
  alt: "Rotational grazing pasture at the YPA farm",
};