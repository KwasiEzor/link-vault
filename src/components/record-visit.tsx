"use client";

import { useEffect, useRef } from "react";

export function RecordVisit({ linkId }: { linkId: string }) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ linkId }),
      cache: "no-store",
      keepalive: true,
    }).catch(() => {
      // Best-effort analytics; ignore failures.
    });
  }, [linkId]);

  return null;
}

