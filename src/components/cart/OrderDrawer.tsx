// src/components/cart/OrderDrawer.tsx
//
// Clones the MobileMenu.tsx slide-over recipe (scroll lock, focus trap,
// Escape-to-close, AnimatePresence scrim+panel, identical easing/z-index)
// rather than inventing a new modal pattern. Checkout has no payment
// step — it builds OrderDetails (types/cart.ts) via useCart().buildOrderDetails()
// and hands off to WhatsApp through the site's one getWhatsAppUrl() helper,
// exactly like BookingForm/ContactForm already do.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { X, Trash2, Truck, Store } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { ACTIVE_LOCATIONS } from "../../data/locations";
import { getDeliveryInfo } from "../../data/delivery";
import { formatPrice } from "../../lib/cart/cartUtils";
import { FORM_INPUT_CLASSES, FORM_ERROR_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";
import { isValidName, isValidPhone } from "../../lib/helpers";
import { getButtonClasses } from "../../lib/button-variants";
import { getWhatsAppUrl } from "../../config/site";
import { setOpenOverlay, clearOverlayIfCurrent } from "../../lib/overlayCoordination";
import { CART_DRAWER_DIALOG_ID } from "./CartFAB";

const panelVariants: Variants = {
  closed: { x: "100%", transition: { duration: 0.45, ease: [0.76, 0, 0.24, 1] } },
  open: { x: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

interface FormErrors {
  name?: string;
  phone?: string;
  branchId?: string;
  deliveryAddress?: string;
  deliveryZoneId?: string;
}

export function OrderDrawer() {
  const cart = useCart();
  const {
    lines,
    orderType,
    branchId,
    branch,
    deliveryZoneId,
    customer,
    isDrawerOpen,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeItem,
    updateLineInstructions,
    setOrderType,
    setBranch,
    setDeliveryZone,
    updateCustomer,
    closeDrawer,
    clearCart,
    buildWhatsAppMessage,
  } = cart;

  const [errors, setErrors] = useState<FormErrors>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerFocusRef = useRef<HTMLButtonElement>(null);
  const externalTriggerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const deliveryZones = branch ? getDeliveryInfo(branch)?.zones ?? [] : [];

  useBodyScrollLock(isDrawerOpen);

  // Captures whatever had focus before opening (the CartFAB, in
  // practice) and restores it when the drawer closes via any path — X
  // button, scrim, or Escape — not just the internal close button focus
  // handled by the effect below.
  useEffect(() => {
    if (!isDrawerOpen) return;
    externalTriggerRef.current = document.activeElement as HTMLElement | null;
    setOpenOverlay("cart");
    return () => {
      externalTriggerRef.current?.focus();
      clearOverlayIfCurrent("cart");
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    triggerFocusRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), select, input, textarea"
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!isValidName(customer.name)) next.name = "Enter your name.";
    if (!isValidPhone(customer.phone)) next.phone = "Enter a valid phone number.";
    if (!branchId) next.branchId = "Choose a branch.";
    if (orderType === "delivery") {
      if (!customer.deliveryAddress.trim()) next.deliveryAddress = "Enter a delivery address.";
      if (deliveryZones.length > 0 && !deliveryZoneId) next.deliveryZoneId = "Choose a delivery zone.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleCheckout() {
    if (!validate() || !branch) return;
    const message = buildWhatsAppMessage();
    window.open(getWhatsAppUrl(message, branch.whatsapp), "_blank", "noopener,noreferrer");
    clearCart();
  }

  const transition = prefersReducedMotion ? { duration: 0.01 } : undefined;

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            key="order-scrim"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition ?? { duration: 0.3 }}
            onClick={closeDrawer}
            aria-hidden="true"
          />

          <motion.div
            key="order-panel"
            id={CART_DRAWER_DIALOG_ID}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#14100D] shadow-2xl"
            variants={panelVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={transition}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h2 className="font-serif text-xl font-semibold text-white">Your Order</h2>
              <button
                ref={triggerFocusRef}
                type="button"
                aria-label="Close order"
                onClick={closeDrawer}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-colors duration-300 hover:border-[#C89A4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89A4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {lines.length === 0 ? (
                <p className="text-sm text-white/60">Your order is empty.</p>
              ) : (
                <ul className="space-y-5">
                  {lines.map((line) => (
                    <li key={line.id} className="flex gap-4 border-b border-white/10 pb-5">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#C89A4B]/10">
                        {line.imageSrc && (
                          <img src={line.imageSrc} alt={line.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-serif text-sm font-semibold text-white">{line.name}</p>
                            {line.variationLabel && (
                              <p className="text-[12px] text-white/50">{line.variationLabel}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${line.name}`}
                            onClick={() => removeItem(line.id)}
                            className="text-white/40 transition-colors duration-300 hover:text-[#C89A4B]"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${line.name}`}
                              onClick={() => updateQuantity(line.id, line.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-white hover:border-[#C89A4B]"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-sm text-white">{line.quantity}</span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${line.name}`}
                              onClick={() => updateQuantity(line.id, line.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-white hover:border-[#C89A4B]"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[13px] font-semibold text-[#C89A4B]">
                            {formatPrice(line.unitPrice * line.quantity)}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={line.specialInstructions ?? ""}
                          onChange={(event) => updateLineInstructions(line.id, event.target.value)}
                          placeholder="Note (e.g. no onions)"
                          className="mt-2 w-full rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:border-[#C89A4B] focus:outline-none"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderType("delivery")}
                    className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-300 ${
                      orderType === "delivery"
                        ? "border-[#C89A4B] bg-[#C89A4B] text-[#14100D]"
                        : "border-white/25 text-white hover:border-[#C89A4B]"
                    }`}
                  >
                    <Truck className="h-4 w-4" aria-hidden="true" />
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("pickup")}
                    className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-300 ${
                      orderType === "pickup"
                        ? "border-[#C89A4B] bg-[#C89A4B] text-[#14100D]"
                        : "border-white/25 text-white hover:border-[#C89A4B]"
                    }`}
                  >
                    <Store className="h-4 w-4" aria-hidden="true" />
                    Pickup
                  </button>
                </div>

                <div>
                  <label className={`${FORM_LABEL_CLASSES} text-white`}>Branch</label>
                  <select
                    value={branchId}
                    onChange={(event) => setBranch(event.target.value)}
                    className={`mt-1.5 ${FORM_INPUT_CLASSES} ${errors.branchId ? FORM_ERROR_INPUT_CLASSES : ""}`}
                  >
                    <option value="">Choose a branch</option>
                    {ACTIVE_LOCATIONS.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.city}
                      </option>
                    ))}
                  </select>
                  {errors.branchId && <p className="mt-1 text-[12px] text-red-400">{errors.branchId}</p>}
                </div>

                {orderType === "delivery" && (
                  <>
                    {deliveryZones.length > 0 && (
                      <div>
                        <label className={`${FORM_LABEL_CLASSES} text-white`}>Delivery Zone</label>
                        <select
                          value={deliveryZoneId}
                          onChange={(event) => setDeliveryZone(event.target.value)}
                          className={`mt-1.5 ${FORM_INPUT_CLASSES} ${
                            errors.deliveryZoneId ? FORM_ERROR_INPUT_CLASSES : ""
                          }`}
                        >
                          <option value="">Choose a zone</option>
                          {deliveryZones.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.label} — {formatPrice(zone.fee)}
                            </option>
                          ))}
                        </select>
                        {errors.deliveryZoneId && (
                          <p className="mt-1 text-[12px] text-red-400">{errors.deliveryZoneId}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <label className={`${FORM_LABEL_CLASSES} text-white`}>Delivery Address</label>
                      <input
                        type="text"
                        value={customer.deliveryAddress}
                        onChange={(event) => updateCustomer({ deliveryAddress: event.target.value })}
                        className={`mt-1.5 ${FORM_INPUT_CLASSES} ${
                          errors.deliveryAddress ? FORM_ERROR_INPUT_CLASSES : ""
                        }`}
                        placeholder="Street, area, landmark"
                      />
                      {errors.deliveryAddress && (
                        <p className="mt-1 text-[12px] text-red-400">{errors.deliveryAddress}</p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className={`${FORM_LABEL_CLASSES} text-white`}>Your Name</label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(event) => updateCustomer({ name: event.target.value })}
                    className={`mt-1.5 ${FORM_INPUT_CLASSES} ${errors.name ? FORM_ERROR_INPUT_CLASSES : ""}`}
                  />
                  {errors.name && <p className="mt-1 text-[12px] text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label className={`${FORM_LABEL_CLASSES} text-white`}>Phone</label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(event) => updateCustomer({ phone: event.target.value })}
                    className={`mt-1.5 ${FORM_INPUT_CLASSES} ${errors.phone ? FORM_ERROR_INPUT_CLASSES : ""}`}
                  />
                  {errors.phone && <p className="mt-1 text-[12px] text-red-400">{errors.phone}</p>}
                </div>

                <div>
                  <label className={`${FORM_LABEL_CLASSES} text-white`}>Special Instructions</label>
                  <textarea
                    value={customer.specialInstructions}
                    onChange={(event) => updateCustomer({ specialInstructions: event.target.value })}
                    rows={2}
                    className={`mt-1.5 ${FORM_INPUT_CLASSES}`}
                  />
                </div>
              </div>
            </div>

            {lines.length > 0 && (
              <div className="border-t border-white/10 px-6 py-5">
                <div className="space-y-1.5 text-[13px] text-white/70">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-white">
                    <span>Estimated Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className={getButtonClasses({ variant: "solid", className: "mt-4 w-full" })}
                >
                  Checkout via WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
