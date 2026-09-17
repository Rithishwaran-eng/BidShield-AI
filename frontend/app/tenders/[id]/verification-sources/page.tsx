"use client";

import { useParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";

const VERIFICATION_SOURCES = [
  { name: "GST Network (GSTN)", description: "Verify GSTIN status, legal name, and registration details", status: "Simulated" },
  { name: "Income Tax (PAN)", description: "Verify PAN card validity and name matching", status: "Simulated" },
  { name: "Udyam Registration", description: "Verify MSME registration and enterprise category", status: "Simulated" },
  { name: "Ministry of Corporate Affairs (MCA)", description: "Verify company registration, CIN, and director details", status: "Simulated" },
  { name: "DPIIT Recognition", description: "Verify startup recognition for procurement benefits", status: "Simulated" },
  { name: "NSIC Registration", description: "Verify NSIC registration for MSME benefits", status: "Simulated" },
  { name: "EPFO", description: "Verify employee provident fund compliance", status: "Simulated" },
  { name: "ESIC", description: "Verify employee state insurance compliance", status: "Simulated" },
  { name: "DigiLocker", description: "Verify documents through DigiLocker integration", status: "Simulated" },
  { name: "OEM Verification", description: "Verify original equipment manufacturer authorization", status: "Simulated" },
  { name: "Blacklist/Debarment Check", description: "Check against government debarment and blacklist databases", status: "Simulated" },
];

export default function VerificationSourcesPage() {
  const params = useParams();
  const tenderId = params.id as string;

  return (
    <>
      <PageHeader
        title="Verification Sources"
        breadcrumbs={[
          { label: "Tenders", href: "/tenders" },
          { label: "Tender", href: `/tenders/${tenderId}` },
          { label: "Verification Sources" },
        ]}
      />

      <div className="card mb-4" style={{ borderLeftWidth: "3px", borderLeftColor: "var(--color-status-pending)" }}>
        <p>
          <strong>Note:</strong> All external verification sources listed below are currently simulated
          for the prototype. In production, these would connect to live government APIs for
          real-time verification.
        </p>
      </div>

      <div className="card">
        <h2 className="mb-4">External Verification APIs</h2>
        {VERIFICATION_SOURCES.map((source, idx) => (
          <div key={idx} className="verification-source">
            <div>
              <div className="verification-source-name">{source.name}</div>
              <div className="text-secondary text-sm">{source.description}</div>
            </div>
            <div className="verification-source-status">{source.status}</div>
          </div>
        ))}
      </div>
    </>
  );
}
