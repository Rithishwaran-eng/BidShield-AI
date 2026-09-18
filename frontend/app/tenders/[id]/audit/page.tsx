"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyTenderAuditRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/officer/audit");
  }, [router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column", gap: "12px" }}>
      <div className="spinner"></div>
      <span style={{ fontSize: "13.5px", color: "var(--color-navy-900)" }}>Routing to Audit Trail...</span>
    </div>
  );
}
