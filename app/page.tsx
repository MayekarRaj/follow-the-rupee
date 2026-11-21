"use client";

import { Suspense } from "react";
import { useRole } from "@/components/Header";
import WardView from "@/components/WardView";

function Home() {
  const { role, ward } = useRole();
  if (role === "ward") return <WardView wardCode={ward} />;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
        The {role} view is coming next. Switch to “Ward officer” to see the
        first view.
      </p>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="px-4 py-6 text-sm text-slate-500">Loading…</p>}>
      <Home />
    </Suspense>
  );
}
