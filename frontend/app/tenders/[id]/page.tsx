"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserRole } from "@/app/lib/useUserRole";

export default function LegacyTenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;
  const { isOfficer } = useUserRole();

  useEffect(() => {
    if (isOfficer) {
      router.replace(`/officer/tenders/${tenderId}`);
    } else {
      router.replace(`/bidder/tenders/${tenderId}`);
    }
  }, [isOfficer, router, tenderId]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column", gap: "12px" }}>
      <div className="spinner"></div>
      <span style={{ fontSize: "13.5px", color: "var(--color-navy-900)" }}>Routing to tender dossier...</span>
    </div>
  );
}
