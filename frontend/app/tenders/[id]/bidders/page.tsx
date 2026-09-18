"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyBiddersRedirect() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;

  useEffect(() => {
    router.replace(`/officer/tenders/${tenderId}/bids`);
  }, [router, tenderId]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column", gap: "12px" }}>
      <div className="spinner"></div>
      <span style={{ fontSize: "13.5px", color: "var(--color-navy-900)" }}>Routing to Submitted Bids...</span>
    </div>
  );
}
