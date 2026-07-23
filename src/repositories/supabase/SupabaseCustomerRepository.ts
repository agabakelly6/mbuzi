// src/repositories/supabase/SupabaseCustomerRepository.ts
import type { CustomerRepository } from "../CustomerRepository";
import type { Customer } from "../../types/customer";
import type { ListOptions, Paginated, RepositoryResult } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapCustomerRow, type CustomerRow } from "../../lib/supabase/mapCustomerRow";

const DEFAULT_PAGE_SIZE = 20;

export const supabaseCustomerRepository: CustomerRepository = {
  async findById(id: string): Promise<RepositoryResult<Customer>> {
    const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapCustomerRow(data as CustomerRow), error: null };
  },

  async findByPhone(phone: string): Promise<RepositoryResult<Customer>> {
    const { data, error } = await supabase.from("customers").select("*").eq("phone", phone).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapCustomerRow(data as CustomerRow), error: null };
  },

  async findByUserId(userId: string): Promise<RepositoryResult<Customer>> {
    const { data, error } = await supabase.from("customers").select("*").eq("user_id", userId).maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapCustomerRow(data as CustomerRow), error: null };
  },

  async list(options?: ListOptions): Promise<RepositoryResult<Paginated<Customer>>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order(options?.sortBy ?? "created_at", { ascending: options?.sortDirection !== "desc" })
      .range(from, to);
    if (error) return { data: null, error: mapDbError(error) };

    return {
      data: {
        items: ((data ?? []) as CustomerRow[]).map(mapCustomerRow),
        total: count ?? 0,
        page,
        pageSize,
      },
      error: null,
    };
  },

  async create(customer) {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        user_id: customer.userId ?? null,
        full_name: customer.fullName,
        phone: customer.phone,
        email: customer.email ?? null,
        default_delivery_address: customer.defaultDeliveryAddress ?? null,
        preferred_branch_id: customer.preferredBranchId ?? null,
        marketing_opt_in: customer.marketingOptIn,
      })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapCustomerRow(data as CustomerRow), error: null };
  },

  async update(id, changes) {
    const patch: Record<string, unknown> = {};
    if (changes.fullName !== undefined) patch.full_name = changes.fullName;
    if (changes.phone !== undefined) patch.phone = changes.phone;
    if (changes.email !== undefined) patch.email = changes.email;
    if (changes.defaultDeliveryAddress !== undefined) patch.default_delivery_address = changes.defaultDeliveryAddress;
    if (changes.preferredBranchId !== undefined) patch.preferred_branch_id = changes.preferredBranchId;
    if (changes.marketingOptIn !== undefined) patch.marketing_opt_in = changes.marketingOptIn;

    const { data, error } = await supabase.from("customers").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapCustomerRow(data as CustomerRow), error: null };
  },

  async delete(id: string): Promise<RepositoryResult<void>> {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return { data: null, error: mapDbError(error) };
    return { data: null, error: null };
  },
};
