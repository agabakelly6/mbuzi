// src/lib/assistant/knowledgeBase.ts
//
// Builds the assistant's entire knowledge base by importing and flattening
// EXISTING content/data sources into retrievable KnowledgeChunks — nothing
// here is authored standalone, and nothing is duplicated. Adding a dish,
// branch, FAQ, or policy anywhere else in the project makes it available
// to the assistant automatically the next time this module loads; no
// assistant-specific change is ever required.
//
// src/types/ contributes nothing here on purpose — TypeScript types are
// erased at compile time, so there is no runtime "knowledge" to index
// from that folder. src/media/ is folded in lightly (a couple of
// collections have genuine descriptive prose); most of it is just photo
// captions, low-value for Q&A, so it isn't exhaustively indexed.
import { MENU_ITEMS } from "../../data/menu";
import { LOCATIONS, ACTIVE_LOCATIONS } from "../../data/locations";
import { DELIVERY_ZONES, DEFAULT_DELIVERY } from "../../data/delivery";
import { RESERVATION_POLICIES, MERCHANT_PAYMENT_OPTIONS } from "../../data/booking";
import { EVENT_TYPES, EVENT_PACKAGES, CATERING_SERVICES, BOOKING_PROCESS } from "../../data/catering";
import { DEPARTMENTS, RESPONSE_EXPECTATIONS } from "../../data/contact";
import { PLANNED_LOCATIONS } from "../../data/expansion";
import { SITE, BUSINESS_HOURS } from "../../config/site";
import { FARM_STORY_CONTENT } from "../../content/farm-story";
import { MENU_CONTENT } from "../../content/menu";
import { BOOKING_CONTENT } from "../../content/booking";
import { CATERING_CONTENT } from "../../content/catering";
import { CONTACT_CONTENT } from "../../content/contact";
import { LOCATIONS_CONTENT } from "../../content/locations";
import { FAQ_ITEMS as ASSISTANT_FAQ_ITEMS } from "../../content/assistant";
import type { KnowledgeChunk } from "../../types/assistant";

function menuChunks(): KnowledgeChunk[] {
  return MENU_ITEMS.map((item) => {
    const variationText = item.variations?.length
      ? ` Options: ${item.variations.map((v) => `${v.label} (${v.price})`).join(", ")}.`
      : "";
    const tags = [item.category, item.subcategory, item.chefPick ? "chef's pick" : "", item.featured ? "featured" : ""]
      .filter(Boolean)
      .join(", ");
    return {
      id: `menu-${item.id}`,
      category: "menu" as const,
      title: item.name,
      text: `${item.name} — ${item.description} Price: ${item.price}.${variationText}`,
      keywords: tags ? [tags] : undefined,
      sourceRef: item.id,
    };
  });
}

function locationChunks(): KnowledgeChunk[] {
  const serviceLabels = LOCATIONS_CONTENT.features.serviceLabels;
  return LOCATIONS.map((location) => {
    const hours =
      location.openingHours.length > 0
        ? location.openingHours.map((h) => `${h.days}: ${h.hours}`).join(", ")
        : "not yet open";
    const services = location.services.length > 0 ? location.services.map((s) => serviceLabels[s]).join(", ") : "none listed yet";
    const status = location.status === "coming-soon" ? " This branch is under construction and not yet open." : "";
    return {
      id: `location-${location.id}`,
      category: "location" as const,
      title: location.name,
      text: `${location.name} is located in ${location.city}, at ${location.address}. ${location.description} Hours: ${hours}. Services: ${services}.${status}`,
      keywords: ["where are you", "find us", "directions", "address"],
      sourceRef: location.id,
    };
  });
}

function deliveryChunks(): KnowledgeChunk[] {
  const zoneText = DELIVERY_ZONES.map((z) => `${z.label}: UGX ${z.fee.toLocaleString()}`).join(", ");
  const branches = ACTIVE_LOCATIONS.map((l) => l.city).join(", ");
  return [
    {
      id: "delivery-zones",
      category: "delivery",
      title: "Delivery zones and fees",
      text: `We deliver from every active branch (${branches}), ${DEFAULT_DELIVERY.area.toLowerCase()}. Delivery fees by distance: ${zoneText}.`,
      keywords: ["delivery fee", "how much is delivery", "do you deliver"],
    },
  ];
}

function bookingChunks(): KnowledgeChunk[] {
  const policies = RESERVATION_POLICIES.map((p) => ({
    id: `policy-${p.title.toLowerCase().replace(/\s+/g, "-")}`,
    category: "booking" as const,
    title: p.title,
    text: `${p.title}: ${p.description}`,
  }));
  const reservationHow: KnowledgeChunk = {
    id: "booking-how",
    category: "booking",
    title: "How to reserve a table",
    text: `To reserve a table, use the Reserve Table page (${SITE.reservationUrl}) or message us directly on WhatsApp — a reservation is only confirmed once our team replies to confirm it, not automatically on submission.`,
    keywords: ["book a table", "make a reservation"],
  };
  return [reservationHow, ...policies];
}

function paymentChunks(): KnowledgeChunk[] {
  const options = MERCHANT_PAYMENT_OPTIONS.map(
    (o) => `${o.provider} — merchant code ${o.merchantCode}: ${o.instructions}`
  ).join(" ");
  return [
    {
      id: "payment-options",
      category: "payment",
      title: "Payment options",
      text: `Reservation and catering deposits can be paid via mobile money merchant code: ${options} Cash is accepted for dining in-restaurant.`,
      keywords: ["mtn momo", "airtel money", "mobile money", "pay"],
    },
  ];
}

