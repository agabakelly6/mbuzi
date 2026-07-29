// src/services/supabase/SupabaseOrderService.ts
//
// Orchestrates SupabaseOrderRepository + SupabaseMenuRepository (for price/
// name resolution) + models/OrderModel.ts (state-transition and total
// rules) — the layer UI code should depend on, never OrderRepository
// directly, per services/OrderService.ts's own header comment.
//
// Known gap, not fixed here: OrderService.placeOrder's interface takes no
// "who is placing this" parameter, so Order.placedByUserId is always left
// unset by this implementation — there's no way for it to know a cashier/
// waiter keyed the order in versus a customer self-serving. Fixing that
// properly means adding an actor parameter to the existing OrderService
// interface, which is a Phase 2 architecture decision, not something to
// improvise around here.
//
// A delivery order's Delivery record is created here, right after the
// order itself — orders.delivery_id is deliberately left unset rather
// than round-tripped back after the fact (OrderRepository has no generic
// field-update method to do that with); deliveries.order_id is the real,
// authoritative link, queried via DeliveryRepository.findByOrderId. If
// the delivery insert fails, the (already valid) order is not rolled
// back — that failure is logged and surfaced separately rather than
// discarding a real order over it.
import type { OrderService } from "../OrderService";
import type { Order, OrderItem, OrderStatus } from "../../types/order";
import type { RoleName } from "../../types/role";
import { createOrderInputSchema, createGuestOrderInputSchema } from "../../validators/order.schema";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { calculateOrderTotal, canRoleTransitionOrder, isOrderCancellable } from "../../models/OrderModel";
import { hasConfirmedPayment } from "../../models/PaymentModel";
import { supabaseOrderRepository } from "../../repositories/supabase/SupabaseOrderRepository";
import { supabaseMenuRepository } from "../../repositories/supabase/SupabaseMenuRepository";
import { supabaseDeliveryRepository } from "../../repositories/supabase/SupabaseDeliveryRepository";
import { supabasePromotionRepository } from "../../repositories/supabase/SupabasePromotionRepository";
import { supabasePaymentRepository } from "../../repositories/supabase/SupabasePaymentRepository";
import { supabasePromotionService } from "./SupabasePromotionService";
import { supabase } from "../../lib/supabase/client";
import { calculateDeliveryFee, isWithinDeliveryRadius } from "../../lib/geo";

/** deliveries.delivery_zone_id is NOT NULL — always resolves to a human-readable label, never trusted for money. */
function deliveryLabel(zoneId: string | undefined, distanceKm: number | undefined): string {
  if (zoneId) return zoneId;
  if (distanceKm !== undefined) return `${distanceKm.toFixed(1)} km`;
  return "Address-based (fee pending)";
}

