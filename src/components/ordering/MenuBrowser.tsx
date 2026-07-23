// src/components/ordering/MenuBrowser.tsx
//
// Branch picker + real (DB-backed) menu grid + cart summary bar. Reads
// through SupabaseMenuRepository directly — the customer-ordering page's
// own data-fetching layer, not services/MenuService.ts (that interface is
// for the future menu-management feature's write paths; this only reads).
import { useEffect, useState } from "react";
import type { Branch } from "../../types/branch";
import type { MenuCategoryRecord, MenuItem } from "../../types/menu-item";
import { supabaseMenuRepository } from "../../repositories/supabase/SupabaseMenuRepository";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";
import type { UseOrderCartResult } from "../../hooks/useOrderCart";

function formatUgx(amount: number): string {
  return `UGX ${amount.toLocaleString("en-UG")}`;
}

interface MenuBrowserProps {
  branches: Branch[];
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch) => void;
  cart: UseOrderCartResult;
  onProceedToCheckout: () => void;
}

export function MenuBrowser({ branches, selectedBranch, onSelectBranch, cart, onProceedToCheckout }: MenuBrowserProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBranch) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      supabaseMenuRepository.listItems({ branchId: selectedBranch.id, availability: "available", pageSize: 100 }),
      supabaseMenuRepository.listCategories(selectedBranch.id),
    ]).then(([itemsResult, categoriesResult]) => {
      if (!isMounted) return;
      if (itemsResult.error || !itemsResult.data) {
        setError(itemsResult.error?.message ?? "Couldn't load the menu.");
        setIsLoading(false);
        return;
      }
      setItems(itemsResult.data.items);
      setCategories(categoriesResult.data ?? []);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedBranch]);

  const categoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? "Menu";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="order-branch" className={FORM_LABEL_CLASSES}>
          Order From
        </label>
        <select
          id="order-branch"
          value={selectedBranch?.id ?? ""}
          onChange={(e) => {
            const branch = branches.find((b) => b.id === e.target.value);
            if (branch) onSelectBranch(branch);
          }}
          className={FORM_INPUT_CLASSES}
        >
          <option value="">Select a branch…</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.city}
            </option>
          ))}
        </select>
      </div>

      {selectedBranch && isLoading && <p className="text-sm text-[#14100D]/60">Loading menu…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {selectedBranch && !isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col justify-between rounded-2xl border border-[#14100D]/10 bg-white p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C89A4B]">
                  {categoryName(item.categoryId)}
                </p>
                <h3 className="mt-1 font-serif text-lg font-semibold text-[#14100D]">{item.name}</h3>
                <p className="mt-1 text-sm text-[#14100D]/60">{item.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#14100D]">{formatUgx(item.basePrice)}</span>
                <button
                  type="button"
                  onClick={() => cart.addItem(item)}
                  className={getButtonClasses({ variant: "outline", tone: "light", size: "sm" })}
                >
                  Add
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-[#14100D]/60">Nothing available at this branch right now.</p>
          )}
        </div>
      )}

      {cart.lines.length > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-2xl border border-[#14100D]/10 bg-white p-5 shadow-[0_20px_45px_-20px_rgba(20,16,13,0.25)]">
          <div>
            <p className="text-sm font-semibold text-[#14100D]">
              {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"} — {formatUgx(cart.subtotal)}
            </p>
          </div>
          <button
            type="button"
            onClick={onProceedToCheckout}
            className={getButtonClasses({ variant: "solid", size: "md" })}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}
