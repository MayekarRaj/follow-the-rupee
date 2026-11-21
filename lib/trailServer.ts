// Server-only. complaint_trail.json is 3.7 MB: it stays on the server, is
// fetched once from our own origin, and only small slices go to the client.
export type TrailRecord = Record<string, unknown> & {
  status?: string;
  ward?: string | null;
  received_at?: string;
  work_order?: {
    id: string;
    road: string;
    contractor: string;
    method: string;
    completed_at: string;
    billed_inr: number;
    cost_ratio: number;
    held_up_30d: boolean;
    flags: string[];
  };
};
export type Trail = Record<string, TrailRecord>;

let trail: Promise<Trail> | null = null;

export function loadTrail(origin: string): Promise<Trail> {
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