export const supabaseOrderService: OrderService = {
  async getOrder(id) {
    return supabaseOrderRepository.findById(id);
  },

  async listOrders(filters) {
    return supabaseOrderRepository.list(filters);
  },

  async placeOrder(input) {
    const parsed = createOrderInputSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: dbError("validation_error") };

    const items: OrderItem[] = [];
    for (const line of parsed.data.items) {
      const { data: menuItem, error } = await supabaseMenuRepository.findItemById(line.menuItemId);
      if (error || !menuItem) return { data: null, error: error ?? dbError("not_found") };
      if (menuItem.availability !== "available") return { data: null, error: dbError("validation_error") };

      const variation = line.variationLabel
        ? menuItem.variations.find((v) => v.label === line.variationLabel)
        : undefined;
      const unitPrice = variation?.price ?? menuItem.basePrice;

      items.push({
        id: "",
        orderId: "",
        menuItemId: line.menuItemId,
        nameSnapshot: menuItem.name,
        variationLabel: line.variationLabel,
        unitPrice,
        quantity: line.quantity,
        specialInstructions: line.specialInstructions,
        subtotal: unitPrice * line.quantity,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    let deliveryFee = 0;
    if (parsed.data.channel === "delivery" && parsed.data.deliveryDistanceKm !== undefined) {
      if (!isWithinDeliveryRadius(parsed.data.deliveryDistanceKm)) return { data: null, error: dbError("validation_error") };
      deliveryFee = calculateDeliveryFee(parsed.data.deliveryDistanceKm);
    }
    // else, for a delivery order with no routed distance: fee stays 0 here
    // and is confirmed manually against deliveryAddress, same as the guest
    // checkout's fallback path below — there's no flat-fee table anymore.

    let discountTotal = 0;
    let appliedPromotionId: string | undefined;
    if (parsed.data.promoCode) {
      const applied = await supabasePromotionService.applyToOrder(parsed.data.promoCode, parsed.data.branchId, subtotal);
      if (applied.error || !applied.data) return { data: null, error: applied.error ?? dbError("validation_error") };
      discountTotal = applied.data.discountAmount;
      appliedPromotionId = applied.data.promotion.id;
      // free_delivery's effect is zeroing the delivery fee, not a
      // subtotal discount — models/PromotionModel.ts's calculateDiscount
      // deliberately returns 0 for it, this is where it actually applies.
      if (applied.data.promotion.type === "free_delivery") deliveryFee = 0;
    }

    const total = calculateOrderTotal({ subtotal, deliveryFee, discountTotal, taxTotal: 0 });

    const orderResult = await supabaseOrderRepository.create({
      branchId: parsed.data.branchId,
      customerId: parsed.data.customerId,
      channel: parsed.data.channel,
      status: "pending",
      items,
      tableId: parsed.data.tableId,
      subtotal,
      deliveryFee,
      discountTotal,
      taxTotal: 0,
      total,
      appliedPromotionId,
      notes: parsed.data.notes,
    });

    if (orderResult.error || !orderResult.data) return orderResult;

    if (appliedPromotionId) {
      const incrementResult = await supabasePromotionRepository.incrementUsage(appliedPromotionId);
      if (incrementResult.error) {
        console.error("[SupabaseOrderService.placeOrder] order created but promotion usage increment failed", incrementResult.error);
      }
    }

    if (parsed.data.channel === "delivery") {
      const deliveryResult = await supabaseDeliveryRepository.create({
        branchId: parsed.data.branchId,
        orderId: orderResult.data.id,
        deliveryZoneId: deliveryLabel(parsed.data.deliveryZoneId, parsed.data.deliveryDistanceKm),
        fee: deliveryFee,
        address: parsed.data.deliveryAddress as string,
        customerPhone: parsed.data.deliveryPhone as string,
      });
      if (deliveryResult.error) {
        console.error("[SupabaseOrderService.placeOrder] order created but delivery record failed", deliveryResult.error);
      }
    }

    return orderResult;
  },

  // Guest checkout — no login. Resolves prices/promo client-side (menu
  // items and promotions are public-readable, same trust model the
  // authenticated placeOrder above already uses), then hands the whole
  // write off to the place_guest_order RPC in one atomic call — see that
  // migration for why this can't just be a direct table insert the way
  // placeOrder above does it (RLS can't safely let an anonymous caller
  // read back an inserted order without leaking every other guest's
  // orders too).
  async placeGuestOrder(input) {
    const parsed = createGuestOrderInputSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: dbError("validation_error") };

    const items: OrderItem[] = [];
    for (const line of parsed.data.items) {
      const { data: menuItem, error } = await supabaseMenuRepository.findItemById(line.menuItemId);
      if (error || !menuItem) return { data: null, error: error ?? dbError("not_found") };
      if (menuItem.availability !== "available") return { data: null, error: dbError("validation_error") };

      const variation = line.variationLabel
        ? menuItem.variations.find((v) => v.label === line.variationLabel)
        : undefined;
      const unitPrice = variation?.price ?? menuItem.basePrice;

      items.push({
        id: "",
        orderId: "",
        menuItemId: line.menuItemId,
        nameSnapshot: menuItem.name,
        variationLabel: line.variationLabel,
        unitPrice,
        quantity: line.quantity,
        specialInstructions: line.specialInstructions,
        subtotal: unitPrice * line.quantity,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    let deliveryFee = 0;
    if (parsed.data.channel === "delivery" && parsed.data.deliveryDistanceKm !== undefined) {
      // Trusted path: real routed distance from OpenRouteService (see
      // CheckoutPanel.tsx / calculate-delivery-fee Edge Function) — the
      // fee is (re)computed here from the raw distance, never trusted as
      // a client-sent amount directly. The schema already caps distance
      // at MAX_DELIVERY_RADIUS_KM; re-checked here too since this is the
      // one place money actually gets derived from it.
      if (!isWithinDeliveryRadius(parsed.data.deliveryDistanceKm)) return { data: null, error: dbError("validation_error") };
      deliveryFee = calculateDeliveryFee(parsed.data.deliveryDistanceKm);
    }
    // else: no routed distance was captured (location sharing failed) —
    // there is no flat-zone fallback fee anymore. deliveryFee stays 0 and
    // the branch confirms the real fee by phone against deliveryAddress
    // before the order is prepared.

    let discountTotal = 0;
    let appliedPromotionId: string | undefined;
    if (parsed.data.promoCode) {
      const applied = await supabasePromotionService.applyToOrder(parsed.data.promoCode, parsed.data.branchId, subtotal);
      if (applied.error || !applied.data) return { data: null, error: applied.error ?? dbError("validation_error") };
      discountTotal = applied.data.discountAmount;
      appliedPromotionId = applied.data.promotion.id;
      if (applied.data.promotion.type === "free_delivery") deliveryFee = 0;
    }

    const total = calculateOrderTotal({ subtotal, deliveryFee, discountTotal, taxTotal: 0 });

    const { data, error } = await supabase.rpc("place_guest_order", {
      p_branch_id: parsed.data.branchId,
      p_channel: parsed.data.channel,
      p_guest_name: parsed.data.guestName,
      p_guest_phone: parsed.data.guestPhone,
      p_table_id: null,
      p_subtotal: subtotal,
      p_delivery_fee: deliveryFee,
      p_discount_total: discountTotal,
      p_total: total,
      p_applied_promotion_id: appliedPromotionId ?? null,
      p_notes: parsed.data.notes ?? null,
      p_delivery_zone_id:
        parsed.data.channel === "delivery"
          ? deliveryLabel(parsed.data.deliveryZoneId, parsed.data.deliveryDistanceKm)
          : null,
      p_delivery_address: parsed.data.channel === "delivery" ? parsed.data.deliveryAddress : null,
      p_items: items.map((item) => ({
        menuItemId: item.menuItemId,
        nameSnapshot: item.nameSnapshot,
        variationLabel: item.variationLabel,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        subtotal: item.subtotal,
      })),
      p_payment_method: parsed.data.paymentMethod,
    });
    if (error) return { data: null, error: mapDbError(error) };

    const rpcResult = data as {
      id: string;
      orderNumber: string;
      branchId: string;
      channel: Order["channel"];
      status: Order["status"];
      guestName: string;
      guestPhone: string;
      subtotal: number;
      deliveryFee: number;
      discountTotal: number;
      taxTotal: number;
      total: number;
      createdAt: string;
      updatedAt: string;
    };

    const order: Order = {
      id: rpcResult.id,
      branchId: rpcResult.branchId,
      orderNumber: rpcResult.orderNumber,
      customerId: null,
      guestName: rpcResult.guestName,
      guestPhone: rpcResult.guestPhone,
      channel: rpcResult.channel,
      status: rpcResult.status,
      items: items.map((item) => ({ ...item, orderId: rpcResult.id })),
      subtotal: rpcResult.subtotal,
      deliveryFee: rpcResult.deliveryFee,
      discountTotal: rpcResult.discountTotal,
      taxTotal: rpcResult.taxTotal,
      total: rpcResult.total,
      appliedPromotionId,
      notes: parsed.data.notes,
      createdAt: rpcResult.createdAt,
      updatedAt: rpcResult.updatedAt,
    };

    return { data: order, error: null };
  },

  async getGuestOrderStatus(orderId, guestPhone) {
    const { data, error } = await supabase.rpc("get_guest_order_status", {
      p_order_id: orderId,
      p_guest_phone: guestPhone,
    });
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };

    const result = data as { id: string; orderNumber: string; status: OrderStatus; channel: Order["channel"]; total: number; updatedAt: string };
    return {
      data: {
        id: result.id,
        orderNumber: result.orderNumber,
        status: result.status,
        channel: result.channel,
        total: result.total,
        updatedAt: result.updatedAt,
      },
      error: null,
    };
  },

  async transitionStatus(id: string, to: OrderStatus, actingRole: RoleName) {
    const { data: order, error } = await supabaseOrderRepository.findById(id);
    if (error || !order) return { data: null, error: error ?? dbError("not_found") };

    if (!canRoleTransitionOrder(actingRole, order, to)) {
      return { data: null, error: dbError("forbidden") };
    }

    if (to === "accepted" && (order.channel === "pickup" || order.channel === "delivery")) {
      const { data: payments } = await supabasePaymentRepository.list({ orderId: id });
      if (!hasConfirmedPayment(payments?.items ?? [])) {
        return { data: null, error: dbError("validation_error") };
      }
    }

    return supabaseOrderRepository.updateStatus(id, to);
  },

  async cancelOrder(id: string, input, actingRole: RoleName) {
    const { data: order, error } = await supabaseOrderRepository.findById(id);
    if (error || !order) return { data: null, error: error ?? dbError("not_found") };

    if (!isOrderCancellable(order) || !canRoleTransitionOrder(actingRole, order, "cancelled")) {
      return { data: null, error: dbError("forbidden") };
    }

    return supabaseOrderRepository.cancel(id, input.reason);
  },
};
