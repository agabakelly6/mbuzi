// src/repositories/index.ts
//
// Barrel for every repository interface. A service depends on these types
// only — never on how they're implemented — so Phase 3 can introduce a
// `SupabaseOrderRepository implements OrderRepository` without any service
// or component import needing to change.

export * from "./shared";
export * from "./BranchRepository";
export * from "./UserRepository";
export * from "./CustomerRepository";
export * from "./MenuRepository";
export * from "./OrderRepository";
export * from "./PaymentRepository";
export * from "./DeliveryRepository";
export * from "./TableRepository";
export * from "./ReservationRepository";
export * from "./KitchenTicketRepository";
export * from "./NotificationRepository";
export * from "./PromotionRepository";
export * from "./LoyaltyRepository";
export * from "./InventoryRepository";
export * from "./AnalyticsRepository";
