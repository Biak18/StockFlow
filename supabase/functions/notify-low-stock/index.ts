import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ProductRow = {
  id: string;
  name: string;
  quantity: number;
  min_stock_level: number;
  organization_id: string;
  deleted_at?: string | null;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: ProductRow;
  old_record?: ProductRow | null;
  // allow direct/manual invokes too
  organization_id?: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  min_stock_level?: number;
  kind?: "low" | "out";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return json("ok", 200);
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing Supabase env" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = (await req.json()) as WebhookPayload;

    // --- Normalize webhook vs manual body ---
    const row: ProductRow | null = body.record
      ? body.record
      : body.organization_id && body.product_id
      ? {
        id: body.product_id,
        name: body.product_name ?? "Product",
        quantity: body.quantity ?? 0,
        min_stock_level: body.min_stock_level ?? 0,
        organization_id: body.organization_id,
      }
      : null;

    const old = body.old_record ?? null;

    if (!row?.id || !row.organization_id) {
      return json({ ok: true, skipped: "invalid_payload" });
    }

    // Ignore soft-deleted products if you use deleted_at
    if (row.deleted_at) {
      return json({ ok: true, skipped: "deleted" });
    }

    // --- Decide kind ---
    let kind: "low" | "out" | null = body.kind ?? null;

    if (!kind) {
      if (row.quantity <= 0) kind = "out";
      else if (row.min_stock_level > 0 && row.quantity <= row.min_stock_level) {
        kind = "low";
      }
    }

    if (!kind) {
      return json({ ok: true, skipped: "ok_stock" });
    }

    // --- Only notify when entering a bad state (reduce spam) ---
    if (old) {
      const wasOut = old.quantity <= 0;
      const wasLow = old.min_stock_level > 0 &&
        old.quantity > 0 &&
        old.quantity <= old.min_stock_level;

      if (kind === "out" && wasOut) {
        return json({ ok: true, skipped: "already_out" });
      }
      if (kind === "low" && wasLow) {
        return json({ ok: true, skipped: "already_low" });
      }
      // out takes priority; if was low and now out → notify
    }

    // --- Members of this org ---
    const { data: members, error: membersError } = await admin
      .from("organization_members")
      .select("user_id, role")
      .eq("organization_id", row.organization_id);

    if (membersError) {
      console.error("members error", membersError);
      return json({ error: membersError.message }, 500);
    }

    if (!members?.length) {
      return json({ ok: true, sent: 0, reason: "no_members" });
    }

    // Optional: only owners/admins
    // const userIds = members
    //   .filter((m) => m.role === 'owner' || m.role === 'admin')
    //   .map((m) => m.user_id);
    const userIds = members.map((m) => m.user_id);

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, push_token")
      .in("id", userIds)
      .not("push_token", "is", null);

    if (profilesError) {
      console.error("profiles error", profilesError);
      return json({ error: profilesError.message }, 500);
    }

    const tokens = Array.from(
      new Set(
        (profiles ?? [])
          .map((p) => p.push_token)
          .filter(
            (t): t is string =>
              typeof t === "string" && t.startsWith("ExponentPushToken"),
          ),
      ),
    );

    if (!tokens.length) {
      return json({ ok: true, sent: 0, reason: "no_tokens" });
    }

    const title = kind === "out" ? "Out of stock" : "Low stock";
    const message = kind === "out"
      ? `${row.name} is out of stock`
      : `${row.name} is low (${row.quantity} left; min ${row.min_stock_level})`;

    // Expo accepts an array (max 100 per request)
    const chunks = chunk(tokens, 100);
    const tickets: unknown[] = [];

    for (const group of chunks) {
      const messages = group.map((to) => ({
        to,
        sound: "default",
        title,
        body: message,
        priority: "high" as const,
        channelId: "low-stock",
        data: {
          product_id: row.id,
          organization_id: row.organization_id,
          kind,
        },
      }));

      const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const expoJson = await expoRes.json();

      if (!expoRes.ok) {
        console.error("Expo push failed", expoJson);
        return json(
          { error: "Expo push failed", details: expoJson },
          502,
        );
      }

      tickets.push(expoJson);
    }

    return json({
      ok: true,
      sent: tokens.length,
      kind,
      product_id: row.id,
      tickets,
    });
  } catch (err) {
    console.error("notify-low-stock error", err);
    return json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      500,
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(
    typeof body === "string" ? body : JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": typeof body === "string"
          ? "text/plain"
          : "application/json",
      },
    },
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}
