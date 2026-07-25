// supabase/functions/invite-staff/index.ts
//
// The one operation in this whole platform that genuinely needs a server:
// creating another person's login account requires the service-role key,
// which must never reach a browser bundle. Edge Functions are the only
// place on this project (static Astro output, no adapter) that key can
// live — Supabase injects it automatically as SUPABASE_SERVICE_ROLE_KEY,
// so it's never passed in by the caller or stored in this repo.
//
// Authorization is re-checked here, not trusted from the client, exactly
// like every Postgres RLS policy and SECURITY DEFINER function elsewhere
// in this project: only 'owner' and 'branch_manager' may call this at all,
// a branch_manager may only hire into their OWN branch (branchId from the
// request body is ignored and overridden) and only into a subordinate role
// (waiter/cashier/chef/rider) — never another branch_manager or owner,
// which would let a manager mint a peer or superior account.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUBORDINATE_ROLES = ["waiter", "cashier", "chef", "rider"];
const HIRABLE_ROLES = [...SUBORDINATE_ROLES, "branch_manager"];

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "missing_authorization" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  // Prefers the new "secret" API key (set as a function secret named
  // STAFF_INVITE_SECRET_KEY) over the auto-injected legacy service_role
  // JWT — this project has migrated to asymmetric JWT Signing Keys, and
  // the legacy key no longer verifies against auth.admin endpoints
  // ("unrecognized JWT kid ... for algorithm ES256"). Falls back to the
  // legacy key only so this keeps working on a project that hasn't
  // migrated yet.
  const serviceRoleKey = Deno.env.get("STAFF_INVITE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Scoped only to identifying who's calling — never used for privileged writes.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerAuth, error: callerAuthError } = await callerClient.auth.getUser();
  if (callerAuthError || !callerAuth.user) return json({ error: "invalid_session" }, 401);

  // Privileged client — service-role key never leaves this function.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerRow, error: callerRowError } = await adminClient
    .from("users")
    .select("role, branch_id")
    .eq("id", callerAuth.user.id)
    .maybeSingle();
  if (callerRowError || !callerRow) return json({ error: "caller_profile_missing" }, 403);
  if (callerRow.role !== "owner" && callerRow.role !== "branch_manager") {
    return json({ error: "forbidden" }, 403);
  }

  let body: { fullName?: string; email?: string; phone?: string; role?: string; branchId?: string | null };
  try {
    body = await req.json();
  } catch {
    return json({ error: "validation_error", message: "Invalid JSON body." }, 400);
  }

  const { fullName, email, role } = body;
  const phone = body.phone ?? "";
  if (!fullName?.trim() || !email?.trim() || !role) {
    return json({ error: "validation_error", message: "fullName, email, and role are required." }, 400);
  }

  let branchId: string | null;

  if (callerRow.role === "branch_manager") {
    if (!SUBORDINATE_ROLES.includes(role)) {
      return json({ error: "forbidden_role", message: "A branch manager can only hire waiter, cashier, chef, or rider." }, 403);
    }
    // Ignore whatever branchId the client sent — a manager can only ever hire into their own branch.
    branchId = callerRow.branch_id as string;
  } else {
    if (!HIRABLE_ROLES.includes(role)) {
      return json({ error: "forbidden_role", message: "That role can't be created through staff invites." }, 403);
    }
    branchId = body.branchId ?? null;
    if (!branchId) return json({ error: "validation_error", message: "branchId is required." }, 400);
  }

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      phone,
    },
  });

  if (inviteError) {
    const isDuplicate = /already been registered|already exists/i.test(inviteError.message);
    return json({ error: isDuplicate ? "conflict" : "invite_failed", message: inviteError.message }, isDuplicate ? 409 : 400);
  }

  // role/branch_id/status are set via app_metadata, not the invite's
  // `data` above (which becomes user_metadata) — app_metadata can only be
  // written through this service-role-backed admin API, never by a public
  // self-signup, so this is the one place a staff role can actually be
  // granted from. handle_user_app_metadata_update() (the DB trigger) picks
  // this up and syncs it onto public.users.
  const { error: metaError } = await adminClient.auth.admin.updateUserById(invited.user.id, {
    app_metadata: {
      role,
      branch_id: branchId,
      status: "invited",
    },
  });

  if (metaError) {
    await adminClient.auth.admin.deleteUser(invited.user.id).catch(() => {});
    return json({ error: "invite_failed", message: metaError.message }, 400);
  }

  return json(
    {
      data: {
        id: invited.user.id,
        email: invited.user.email,
        fullName,
        phone,
        role,
        branchId,
        status: "invited",
      },
    },
    201,
  );
});
