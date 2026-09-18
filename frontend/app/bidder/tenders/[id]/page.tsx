"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getTender, getRules } from "@/app/lib/api";
import { useUserRole } from "@/app/lib/useUserRole";

export default function BidderTenderDetailPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const { isOfficer } = useUserRole();

  const [tender, setTender] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getTender(tenderId),
      getRules(tenderId),
    ])
      .then(([tenderData, rulesData]) => {
        setTender(tenderData);
        setRules(rulesData || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tenderId]);

  if (loading) {
    return (
      <div className="landing-page-wrapper">
        <Header />
        <div className="page-container" style={{ marginTop: "40px" }}>
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading tender requirements...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isOpen = tender?.status === "open" || tender?.status === "active";

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title={tender?.title || "Tender Details"}
          breadcrumbs={[
            { label: "Bidder Portal", href: "/bidder" },
            { label: "Open Tenders", href: "/bidder/tenders" },
            { label: tender?.title || "Tender" },
          ]}
          action={<StatusBadge status={tender?.status || "open"} label={isOpen ? "Accepting Bids" : tender?.status} />}
        />

        {error && (
          <div className="card form-error mb-4" role="alert">
            {error}
          </div>
        )}

        {/* Tender Specification Header Card */}
        <div className="card mb-6" style={{ borderLeft: "4px solid var(--color-navy-700)", padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div>
              <span className="text-secondary text-sm">Procuring Authority</span>
              <div style={{ fontWeight: 600, color: "var(--color-navy-900)", marginTop: "2px" }}>
                {tender?.organization || "Ministry of Commerce & Industry"}
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm">Procurement Category</span>
              <div style={{ fontWeight: 600, color: "var(--color-navy-900)", marginTop: "2px" }}>
                {tender?.category || "Industrial Goods & Services"}
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm">Submission Status</span>
              <div style={{ fontWeight: 600, color: isOpen ? "var(--color-status-verified)" : "var(--color-status-issue)", marginTop: "2px" }}>
                {isOpen ? "Active (Accepting Submissions)" : "Closed for Bidding"}
              </div>
            </div>
          </div>

          {tender?.description && (
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px", marginTop: "14px" }}>
              <span className="text-secondary text-sm">Scope of Procurement</span>
              <p style={{ fontSize: "13.5px", color: "var(--color-text-primary)", lineHeight: 1.5, margin: "4px 0 0 0" }}>
                {tender.description}
              </p>
            </div>
          )}

          {isOpen && !isOfficer && (
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <Link
                href={`/bidder/tenders/${tenderId}/apply`}
                className="btn btn-primary"
                style={{
                  backgroundColor: "var(--color-saffron)",
                  color: "#0A2E4D",
                  fontWeight: 700,
                  fontSize: "14px",
                  padding: "10px 24px",
                }}
              >
                Apply / Submit Bid &rarr;
              </Link>
            </div>
          )}
          {isOpen && isOfficer && (
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <Link
                href={`/officer/tenders/${tenderId}`}
                className="btn btn-primary"
                style={{
                  backgroundColor: "var(--color-navy-900)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "14px",
                  padding: "10px 24px",
                }}
              >
                Officer Workspace &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Mandatory Eligibility & Compliance Rules */}
        <div style={{ marginBottom: "32px" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "var(--color-navy-900)", margin: 0 }}>
                Eligibility Criteria & Required Evidence
              </h2>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                Every bidder must upload self-attested documents proving compliance with each requirement below.
              </p>
            </div>
          </div>

          <div className="table-wrapper" style={{ border: "1px solid var(--color-border)", borderRadius: "6px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: "15%", padding: "12px 16px", background: "#F8FAFC", fontSize: "12px", borderBottom: "2px solid var(--color-border)" }}>Rule Code</th>
                  <th style={{ width: "40%", padding: "12px 16px", background: "#F8FAFC", fontSize: "12px", borderBottom: "2px solid var(--color-border)" }}>Requirement Description</th>
                  <th style={{ width: "15%", padding: "12px 16px", background: "#F8FAFC", fontSize: "12px", borderBottom: "2px solid var(--color-border)", textAlign: "center" }}>Mandatory</th>
                  <th style={{ width: "30%", padding: "12px 16px", background: "#F8FAFC", fontSize: "12px", borderBottom: "2px solid var(--color-border)" }}>Evidence Document Required</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id || rule.rule_id}>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7" }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: "12px", background: "#F1F5F9", padding: "4px 8px", borderRadius: "4px" }}>
                        {rule.rule_id}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7", fontSize: "13.5px" }}>
                      {rule.requirement}
                      {rule.threshold && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                          Threshold: <strong>{rule.threshold}</strong>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", textAlign: "center", borderBottom: "1px solid #EDF2F7" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          backgroundColor: rule.mandatory ? "var(--color-status-verified-bg)" : "var(--color-status-pending-bg)",
                          color: rule.mandatory ? "var(--color-status-verified)" : "var(--color-text-secondary)",
                        }}
                      >
                        {rule.mandatory ? "YES" : "OPTIONAL"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(rule.evidence_required || []).map((ev: string, idx: number) => (
                          <span key={idx} style={{ fontSize: "12px", background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "3px 8px", borderRadius: "3px", color: "#334155" }}>
                            {ev}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isOpen && !isOfficer && (
          <div style={{ textAlign: "center", padding: "24px", background: "#F8FAFC", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--color-navy-900)", marginBottom: "8px" }}>
              Ready to submit your bid?
            </h3>
            <p className="text-secondary text-sm mb-4">
              Ensure you have all required self-attested documents ready in PDF format.
            </p>
            <Link
              href={`/bidder/tenders/${tenderId}/apply`}
              className="btn btn-primary"
              style={{
                backgroundColor: "var(--color-saffron)",
                color: "#0A2E4D",
                fontWeight: 700,
                fontSize: "14px",
                padding: "10px 28px",
              }}
            >
              Submit Bid Proposal &rarr;
            </Link>
          </div>
        )}

        {isOpen && isOfficer && (
          <div style={{ textAlign: "center", padding: "24px", background: "#F8FAFC", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
            <h3 style={{ fontSize: "16px", color: "var(--color-navy-900)", marginBottom: "8px" }}>
              Procurement Officer Command
            </h3>
            <p className="text-secondary text-sm mb-4">
              Review submitted bids, evaluate compliance findings, and record qualification decisions.
            </p>
            <Link
              href={`/officer/tenders/${tenderId}`}
              className="btn btn-primary"
              style={{
                backgroundColor: "var(--color-navy-900)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "14px",
                padding: "10px 28px",
              }}
            >
              Open Officer Workspace &rarr;
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
