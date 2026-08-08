import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }

    const { invite_id } = await req.json();
    if (!invite_id) {
      return json({ error: "invite_id is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("INVITE_FROM_EMAIL") ??
      "StockFlow <onboarding@resend.dev>";

    if (!resendKey) {
      return json({ error: "RESEND_API_KEY not configured" }, 500);
    }

    // Caller-scoped client (RLS applies)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Service role for reliable read after insert
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: invite, error: inviteError } = await admin
      .from("organization_invites")
      .select("id, email, role, status, organization_id, expires_at")
      .eq("id", invite_id)
      .single();

    if (inviteError || !invite) {
      return json({ error: "Invite not found" }, 404);
    }

    if (invite.status !== "pending") {
      return json({ error: "Invite is not pending" }, 400);
    }

    // Verify caller is owner/admin of that org
    const { data: membership } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", invite.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return json({ error: "Forbidden" }, 403);
    }

    const { data: org } = await admin
      .from("organizations")
      .select("name")
      .eq("id", invite.organization_id)
      .single();

    const orgName = org?.name ?? "a StockFlow workspace";
    const expires = new Date(invite.expires_at).toLocaleDateString();

    const subject = `You're invited to join ${orgName} on StockFlow`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Join ${escapeHtml(orgName)}</h2>
        <p>You've been invited as <strong>${
      escapeHtml(invite.role)
    }</strong> on StockFlow.</p>
        <p>Open the StockFlow app and <strong>sign in or register with this email address</strong>:</p>
        <p style="font-size: 16px;"><strong>${
      escapeHtml(invite.email)
    }</strong></p>
        <p>You'll be added to the workspace automatically after sign-in.</p>
        <p style="color: #64748b; font-size: 13px;">This invite expires on ${
      escapeHtml(expires)
    }.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">StockFlow · inventory for growing businesses</p>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [invite.email],
        subject,
        html,
      }),
    });

    const resendBody = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error", resendBody);
      return json(
        { error: resendBody?.message ?? "Failed to send email" },
        502,
      );
    }

    return json({ ok: true, id: resendBody.id });
  } catch (err) {
    console.error(err);
    return json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      500,
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
