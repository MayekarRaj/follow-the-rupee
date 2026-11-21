"use client";

import { Suspense } from "react";
import { useRole } from "@/components/Header";
import WardView from "@/components/WardView";
import CitizenView from "@/components/CitizenView";
import CommissionerView from "@/components/CommissionerView";

function Home() {
  const { role, ward } = useRole();
  if (role === "ward") return <WardView wardCode={ward} />;
  if (role === "citizen") return <CitizenView />;
  return <CommissionerView />;
}

export default function Page() {
  return (
    <Suspense
      fallback={<p className="px-4 py-6 text-sm text-ink/70">Loading…</p>}
    >
      <Home />
    </Suspense>
  );
}
