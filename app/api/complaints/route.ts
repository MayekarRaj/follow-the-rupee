import { loadTrail } from "@/lib/trailServer";

export const runtime = "nodejs";

/**
 * GET /api/complaints?ward=F/N&limit=5
 * The latest resolved complaints in a ward (newest repair first), with the
 * few fields the Citizen home screen needs. The ward is a query parameter
 * because ward codes contain a slash.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ward = (url.searchParams.get("ward") ?? "").toUpperCase();
  if (!/^[A-Z](\/[A-Z])?$/.test(ward))
    return Response.json({ error: "Not a ward code" }, { status: 400 });
  const limit = Math.min(
    20,
    Math.max(1, Number(url.searchParams.get("limit")) || 5),
  );
  try {
    const all = await loadTrail(url.origin);
    const items = Object.entries(all)
      .filter(([, r]) => r.ward === ward && r.status === "Resolved" && r.work_order)
      .map(([id, r]) => ({ id, r, w: r.work_order! }))
      .sort(
        (a, b) =>
          b.w.completed_at.localeCompare(a.w.completed_at) ||
          b.id.localeCompare(a.id),
      )
      .slice(0, limit)
      .map(({ id, r, w }) => ({
        id,
        category: r.category ?? null,
        completed_at: w.completed_at,
        road: w.road,
        contractor: w.contractor,
        method: w.method,
        billed_inr: w.billed_inr,
        cost_ratio: w.cost_ratio,
        held_up_30d: w.held_up_30d,
        flags: w.flags,
      }));
    return Response.json({ ward, items });
  } catch (e) {
    console.error("recent fixes failed:", e instanceof Error ? e.message : e);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }
}
