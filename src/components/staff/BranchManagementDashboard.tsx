// src/components/staff/BranchManagementDashboard.tsx
//
// Branch manager / owner control panel: analytics, promotions, staff
// (including hire/fire), and menu management. Promotion and menu writes go
// straight to their repositories, not through a service layer — those
// services' interfaces are scoped to other things (PromotionService to
// *applying* a code to an order, not admin management), so there's no
// service method to route through for admin CRUD. Staff hiring is the one
// exception that does go through a service (SupabaseAuthService.inviteStaff)
// because creating a login account needs the invite-staff Edge Function,
// not a direct table write.
//
// No hard-delete for menu items on purpose — "Hidden" availability already
// removes a dish from customer view (browsing and ordering both) without a
// destructive, irreversible action; per explicit user decision, that's the
// only way to retire a dish here, not a Delete button.
//
// Inventory intentionally has no UI here — deliberately removed at the
// user's request (not needed for this business). SupabaseInventoryRepository
// and the inventory_items table are untouched, just unused; trivial to
// bring back if that changes.
import { useEffect, useState, type SyntheticEvent } from "react";
import { TrendingUp, Tag, Users, UtensilsCrossed, Trophy } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { DashboardCard } from "./DashboardCard";
import { StatusPill } from "./StatusPill";
import type { Branch } from "../../types/branch";
import type { Promotion, PromotionType } from "../../types/promotion";
import type { User } from "../../types/user";
import { supabaseBranchRepository } from "../../repositories/supabase/SupabaseBranchRepository";
import { supabasePromotionRepository } from "../../repositories/supabase/SupabasePromotionRepository";
import { supabaseUserRepository } from "../../repositories/supabase/SupabaseUserRepository";
import { supabaseAnalyticsRepository } from "../../repositories/supabase/SupabaseAnalyticsRepository";
import { supabaseMenuRepository } from "../../repositories/supabase/SupabaseMenuRepository";
import { supabaseAuthService } from "../../services/supabase/SupabaseAuthService";
import type { BranchAnalyticsSummary } from "../../types/analytics";
import type { RoleName } from "../../types/role";
import type { MenuItem, MenuItemAvailabilityStatus, MenuCategoryRecord } from "../../types/menu-item";
import { createPromotionInputSchema } from "../../validators/promotion.schema";
import { createMenuItemInputSchema } from "../../validators/menuItem.schema";
import { useFormState } from "../../hooks/useFormState";
import { getButtonClasses } from "../../lib/button-variants";
import { FORM_INPUT_CLASSES, FORM_LABEL_CLASSES } from "../../lib/constants";
import { formatUgx } from "../../lib/helpers";

interface PromoFormState {
  code: string;
  name: string;
  type: PromotionType;
  value: string;
  startsAt: string;
  endsAt: string;
}

const PROMO_INITIAL: PromoFormState = {
  code: "",
  name: "",
  type: "percentage_discount",
  value: "",
  startsAt: "",
  endsAt: "",
};

// A branch_manager may only hire into these roles — enforced for real by
// the invite-staff Edge Function itself, mirrored here just so the
// dropdown doesn't offer a choice the server will reject. An owner sees
// this same list plus branch_manager.
const SUBORDINATE_ROLES: RoleName[] = ["cashier"];

interface HireFormState {
  fullName: string;
  email: string;
  phone: string;
  role: RoleName;
}

const HIRE_INITIAL: HireFormState = { fullName: "", email: "", phone: "", role: "cashier" };

interface MenuItemFormState {
  name: string;
  description: string;
  categoryId: string;
  basePrice: string;
  imageUrl: string;
  isFeatured: boolean;
  isChefPick: boolean;
}

const MENU_ITEM_INITIAL: MenuItemFormState = {
  name: "",
  description: "",
  categoryId: "",
  basePrice: "",
  imageUrl: "",
  isFeatured: false,
  isChefPick: false,
};

const AVAILABILITY_OPTIONS: MenuItemAvailabilityStatus[] = ["available", "out_of_stock", "hidden"];

