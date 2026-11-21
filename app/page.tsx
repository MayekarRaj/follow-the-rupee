"use client";

import { Suspense } from "react";
import { useRole } from "@/components/Header";
import WardView from "@/components/WardView";

function Home() {
  const { role, ward } = useRole();
  if (role === "ward") return <WardView wardCode={ward} />;
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-10 focus:outline-none">
      <p className="border border-ink/30 p-6 text-ink/80">
        The {role} view is coming next. Switch to “Ward officer” to see the
        first view.
      </p>
    </main>
  );
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
