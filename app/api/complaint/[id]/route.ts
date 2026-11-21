export const runtime = "nodejs";

type Trail = Record<string, unknown>;

// complaint_trail.json is 3.7 MB: it stays on the server, is fetched once from
// our own origin, and only the one requested record is sent to the client.
let trail: Promise<Trail> | null = null;

function load(origin: string): Promise<Trail> {
  if (!trail) {
    trail = fetch(`${origin}/data/complaint_trail.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`complaint_trail.json: HTTP ${r.status}`);
        return r.text();
      })
      // The engine can write bare NaN (invalid JSON) for missing values.
      .then((t) => JSON.parse(t.replace(/:\s*-?NaN\b/g, ": null")) as Trail)
      .catch((e) => {
        trail = null; // retry on the next request
        throw e;
      });
  }
  return trail;
}

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/complaint/[id]">,
) {
  const { id: raw } = await ctx.params;
  const id = raw.toUpperCase();
  if (!/^BMC25-\d{6}$/.test(id))
    return Response.json({ error: "Not a complaint ID" }, { status: 400 });
  try {
    const all = await load(new URL(req.url).origin);
    const record = all[id];
    if (!record)
      return Response.json({ error: "Complaint not found" }, { status: 404 });
    return Response.json({ id, record });
  } catch (e) {
    console.error("complaint lookup failed:", e instanceof Error ? e.message : e);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }
}
