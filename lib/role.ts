"use client";

import { useSearchParams } from "next/navigation";
import { DEFAULT_WARD, type Role } from "@/lib/data";

/** The active role and ward, read from ?role= and ?ward=. */
export function useRole(): { role: Role; ward: string } {
  const sp = useSearchParams();
  const r = sp.get("role");
  const role: Role =
    r === "commissioner" || r === "citizen" || r === "ward" ? r : "commissioner";
  return { role, ward: sp.get("ward") || DEFAULT_WARD };
}
