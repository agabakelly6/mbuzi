// src/types/index.ts
//
// Barrel for the Phase 2 platform domain model only — types/location.ts,
// media.ts, content.ts, and assistant.ts stay un-barreled and imported
// directly, same as before; they're marketing-site content types with no
// relation to this domain model. Import from here for anything
// order/branch/role/etc.-related instead of reaching into individual files.

export * from "./base";
export * from "./role";
export * from "./permission";
export * from "./branch";
export * from "./user";
export * from "./customer";
export * from "./menu-item";
export * from "./order";
export * from "./payment";
export * from "./delivery";
export * from "./table";
export * from "./reservation";
export * from "./kitchen";
export * from "./notification";
export * from "./promotion";
export * from "./loyalty";
export * from "./analytics";
export * from "./inventory";
