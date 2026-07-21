// src/types/content.ts
//
// Shared interfaces for the content layer (src/content/*.ts). Every
// page's content object is built from these rather than each page
// inventing its own shape — keeps content files predictable, and makes
// a future CMS/localization swap a matter of re-implementing where these
// shapes' data comes from, not rewriting every page.

export interface SEOContent {
  title: string;
  description: string;
  keywords?: string[];
}

export interface CTAContent {
  label: string;
  /** Href is usually resolved from config/site.ts or data/navigation.ts at the call site, not stored here — content owns the label, not the URL. Optional escape hatch for one-off links (e.g. an anchor) that don't belong in either of those. */
  href?: string;
}

export interface HeroContent {
  eyebrow: string;
  /**
   * Pre-split display lines for the H1, matching Hero.astro's
   * `mottoLines` prop. Optional: the homepage omits this and lets
   * Hero.astro derive it from config/site.ts's SITE.motto instead of
   * this file repeating the brand tagline a third time.
   */
  headline?: string[];
  description: string;
  /**
   * Page-specific hero background image, matching Hero.astro's
   * `posterSrc` prop. Optional: Hero.astro falls back to its own default
   * image if a page ever omits this, but every real page should set one.
   */
  image?: string;
  imageAlt?: string;
  primaryCta?: CTAContent;
  secondaryCta?: CTAContent;
}

export interface SectionContent {
  eyebrow?: string;
  heading: string;
  description?: string;
  cta?: CTAContent;
}

export interface TimelineStepContent {
  id: string;
  title: string;
  description: string;
}

export interface TimelineContent {
  eyebrow: string;
  heading: string;
  steps: TimelineStepContent[];
}

export interface FooterCTAContent {
  headline: string;
  description: string;
  primaryCta: CTAContent;
  secondaryCta: CTAContent;
}

export interface FAQItem {
  question: string;
  answer: string;
}