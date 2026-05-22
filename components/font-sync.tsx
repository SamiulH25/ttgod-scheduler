"use client";

import { fontFamilyFor, type AppFont } from "@/lib/fonts";
import { useEffect } from "react";

export function FontSync({ font }: { font: AppFont }) {
  useEffect(() => {
    const family = fontFamilyFor(font);
    document.documentElement.style.setProperty("--font-sans-family", family);
    document.documentElement.style.setProperty("--font-display-family", family);
  }, [font]);

  return null;
}
