// src/media/team.ts
//
// Canonical team portraits. Deliberately holds ONLY photo metadata (who's
// pictured, the shot itself) — role/group/department is a roster concern,
// not a media concern, and stays in data/farm-story.ts's TEAM_ROSTER,
// which references these photos by id. That split avoids duplicating a
// person's name in two files just because one file needs the photo and
// the other needs the org info.

import type { TeamImage } from "../types/media";

export const TEAM_IMAGES: TeamImage[] = [
  {
    id: "team-joseph-k",
    title: "Joseph K.",
    description: "Head Farmer — with YPA since the very first herd.",
    src: "/images/team/joseph-k.jpg",
    alt: "Portrait of Joseph K., Head Farmer at YPA Mbuzi Choma",
    category: "team",
    featured: true,
    width: 800,
    height: 800,
  },
  {
    id: "team-immaculate-n",
    title: "Immaculate N.",
    description: "Livestock Manager — oversees the health of every animal on the farm.",
    src: "/images/team/immaculate-n.jpg",
    alt: "Portrait of Immaculate N., Livestock Manager at YPA Mbuzi Choma",
    category: "team",
    featured: false,
    width: 800,
    height: 800,
  },
  {
    id: "team-ronald-m",
    title: "Ronald M.",
    description: "Executive Chef — shapes every recipe on the menu.",
    src: "/images/team/ronald-m.jpg",
    alt: "Portrait of Ronald M., Executive Chef at YPA Mbuzi Choma",
    category: "team",
    featured: true,
    width: 800,
    height: 800,
  },
  {
    id: "team-patience-a",
    title: "Patience A.",
    description: "Grill Master — tends every fire, every service.",
    src: "/images/team/patience-a.jpg",
    alt: "Portrait of Patience A., Grill Master at YPA Mbuzi Choma",
    category: "team",
    featured: false,
    width: 800,
    height: 800,
  },
  {
    id: "team-david-o",
    title: "David O.",
    description: "Restaurant Manager — runs the floor every night of service.",
    src: "/images/team/david-o.jpg",
    alt: "Portrait of David O., Restaurant Manager at YPA Mbuzi Choma",
    category: "team",
    featured: false,
    width: 800,
    height: 800,
  },
  {
    id: "team-grace-l",
    title: "Grace L.",
    description: "Guest Experience Lead — makes sure every table feels looked after.",
    src: "/images/team/grace-l.jpg",
    alt: "Portrait of Grace L., Guest Experience Lead at YPA Mbuzi Choma",
    category: "team",
    featured: false,
    width: 800,
    height: 800,
  },
];