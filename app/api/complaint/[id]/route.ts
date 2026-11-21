import { loadTrail } from "@/lib/trailServer";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/complaint/[id]">,
) {
  const { id: raw } = await ctx.params;
  const id = raw.toUpperCase();
  if (!/^BMC25-\d{6}$/.test(id))
    return Response.json({ error: "Not a complaint ID" }, { status: 400 });
  try {
    const all = await loadTrail(new URL(req.url).origin);
    const record = all[id];
    if (!record)
      return Response.json({ error: "Complaint not found" }, { status: 404 });
    return Response.json({ id, record });
  } catch (e) {
    console.error("complaint lookup failed:", e instanceof Error ? e.message : e);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }
}