export function BranchManagementDashboard() {
  const { role, branchId: ownBranchId, user: currentUser } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string | null>(ownBranchId);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [stats, setStats] = useState<BranchAnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { form, updateField, setForm } = useFormState<PromoFormState>(PROMO_INITIAL);

  const { form: hireForm, updateField: updateHireField, setForm: setHireForm } = useFormState<HireFormState>(HIRE_INITIAL);
  const [hireMessage, setHireMessage] = useState<string | null>(null);
  const [isHiring, setIsHiring] = useState(false);
  const hirableRoles = role === "owner" ? [...SUBORDINATE_ROLES, "branch_manager" as RoleName] : SUBORDINATE_ROLES;

  const [menuCategories, setMenuCategories] = useState<MenuCategoryRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const { form: menuItemForm, updateField: updateMenuItemField, setForm: setMenuItemForm } = useFormState<MenuItemFormState>(MENU_ITEM_INITIAL);
  const [isSavingMenu, setIsSavingMenu] = useState(false);

  useEffect(() => {
    if (role === "owner") {
      supabaseBranchRepository.list({ pageSize: 50 }).then(({ data }) => setBranches(data?.items ?? []));
    }
  }, [role]);

  useEffect(() => {
    if (!branchId) return;
    refreshPromotions();
    refreshStaff();
    loadStats(branchId);
    refreshMenu(branchId);
  }, [branchId]);

  function refreshMenu(forBranchId: string) {
    supabaseMenuRepository.listCategories(forBranchId).then(({ data }) => setMenuCategories(data ?? []));
    supabaseMenuRepository.listItems({ branchId: forBranchId, pageSize: 100 }).then(({ data }) => setMenuItems(data?.items ?? []));
  }

  async function handleCreateCategory(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!branchId || !newCategoryName.trim()) return;

    setIsSavingMenu(true);
    const result = await supabaseMenuRepository.createCategory({
      branchId,
      name: newCategoryName.trim(),
      sortOrder: menuCategories.length,
    });
    setIsSavingMenu(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    setNewCategoryName("");
    refreshMenu(branchId);
  }

  async function handleCreateMenuItem(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!branchId) return;

    const parsed = createMenuItemInputSchema.safeParse({
      branchId,
      name: menuItemForm.name,
      description: menuItemForm.description,
      categoryId: menuItemForm.categoryId,
      basePrice: Number(menuItemForm.basePrice),
      variations: [],
      imageUrl: menuItemForm.imageUrl,
      isFeatured: menuItemForm.isFeatured,
      isChefPick: menuItemForm.isChefPick,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the menu item details.");
      return;
    }

    setIsSavingMenu(true);
    const result = await supabaseMenuRepository.createItem({
      branchId: parsed.data.branchId,
      name: parsed.data.name,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      basePrice: parsed.data.basePrice,
      variations: [],
      imageUrl: parsed.data.imageUrl,
      availability: "available",
      isFeatured: parsed.data.isFeatured,
      isChefPick: parsed.data.isChefPick,
      linkedInventoryItemId: parsed.data.linkedInventoryItemId,
    });
    setIsSavingMenu(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    setMenuItemForm(MENU_ITEM_INITIAL);
    refreshMenu(branchId);
  }

  async function handleSetMenuItemAvailability(item: MenuItem, availability: MenuItemAvailabilityStatus) {
    setError(null);
    const result = await supabaseMenuRepository.setAvailability(item.id, availability);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (branchId) refreshMenu(branchId);
  }

  // Real server-side aggregation via get_branch_analytics_summary (see
  // supabase/migrations/20260724010000_analytics.sql) — replaces the
  // earlier client-computed readout that summed a fetched page of orders
  // in the browser.
  async function loadStats(forBranchId: string) {
    const { data } = await supabaseAnalyticsRepository.getBranchSummary(forBranchId);
    setStats(data);
  }

  function refreshPromotions() {
    if (!branchId) return;
    supabasePromotionRepository.list({ branchId, pageSize: 50 }).then(({ data }) => setPromotions(data?.items ?? []));
  }

  async function handleCreatePromotion(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!branchId) return;

    const parsed = createPromotionInputSchema.safeParse({
      branchId,
      code: form.code.toUpperCase(),
      name: form.name,
      type: form.type,
      value: Number(form.value),
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "",
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : "",
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the promotion details.");
      return;
    }

    setIsSubmitting(true);
    const result = await supabasePromotionRepository.create({
      branchId: parsed.data.branchId,
      code: parsed.data.code,
      name: parsed.data.name,
      type: parsed.data.type,
      value: parsed.data.value,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      isActive: true,
      minOrderValue: parsed.data.minOrderValue,
      usageLimit: parsed.data.usageLimit,
    });
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    setForm(PROMO_INITIAL);
    refreshPromotions();
  }

  async function handleDeactivate(promotion: Promotion) {
    setError(null);
    const result = await supabasePromotionRepository.deactivate(promotion.id);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    refreshPromotions();
  }

  function refreshStaff() {
    if (!branchId) return;
    supabaseUserRepository.list({ branchId, pageSize: 50 }).then(({ data }) => setStaff(data?.items ?? []));
  }

  async function handleHireStaff(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setHireMessage(null);
    if (!branchId) return;

    setIsHiring(true);
    const result = await supabaseAuthService.inviteStaff({
      fullName: hireForm.fullName,
      email: hireForm.email,
      phone: hireForm.phone,
      role: hireForm.role,
      branchId,
    });
    setIsHiring(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    setHireMessage(`Invite sent to ${hireForm.email}.`);
    setHireForm(HIRE_INITIAL);
    refreshStaff();
  }

  async function handleSetStaffStatus(member: User, status: "deactivated" | "active") {
    setError(null);
    const result = await supabaseUserRepository.update(member.id, { status });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    refreshStaff();
  }

  if (role === "owner" && !branchId) {
    return (
      <div className="mx-auto max-w-sm">
        <label htmlFor="branch-mgmt-branch" className={FORM_LABEL_CLASSES}>
          Select A Branch
        </label>
        <select
          id="branch-mgmt-branch"
          className={`${FORM_INPUT_CLASSES} mt-1.5`}
          onChange={(e) => setBranchId(e.target.value || null)}
          defaultValue=""
        >
          <option value="">Choose…</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (!branchId) {
    return <p className="text-center text-sm text-[#14100D]/60">Your account isn't assigned to a branch.</p>;
  }

  return (
    <div>
      {stats && (
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                ["Today", stats.today],
                ["Last 7 Days", stats.last7Days],
                ["Last 30 Days", stats.last30Days],
              ] as const
            ).map(([label, snapshot]) => (
              <div key={label} className="rounded-2xl border border-[#14100D]/10 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(20,16,13,0.4)]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#14100D]/50">{label}</p>
                  <TrendingUp size={14} className="text-[#C89A4B]" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <p className="text-2xl font-semibold text-[#14100D]">{snapshot.orderCount}</p>
                  <p className="text-xs text-[#14100D]/50">orders</p>
                </div>
                <p className="mt-1 text-sm font-medium text-[#14100D]">{formatUgx(snapshot.revenue)} revenue</p>
                <p className="text-xs text-[#14100D]/50">Avg order {formatUgx(snapshot.averageOrderValue)}</p>
              </div>
            ))}
          </div>

          {stats.topSellingItems.length > 0 && (
            <DashboardCard title="Top Sellers (30 Days)" icon={Trophy} className="mt-4">
              <div className="flex flex-wrap gap-2">
                {stats.topSellingItems.map((item, i) => (
                  <span
                    key={item.menuItemId}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      i === 0 ? "bg-[#C89A4B] text-white" : "bg-[#F5EFE4] text-[#14100D]"
                    }`}
                  >
                    {item.name} · {item.unitsSold}
                  </span>
                ))}
              </div>
            </DashboardCard>
          )}
        </div>
      )}

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <DashboardCard title="Promotions" icon={Tag}>
        <div className="mb-6 flex flex-col gap-3">
          {promotions.length === 0 && <p className="text-sm text-[#14100D]/50">No promotions yet.</p>}
          {promotions.map((promo) => (
            <div key={promo.id} className="flex items-center justify-between rounded-xl border border-[#14100D]/10 bg-[#F5EFE4]/40 p-4">
              <div>
                <p className="text-sm font-semibold text-[#14100D]">{promo.code}</p>
                <p className="text-xs text-[#14100D]/50">
                  {promo.name} · {promo.type === "percentage_discount" ? `${promo.value}%` : promo.type === "fixed_discount" ? formatUgx(promo.value) : promo.type} · used {promo.usageCount}
                  {promo.usageLimit ? `/${promo.usageLimit}` : ""}
                </p>
              </div>
              {promo.isActive ? (
                <button type="button" onClick={() => handleDeactivate(promo)} className="text-xs font-semibold text-red-600 underline underline-offset-4">
                  Deactivate
                </button>
              ) : (
                <span className="text-xs text-[#14100D]/40">Inactive</span>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleCreatePromotion} className="flex flex-col gap-3 rounded-xl border border-[#14100D]/10 bg-[#F5EFE4]/40 p-5">
          <p className="text-sm font-semibold text-[#14100D]">New Promotion</p>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="CODE" value={form.code} onChange={(e) => updateField("code", e.target.value)} className={FORM_INPUT_CLASSES} />
            <input placeholder="Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} className={FORM_INPUT_CLASSES} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.type} onChange={(e) => updateField("type", e.target.value as PromotionType)} className={FORM_INPUT_CLASSES}>
              <option value="percentage_discount">Percentage Discount</option>
              <option value="fixed_discount">Fixed Discount (UGX)</option>
              <option value="free_delivery">Free Delivery</option>
            </select>
            <input
              type="number"
              placeholder={form.type === "percentage_discount" ? "% off" : "UGX off"}
              value={form.value}
              onChange={(e) => updateField("value", e.target.value)}
              className={FORM_INPUT_CLASSES}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="datetime-local" value={form.startsAt} onChange={(e) => updateField("startsAt", e.target.value)} className={FORM_INPUT_CLASSES} />
            <input type="datetime-local" value={form.endsAt} onChange={(e) => updateField("endsAt", e.target.value)} className={FORM_INPUT_CLASSES} />
          </div>
          <button type="submit" disabled={isSubmitting} className={getButtonClasses({ variant: "solid", size: "sm", className: "disabled:opacity-60" })}>
            {isSubmitting ? "Creating…" : "Create Promotion"}
          </button>
        </form>
      </DashboardCard>

      <DashboardCard title="Staff" icon={Users}>
        {hireMessage && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{hireMessage}</p>}

        <div className="mb-6 flex flex-col gap-2">
          {staff.map((member) => {
            const isSelf = member.id === currentUser?.id;
            const canManage = role === "owner" ? !isSelf : SUBORDINATE_ROLES.includes(member.role) && !isSelf;
            return (
              <div key={member.id} className="rounded-xl border border-[#14100D]/10 bg-[#F5EFE4]/40 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#14100D]">{member.fullName}</span>
                  <StatusPill
                    label={`${member.role.replace("_", " ")} · ${member.status}`}
                    tone={member.status === "deactivated" ? "red" : member.status === "invited" ? "amber" : "emerald"}
                  />
                </div>
                {canManage && (
                  <div className="mt-2">
                    {member.status === "deactivated" ? (
                      <button type="button" onClick={() => handleSetStaffStatus(member, "active")} className="text-xs font-semibold text-[#C89A4B] underline underline-offset-4">
                        Reactivate
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleSetStaffStatus(member, "deactivated")} className="text-xs font-semibold text-red-600 underline underline-offset-4">
                        Fire (Deactivate)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleHireStaff} className="flex flex-col gap-3 rounded-xl border border-[#14100D]/10 bg-[#F5EFE4]/40 p-5">
          <p className="text-sm font-semibold text-[#14100D]">Hire Staff</p>
          <input placeholder="Full name" value={hireForm.fullName} onChange={(e) => updateHireField("fullName", e.target.value)} className={FORM_INPUT_CLASSES} />
          <input type="email" placeholder="Email" value={hireForm.email} onChange={(e) => updateHireField("email", e.target.value)} className={FORM_INPUT_CLASSES} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Phone" value={hireForm.phone} onChange={(e) => updateHireField("phone", e.target.value)} className={FORM_INPUT_CLASSES} />
            <select value={hireForm.role} onChange={(e) => updateHireField("role", e.target.value as RoleName)} className={FORM_INPUT_CLASSES}>
              {hirableRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={isHiring} className={getButtonClasses({ variant: "solid", size: "sm", className: "disabled:opacity-60" })}>
            {isHiring ? "Sending Invite…" : "Send Invite"}
          </button>
        </form>
      </DashboardCard>
      </div>

      <DashboardCard title="Menu" icon={UtensilsCrossed} className="mt-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {menuCategories.map((category) => (
            <span key={category.id} className="rounded-full bg-[#F5EFE4] px-3 py-1 text-xs font-semibold text-[#14100D]">
              {category.name}
            </span>
          ))}
          <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
            <input
              placeholder="New category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className={`${FORM_INPUT_CLASSES} h-9 w-40 text-xs`}
            />
            <button type="submit" disabled={isSavingMenu} className="rounded-lg border border-[#14100D]/15 px-3 py-1.5 text-xs font-semibold text-[#14100D] disabled:opacity-60">
              Add Category
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            {menuCategories.length === 0 && <p className="text-sm text-[#14100D]/50">Add a category before adding dishes.</p>}
            {menuCategories.map((category) => {
              const itemsInCategory = menuItems.filter((item) => item.categoryId === category.id);
              if (itemsInCategory.length === 0) return null;
              return (
                <div key={category.id}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#14100D]/40">{category.name}</p>
                  <div className="flex flex-col gap-2">
                    {itemsInCategory.map((item) => (
                      <div key={item.id} className="rounded-xl border border-[#14100D]/10 bg-[#F5EFE4]/40 p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#14100D]">{item.name}</span>
                          <span className="font-medium text-[#14100D]/60">{formatUgx(item.basePrice)}</span>
                        </div>
                        {item.description && <p className="mt-1 text-xs text-[#14100D]/50">{item.description}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {AVAILABILITY_OPTIONS.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleSetMenuItemAvailability(item, status)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                                item.availability === status
                                  ? "border-[#C89A4B] bg-[#C89A4B]/10 text-[#C89A4B]"
                                  : "border-[#14100D]/15 bg-white text-[#14100D]/60 hover:border-[#14100D]/30"
                              }`}
                            >
                              {status.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCreateMenuItem} className="flex h-fit flex-col gap-3 rounded-xl border border-[#14100D]/10 bg-[#F5EFE4]/40 p-5">
            <p className="text-sm font-semibold text-[#14100D]">New Dish</p>
            <input placeholder="Name" value={menuItemForm.name} onChange={(e) => updateMenuItemField("name", e.target.value)} className={FORM_INPUT_CLASSES} />
            <textarea
              placeholder="Description"
              value={menuItemForm.description}
              onChange={(e) => updateMenuItemField("description", e.target.value)}
              className={`${FORM_INPUT_CLASSES} min-h-[4.5rem]`}
            />
            <div className="grid grid-cols-2 gap-3">
              <select value={menuItemForm.categoryId} onChange={(e) => updateMenuItemField("categoryId", e.target.value)} className={FORM_INPUT_CLASSES}>
                <option value="">Category…</option>
                {menuCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Price (UGX)"
                value={menuItemForm.basePrice}
                onChange={(e) => updateMenuItemField("basePrice", e.target.value)}
                className={FORM_INPUT_CLASSES}
              />
            </div>
            <input
              placeholder="Image URL"
              value={menuItemForm.imageUrl}
              onChange={(e) => updateMenuItemField("imageUrl", e.target.value)}
              className={FORM_INPUT_CLASSES}
            />
            <div className="flex items-center gap-4 text-xs text-[#14100D]/70">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={menuItemForm.isFeatured} onChange={(e) => updateMenuItemField("isFeatured", e.target.checked)} />
                Featured
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={menuItemForm.isChefPick} onChange={(e) => updateMenuItemField("isChefPick", e.target.checked)} />
                Chef's Pick
              </label>
            </div>
            <button
              type="submit"
              disabled={isSavingMenu || menuCategories.length === 0}
              className={getButtonClasses({ variant: "solid", size: "sm", className: "disabled:opacity-60" })}
            >
              {isSavingMenu ? "Saving…" : "Add Dish"}
            </button>
          </form>
        </div>
      </DashboardCard>
    </div>
  );
}
