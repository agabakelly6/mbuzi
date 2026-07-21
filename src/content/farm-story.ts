// src/content/farm-story.ts
import type {
  SEOContent,
  HeroContent,
  SectionContent,
  TimelineContent,
  FooterCTAContent,
} from "../types/content";

export interface FarmPillarContent {
  icon: "freshness" | "quality" | "traceability" | "authenticity";
  title: string;
  description: string;
}

export interface FounderSignatureContent {
  name: string;
  title: string;
  organizations: string[];
}

export interface FounderMessageContent {
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  signature: FounderSignatureContent;
}

export const FARM_STORY_CONTENT = {
  seo: {
    title: "Our Farm Story",
    description:
      "Meet the farm behind YPA Mbuzi Choma — how we raise, care for, and select every goat before it ever reaches the charcoal grill.",
  } satisfies SEOContent,

  hero: {
    eyebrow: "Farm To Fire",
    headline: ["Our Farm.", "Our Pride."],
    description:
      "Every dish starts long before the grill — on the land where we raise our goats with care.",
    image: "/images/hero/hero-farm-story.webp",
    imageAlt: "Healthy goats grazing across open pasture in the morning light",
  } satisfies HeroContent,

  brandStory: {
    eyebrow: "Where It Started",
    heading: "A family farm, before it was ever a restaurant.",
    description:
      "YPA began on a small plot outside Kampala, raising goats the way our grandparents did — slowly, patiently, without shortcuts. When friends kept asking to buy a plate straight off our fire, the restaurant followed. The farm came first, and it still comes first today.",
    cta: { label: "See What We Grill" },
  } satisfies SectionContent,

  founderMessage: {
    eyebrow: "A Word From The Founder",
    heading: "A Letter From Obed Ben",
    paragraphs: [
      "I didn't set out to build a restaurant. I set out to raise good goats, and to do the work honestly enough that it would still be standing years later.",
      "YPA Farms began small — young people, a plot of land, and the belief that discipline and patience could turn into something real. There were no shortcuts we could afford, so we learned to do things properly: caring for the herd, respecting the land, and showing up every day whether it was easy or not.",
      "What we were really building was opportunity — for the young people working alongside me, for the families who depend on the farm today, and for a country I wanted to serve in a way that felt useful, not symbolic.",
      "YPA Mbuzi Choma came later, almost naturally. People who tasted what we raised kept asking where they could buy a plate of it. Opening a restaurant meant we could finally close the distance between the farm and the table — the same goat we raised ourselves, grilled the way we always have.",
      "Every branch we open carries the same standard as the first herd did: raised with care, prepared with discipline, and served the way we'd want to be served ourselves. That's still the whole idea.",
    ],
    signature: {
      name: "Obed Ben",
      title: "Founder",
      organizations: ["YPA Farms", "YPA Mbuzi Choma"],
    },
  } satisfies FounderMessageContent,

  ypaConnection: {
    eyebrow: "Part Of Something Bigger",
    heading: "YPA Mbuzi Choma Is Part Of Youth Platform Africa",
    description:
      "YPA Mbuzi Choma grew out of Youth Platform Africa (YPA) — a Ugandan youth empowerment organisation founded in Gomba district that grew a small livestock project into agribusiness and entrepreneurship opportunities for young people across the country. The restaurant is one expression of that wider work: the same farm-raised goat behind YPA's agribusiness projects, served the way it always has been.",
    cta: { label: "Visit Youth Platform Africa", href: "https://youthplatformafrica.com/" },
  } satisfies SectionContent,

  timeline: {
    eyebrow: "From Farm To Fire",
    heading: "The Farm Journey",
    steps: [
      {
        id: "raising",
        title: "Raising Healthy Goats",
        description: "Free-roaming, grass-fed, and given room to grow at their own pace.",
      },
      {
        id: "veterinary",
        title: "Veterinary Care",
        description: "Regular checkups from a dedicated vet — no shortcuts on animal welfare.",
      },
      {
        id: "feeding",
        title: "Farm Feeding",
        description: "Natural pasture and farm-grown feed, never processed fillers.",
      },
      {
        id: "selection",
        title: "Selection",
        description: "Our butchers hand-select each animal for size, health, and quality.",
      },
      {
        id: "grilling",
        title: "Charcoal Grilling",
        description: "Slow-grilled over real charcoal, the same method for three generations.",
      },
      {
        id: "serving",
        title: "Served Fresh",
        description: "From fire to table the same day — never frozen, never held over.",
      },
    ],
  } satisfies TimelineContent,

  whyFarmToTable: {
    eyebrow: "Our Commitment",
    heading: "Why Farm-to-Table Matters",
    pillars: [
      {
        icon: "freshness",
        title: "Freshness",
        description: "Nothing sits in a freezer. Every cut reaches the grill within hours of arriving.",
      },
      {
        icon: "quality",
        title: "Quality",
        description: "Healthier animals, raised without shortcuts, simply taste better.",
      },
      {
        icon: "traceability",
        title: "Traceability",
        description: "Every plate traces back to one farm, one herd — never a mystery supplier.",
      },
      {
        icon: "authenticity",
        title: "Authenticity",
        description: "The same recipes and methods our family has used for three generations.",
      },
    ] satisfies FarmPillarContent[],
  },

  meetTheTeam: {
    eyebrow: "The People Behind Every Branch",
    heading: "Meet Our Branch Leadership",
  } satisfies SectionContent,

  sustainability: {
    eyebrow: "Looking After The Land",
    heading: "Farming that gives back as much as it takes.",
    description:
      "Our herd rotates across pasture to let the land recover, kitchen waste returns to the farm as compost, and every water source on the property is protected and monitored. Responsible farming isn't a marketing line here — it's the only way the farm keeps working for the next generation.",
    cta: { label: "Plan A Visit" },
  } satisfies SectionContent,

  cta: {
    headline: "Ready to Taste the Farm?",
    description: "Book your table or reach us directly — we'll have the fire ready.",
    primaryCta: { label: "Reserve Table" },
    secondaryCta: { label: "Explore Menu" },
  } satisfies FooterCTAContent,
} as const;