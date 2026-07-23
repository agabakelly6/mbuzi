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
import type { OrderItem, OrderStatus } from "../../types/order";
import type { RoleName } from "../../types/role";
import { createOrderInputSchema } from "../../validators/order.schema";
import { dbError } from "../../lib/supabase/dbErrors";
import { calculateOrderTotal, canRoleTransitionOrder, isOrderCancellable } from "../../models/OrderModel";
import { supabaseOrderRepository } from "../../repositories/supabase/SupabaseOrderRepository";
import { supabaseMenuRepository } from "../../repositories/supabase/SupabaseMenuRepository";
import { supabaseDeliveryRepository } from "../../repositories/supabase/SupabaseDeliveryRepository";
import { supabasePromotionRepository } from "../../repositories/supabase/SupabasePromotionRepository";
import { supabasePromotionService } from "./SupabasePromotionService";
import { DELIVERY_ZONES } from "../../data/delivery";

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
    if (parsed.data.channel === "delivery") {
      const zone = DELIVERY_ZONES.find((z) => z.id === parsed.data.deliveryZoneId);
      if (!zone) return { data: null, error: dbError("validation_error") };
      deliveryFee = zone.fee;
    }

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
        deliveryZoneId: parsed.data.deliveryZoneId as string,
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

  async transitionStatus(id: string, to: OrderStatus, actingRole: RoleName) {
    const { data: order, error } = await supabaseOrderRepository.findById(id);
    if (error || !order) return { data: null, error: error ?? dbError("not_found") };

    if (!canRoleTransitionOrder(actingRole, order, to)) {
      return { data: null, error: dbError("forbidden") };
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
