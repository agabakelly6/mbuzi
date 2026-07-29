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
import { X, Trash2, Truck, Store, LocateFixed, CircleAlert } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { ACTIVE_LOCATIONS } from "../../data/locations";
import { getDeliveryInfo } from "../../data/delivery";
import { formatPrice } from "../../lib/cart/cartUtils";
import { MAX_DELIVERY_RADIUS_KM } from "../../lib/geo";
import { getRoutedDeliveryDistance } from "../../lib/deliveryFee";
import { supabaseBranchRepository } from "../../repositories/supabase/SupabaseBranchRepository";
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
}

export function OrderDrawer() {
  const cart = useCart();
  const {
    lines,
    orderType,
    branchId,
    branch,
    deliveryDistanceKm,
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
    setDeliveryLocation,
    updateCustomer,
    closeDrawer,
    clearCart,
    buildWhatsAppMessage,
  } = cart;

  const [errors, setErrors] = useState<FormErrors>({});
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "error">("idle");
  const [locationError, setLocationError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerFocusRef = useRef<HTMLButtonElement>(null);
  const externalTriggerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const deliveryAvailable = branch ? getDeliveryInfo(branch) !== null : false;
  const deliveryTooFar = deliveryDistanceKm !== null && deliveryDistanceKm > MAX_DELIVERY_RADIUS_KM;

  useBodyScrollLock(isDrawerOpen);

  // A distance/location result is only valid for the branch it was measured
  // against — switching branches invalidates it (CartStore.setBranch already
  // clears deliveryDistanceKm; this clears the local share-location UI state
  // to match rather than showing a stale "granted" result for a new branch).
  useEffect(() => {
    setLocationStatus("idle");
    setLocationError(null);
  }, [branchId]);

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

  async function handleShareLocation() {
    if (!branch) return;
    // Every press re-acquires a fresh fix and clears whatever the last
    // press produced first — a stale distance/fee must never linger (or
    // get sent in the WhatsApp message) while a new one is in flight, and
    // maximumAge: 0 below forces a live GPS reading, never a cached one.
    setDeliveryLocation(null, null);
    setLocationStatus("requesting");
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("Location sharing isn't available on this device or browser — enter your delivery address instead.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data: branchRow, error: branchError } = await supabaseBranchRepository.findBySlug(branch.id);
          if (branchError || !branchRow || branchRow.latitude === null || branchRow.longitude === null) {
            throw new Error("branch coordinates unavailable");
          }
          const { distanceKm, durationMin } = await getRoutedDeliveryDistance(
            branchRow.id,
            position.coords.latitude,
            position.coords.longitude
          );
          setDeliveryLocation(distanceKm, durationMin);
          setLocationStatus("granted");
        } catch {
          setLocationStatus("error");
          setLocationError(
            "We couldn't calculate your exact delivery fee right now — enter your delivery address instead and we'll confirm the fee by phone."
          );
        }
      },
      (geoError) => {
        setLocationStatus("error");
        setLocationError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was denied. Enter your delivery address instead, or allow location access to get an exact quote."
            : "Couldn't get your location — enter your delivery address instead and we'll confirm the fee by phone."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!isValidName(customer.name)) next.name = "Enter your name.";
    if (!isValidPhone(customer.phone)) next.phone = "Enter a valid phone number.";
    if (!branchId) next.branchId = "Choose a branch.";
    if (orderType === "delivery") {
      if (!customer.deliveryAddress.trim()) next.deliveryAddress = "Enter a delivery address.";
      else if (deliveryTooFar) {
        next.deliveryAddress = `This address is outside our ${MAX_DELIVERY_RADIUS_KM} km delivery radius — choose pickup instead.`;
      }
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
                    {deliveryAvailable && (
                      <div className="flex flex-col gap-2">
                        <label className={`${FORM_LABEL_CLASSES} text-white`}>Delivery Location</label>
                        {locationStatus === "granted" && deliveryDistanceKm !== null ? (
                          deliveryTooFar ? (
                            <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-300">
                              <CircleAlert size={14} className="shrink-0" />
                              About {deliveryDistanceKm.toFixed(1)} km away — outside our {MAX_DELIVERY_RADIUS_KM} km
                              delivery radius. Please choose pickup instead.
                              <button
                                type="button"
                                onClick={handleShareLocation}
                                className="ml-auto shrink-0 font-semibold underline underline-offset-4"
                              >
                                Update
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2.5 text-[12px] text-emerald-300">
                              <LocateFixed size={14} className="shrink-0" />
                              Location shared — about {deliveryDistanceKm.toFixed(1)} km ({formatPrice(deliveryFee)}).
                              <button
                                type="button"
                                onClick={handleShareLocation}
                                className="ml-auto shrink-0 font-semibold underline underline-offset-4"
                              >
                                Update
                              </button>
                            </div>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={handleShareLocation}
                            disabled={locationStatus === "requesting"}
                            className={getButtonClasses({ variant: "outline", size: "md", className: "disabled:opacity-60" })}
                          >
                            <LocateFixed size={16} className="mr-1.5" />
                            {locationStatus === "requesting" ? "Getting Your Location…" : "Share My Location"}
                          </button>
                        )}
                        {locationStatus === "error" && locationError && (
                          <p role="alert" className="flex items-start gap-2 text-[12px] text-red-400">
                            <CircleAlert size={14} className="mt-0.5 shrink-0" />
                            {locationError}
                          </p>
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
                      {deliveryDistanceKm === null && !errors.deliveryAddress && (
                        <p className="mt-1 text-[12px] text-white/40">
                          We'll confirm your exact delivery fee by phone before your order is prepared.
                        </p>
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
                  {orderType === "delivery" && (
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className={deliveryTooFar ? "font-semibold text-red-400" : undefined}>
                        {deliveryTooFar ? "Unavailable" : deliveryDistanceKm !== null ? formatPrice(deliveryFee) : "To be confirmed"}
                      </span>
                    </div>
                  )}
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
