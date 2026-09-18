"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/app/lib/useUserRole";

export default function LegacyTendersPage() {
  const router = useRouter();
  const { isOfficer } = useUserRole();

  useEffect(() => {
    if (isOfficer) {
      router.replace("/officer/tenders");
    } else {
      router.replace("/bidder/tenders");
    }
  }, [isOfficer, router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column", gap: "12px" }}>
      <div className="spinner"></div>
      <span style={{ fontSize: "13.5px", color: "var(--color-navy-900)" }}>Routing to your procurement workspace...</span>
    </div>
  );
}
