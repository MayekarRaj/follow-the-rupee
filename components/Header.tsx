"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_WARD, ROLES, useData, type Role, type Ward } from "@/lib/data";

export function useRole(): { role: Role; ward: string } {
  const sp = useSearchParams();
  const r = sp.get("role");
  const role: Role =
    r === "commissioner" || r === "citizen" || r === "ward" ? r : "ward";
  return { role, ward: sp.get("ward") || DEFAULT_WARD };
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { role, ward } = useRole();
  const { data: wards } = useData<Ward[]>("wards.json");

  function update(next: Record<string, string | null>) {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v == null) q.delete(k);
      else q.set(k, v);
    }
    router.replace(`${pathname}?${q.toString()}`);
  }

  const sel =
    "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <h1 className="text-lg font-bold tracking-tight text-slate-900">
          Follow the Rupee
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            View as
            <select
              className={sel}
              value={role}
              onChange={(e) =>
                update({
                  role: e.target.value,
                  ward: e.target.value === "ward" ? ward : null,
                })
              }
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {role === "ward" && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Ward
              <select
                className={sel}
                value={ward}
                onChange={(e) => update({ role: "ward", ward: e.target.value })}
              >
                {(wards ?? [{ ward_code: ward, ward_name: "" } as Ward]).map(
                  (w) => (
                    <option key={w.ward_code} value={w.ward_code}>
                      {w.ward_code}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}
        </div>
      </div>
    </header>
  );
}