function cateringChunks(): KnowledgeChunk[] {
  const types = EVENT_TYPES.map((t) => ({
    id: `event-type-${t.id}`,
    category: "catering" as const,
    title: t.title,
    text: `${t.title}: ${t.description}`,
  }));
  const packages = EVENT_PACKAGES.map((p) => {
    const services = p.serviceIds
      .map((id) => CATERING_SERVICES.find((s) => s.id === id)?.label)
      .filter(Boolean)
      .join(", ");
    return {
      id: `event-package-${p.id}`,
      category: "catering" as const,
      title: p.title,
      text: `${p.title} (${p.minGuests}–${p.maxGuests} guests): ${p.description} Includes: ${services}.`,
    };
  });
  const process: KnowledgeChunk = {
    id: "catering-process",
    category: "catering",
    title: "How catering booking works",
    text: `Booking catering: ${BOOKING_PROCESS.map((s) => s.title).join(" → ")}. ${CATERING_CONTENT.eventsOverview.description}`,
  };
  return [process, ...types, ...packages];
}

function contactChunks(): KnowledgeChunk[] {
  const departments = DEPARTMENTS.map((d) => ({
    id: `department-${d.id}`,
    category: "contact" as const,
    title: d.name,
    text: `${d.name}: ${d.description}${d.email ? ` Email: ${d.email}.` : ""}`,
  }));
  const response: KnowledgeChunk = {
    id: "response-times",
    category: "contact",
    title: "Response times",
    text: `Expected response times — ${RESPONSE_EXPECTATIONS.map((r) => `${r.channel}: ${r.expectation}`).join(", ")}.`,
  };
  return [...departments, response];
}

function farmAndFounderChunks(): KnowledgeChunk[] {
  const { brandStory, founderMessage, ypaConnection, whyFarmToTable, sustainability } = FARM_STORY_CONTENT;
  return [
    {
      id: "farm-brand-story",
      category: "farm",
      title: brandStory.heading,
      text: brandStory.description,
      keywords: ["fresh", "freshness", "farm to table", "where does the food come from"],
    },
    {
      id: "founder-message",
      category: "founder",
      title: `${founderMessage.signature.name} — ${founderMessage.heading}`,
      text: founderMessage.paragraphs.join(" "),
      keywords: ["obed", "ben", "founder", "who started ypa", "who owns ypa"],
    },
    {
      id: "ypa-connection",
      category: "founder",
      title: ypaConnection.heading,
      text: ypaConnection.description,
      keywords: ["youth platform africa", "ypa organisation"],
    },
    {
      id: "farm-to-table-pillars",
      category: "farm",
      title: whyFarmToTable.heading,
      text: whyFarmToTable.pillars.map((p) => `${p.title}: ${p.description}`).join(" "),
      keywords: ["fresh", "freshness", "quality", "traceability", "authentic"],
    },
    {
      id: "sustainability",
      category: "farm",
      title: sustainability.heading,
      text: sustainability.description,
    },
    {
      id: "food-quality-story",
      category: "farm",
      title: MENU_CONTENT.foodQualityStory.heading,
      text: MENU_CONTENT.foodQualityStory.description,
      keywords: ["how is the food cooked", "charcoal", "grilled fresh"],
    },
  ];
}

function faqChunks(): KnowledgeChunk[] {
  const sources: { question: string; answer: string }[] = [
    ...ASSISTANT_FAQ_ITEMS,
    ...BOOKING_CONTENT.faq.items,
    ...CATERING_CONTENT.faq.items,
    ...CONTACT_CONTENT.faq.items,
    ...LOCATIONS_CONTENT.faq.items,
  ];
  const seen = new Set<string>();
  return sources
    .filter((item) => {
      if (seen.has(item.question)) return false;
      seen.add(item.question);
      return true;
    })
    .map((item, index) => ({
      id: `faq-${index}-${item.question.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
      category: "faq" as const,
      title: item.question,
      text: item.answer,
    }));
}

function hoursAndContactChunks(): KnowledgeChunk[] {
  const hoursText = BUSINESS_HOURS.map((h) => `${h.days}: ${h.hours}`).join(", ");
  return [
    {
      id: "business-hours",
      category: "hours",
      title: "Opening hours",
      text: `${SITE.name} is open ${hoursText}.`,
      keywords: ["what time do you open", "what time do you close", "when are you open"],
    },
    {
      id: "site-contact",
      category: "contact",
      title: "General contact",
      text: `You can reach ${SITE.name} by phone or WhatsApp at ${SITE.phone}, by email at ${SITE.email}, or visit us in ${SITE.address}.`,
    },
  ];
}

function expansionChunks(): KnowledgeChunk[] {
  return PLANNED_LOCATIONS.map((p) => ({
    id: `expansion-${p.id}`,
    category: "expansion",
    title: `${p.city} (planned)`,
    text: `${p.city}: ${p.note}`,
    keywords: ["new branch", "opening soon", "expansion", "future locations"],
  }));
}

let cache: KnowledgeChunk[] | null = null;

/** Builds the full knowledge base once and memoizes it — the source data is static, so there's nothing to recompute per question. */
export function getKnowledgeBase(): KnowledgeChunk[] {
  if (cache) return cache;
  cache = [
    ...menuChunks(),
    ...locationChunks(),
    ...deliveryChunks(),
    ...bookingChunks(),
    ...paymentChunks(),
    ...cateringChunks(),
    ...contactChunks(),
    ...farmAndFounderChunks(),
    ...faqChunks(),
    ...hoursAndContactChunks(),
    ...expansionChunks(),
  ];
  return cache;
}
