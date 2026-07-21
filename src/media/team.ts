// src/media/team.ts
//
// Canonical team portraits. Deliberately holds ONLY photo metadata (who's
// pictured, the shot itself) — role/group/department is a roster concern,
// not a media concern, and stays in data/farm-story.ts's TEAM_ROSTER,
// which references these photos by id. That split avoids duplicating a
// person's name in two files just because one file needs the photo and
// the other needs the org info.
//
// Restaurant leadership, not farm staff. Real branch manager names
// haven't been confirmed yet, so `title` holds the branch rather than an
// invented person's name — swap it for a real name once one exists.

import type { TeamImage } from "../types/media";

export const TEAM_IMAGES: TeamImage[] = [
  {
    id: "team-rubaga-manager",
    title: "Rubaga",
    description: "Branch Manager — leads the floor at our original Rubaga branch.",
    src: "/images/team/rubaga-manager.jpg",
    alt: "Portrait of the Rubaga Branch Manager at YPA Mbuzi Choma",
    category: "team",
    featured: true,
    width: 800,
    height: 800,
  },
  {
    id: "team-ntinda-manager",
    title: "Ntinda",
    description: "Branch Manager — runs service at our Ntinda branch.",
    src: "/images/team/ntinda-manager.jpg",
    alt: "Portrait of the Ntinda Branch Manager at YPA Mbuzi Choma",
    category: "team",
    featured: false,
    width: 800,
    height: 800,
  },
  {
    id: "team-mbarara-manager",
    title: "Mbarara",
    description: "Branch Manager — runs service at our Mbarara branch.",
    src: "/images/team/mbarara-manager.jpg",
    alt: "Portrait of the Mbarara Branch Manager at YPA Mbuzi Choma",
    category: "team",
    featured: false,
    width: 800,
    height: 800,
  },
];
