"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyNewTenderRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/officer/tenders/new");
  }, [router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column", gap: "12px" }}>
      <div className="spinner"></div>
      <span style={{ fontSize: "13.5px", color: "var(--color-navy-900)" }}>Routing to Create Tender...</span>
    </div>
  );
}
