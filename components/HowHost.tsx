"use client";

import { usePrefs } from "@/lib/prefs";
import HowWeFlag from "./HowWeFlag";

export default function HowHost() {
  const { howOpen, setHowOpen } = usePrefs();
  return howOpen ? <HowWeFlag onClose={() => setHowOpen(false)} /> : null;
}
