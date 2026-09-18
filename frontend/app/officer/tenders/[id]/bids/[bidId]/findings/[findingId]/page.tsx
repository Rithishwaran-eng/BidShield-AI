"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getFinding, takeAction, reopenFinding } from "@/app/lib/api";
import { useUserRole } from "@/app/lib/useUserRole";

export default function OfficerFindingEvidencePage() {
  const params = useParams();
  const router = useRouter();
  const { name: officerName } = useUserRole();

  const tenderId = params.id as string;
  const bidId = params.bidId as string;
  const findingId = params.findingId as string;

  const [finding, setFinding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [message, setMessage] = useState("");

  const fetchFinding = async () => {
    try {
      const data = await getFinding(findingId);
      setFinding(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinding();
  }, [findingId]);

  const handleAction = async (action: string) => {
    if (action === "override" && !overrideNote.trim()) {
      setShowOverrideInput(true);
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      await takeAction(
        findingId,
        action,
        officerName || "Procurement Officer",
        action === "override" ? overrideNote.trim() : undefined
      );
      setMessage(`Finding action "${action.replace("_", " ")}" saved successfully.`);
      await fetchFinding();
      setShowOverrideInput(false);
      setOverrideNote("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      await reopenFinding(findingId);
      setMessage("Finding reopened for further officer evaluation.");
      await fetchFinding();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page-wrapper">
        <Header />
        <div className="page-container" style={{ marginTop: "40px" }}>
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading evidence comparison dossier...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="landing-page-wrapper">
        <Header />
        <div className="page-container" style={{ marginTop: "40px" }}>
          <div className="empty-state">
            <h3>Finding record not found</h3>
            <Link href={`/officer/tenders/${tenderId}/bids/${bidId}`} className="btn btn-primary mt-4">
              Return to Bid Dossier
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isLocked = !!finding.officer_action;

  // Group evidence by document
  const evidenceByDoc: Record<string, any[]> = {};
  (finding.evidence || []).forEach((ev: any) => {
    const key = ev.document_type || ev.document_id || "Cross-Document Source";
    if (!evidenceByDoc[key]) evidenceByDoc[key] = [];
    evidenceByDoc[key].push(ev);
  });

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title="Evidence & Cross-Document Review"
          breadcrumbs={[
            { label: "Officer Portal", href: "/officer" },
            { label: "Tenders", href: "/officer/tenders" },
            { label: "Tender", href: `/officer/tenders/${tenderId}` },
            { label: "Submitted Bids", href: `/officer/tenders/${tenderId}/bids` },
            { label: finding.bidder_name || "Bid Dossier", href: `/officer/tenders/${tenderId}/bids/${bidId}` },
            { label: finding.rule_code || "Finding Evidence" },
          ]}
          action={
            <Link href={`/officer/tenders/${tenderId}/bids/${bidId}`} className="btn btn-secondary btn-sm">
              &larr; Back to Bid Dossier
            </Link>
          }
        />

        {error && (
          <div className="card mb-4 form-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="card mb-4" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", padding: "12px 16px" }}>
            {message}
          </div>
        )}

        {/* Rule and Status Banner */}
        <div className="card mb-6" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span className="mono" style={{ fontWeight: 700, fontSize: "12px", background: "#F1F5F9", padding: "3px 8px", borderRadius: "4px" }}>
                  {finding.rule_code || "RULE"}
                </span>
                <span className="text-secondary text-sm">
                  Category: <strong>{finding.rule_category || "Eligibility / Compliance"}</strong>
                </span>
              </div>
              <h2 style={{ fontSize: "17px", color: "var(--color-navy-900)", margin: "0 0 6px 0" }}>
                {finding.rule_requirement || "Cross-Document Legal Name Consistency Check"}
              </h2>
              <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                Evaluated Vendor: <strong style={{ color: "var(--color-navy-900)" }}>{finding.bidder_name}</strong>
              </div>
            </div>
            <div>
              <StatusBadge status={finding.status} />
            </div>
          </div>
        </div>

        {/* Side-by-side Evidence Comparison Grid (The Star Screen) */}
        <div className="mb-6">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ fontSize: "16px", color: "var(--color-navy-900)", margin: 0 }}>
                Extracted Document Evidence Comparison
              </h3>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                Side-by-side values extracted by BidShield AI from uploaded submission documents.
              </p>
            </div>
          </div>

          {Object.keys(evidenceByDoc).length === 0 ? (
            <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--color-text-secondary)" }}>
              No document evidence items linked for this rule.
            </div>
          ) : (
            <div className="evidence-grid">
              {Object.entries(evidenceByDoc).map(([docType, items]) => (
                <div key={docType} className="evidence-block">
                  <div className="evidence-block-header">
                    <span>📄 {docType}</span>
                    {items[0]?.page && (
                      <span style={{ fontSize: "11px", fontWeight: 500, opacity: 0.85 }}>Page {items[0].page}</span>
                    )}
                  </div>
                  <div style={{ padding: "12px" }}>
                    {items.map((item, idx) => {
                      const isMismatch =
                        finding.status === "issue_detected" &&
                        (item.field === "legal_name" || item.field === "company_name" || item.field === "pan" || item.field === "gstin");
                      return (
                        <div key={idx} className="evidence-field" style={{ marginBottom: idx === items.length - 1 ? 0 : "10px" }}>
                          <span className="evidence-field-label">
                            {item.field ? item.field.replace(/_/g, " ").toUpperCase() : "VALUE"}
                          </span>
                          <span
                            className={`evidence-field-value ${isMismatch ? "mismatch" : ""}`}
                            style={{
                              display: "block",
                              marginTop: "3px",
                              padding: "6px 10px",
                              borderRadius: "4px",
                              backgroundColor: isMismatch ? "#FEF2F2" : "#F8FAFC",
                              border: isMismatch ? "1px solid #FECACA" : "1px solid #E2E8F0",
                              color: isMismatch ? "#991B1B" : "var(--color-navy-900)",
                              fontWeight: isMismatch ? 700 : 500,
                              fontSize: "13px",
                            }}
                          >
                            {item.value || "--"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plain-language AI Analysis Explanation */}
        <div
          className="card mb-6"
          style={{
            padding: "20px 24px",
            borderLeft: `4px solid ${
              finding.status === "verified"
                ? "var(--color-status-verified)"
                : finding.status === "issue_detected"
                ? "var(--color-status-issue)"
                : finding.status === "missing"
                ? "var(--color-status-missing)"
                : "var(--color-border)"
            }`,
          }}
        >
          <div className="portal-section-kicker">Automated Verification Analysis</div>
          <h3 style={{ fontSize: "15.5px", color: "var(--color-navy-900)", margin: "4px 0 8px 0" }}>
            Findings Explanation & Rationale
          </h3>
          <p style={{ fontSize: "13.5px", lineHeight: 1.6, color: "var(--color-navy-900)", margin: 0 }}>
            {finding.explanation || "No explanation recorded for this compliance check."}
          </p>
        </div>

        {/* Human-in-the-Loop Officer Action Panel */}
        <div className="card mb-6" style={{ padding: "24px", border: "1.5px solid var(--color-navy-900)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span className="portal-section-kicker">Human-In-The-Loop Authority</span>
              <h3 style={{ fontSize: "16px", color: "var(--color-navy-900)", margin: "2px 0 0 0" }}>
                Officer Evaluation Review
              </h3>
            </div>
            {isLocked && (
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  background: "#E2E8F0",
                  color: "var(--color-navy-900)",
                }}
              >
                Action Recorded: {finding.officer_action.replace("_", " ")}
              </span>
            )}
          </div>

          {isLocked ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px", backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "6px" }}>
                <div>
                  <span className="text-secondary text-sm">Action Taken</span>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-navy-900)", textTransform: "capitalize", marginTop: "2px" }}>
                    {finding.officer_action.replace("_", " ")}
                  </div>
                </div>
                <div>
                  <span className="text-secondary text-sm">Action Timestamp</span>
                  <div style={{ fontSize: "13px", color: "var(--color-navy-900)", marginTop: "2px" }}>
                    {finding.action_at ? new Date(finding.action_at).toLocaleString("en-IN") : "--"}
                  </div>
                </div>
                {finding.officer_note && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span className="text-secondary text-sm">Officer Justification Note</span>
                    <div style={{ fontSize: "13px", color: "var(--color-navy-900)", marginTop: "2px", fontWeight: 500 }}>
                      {finding.officer_note}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReopen}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Reopening..." : "🔓 Reopen Finding for Re-evaluation"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                Select an official action to resolve or override this AI finding. All decisions are logged to the immutable audit trail.
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAction("accept")}
                  disabled={actionLoading}
                  style={{ backgroundColor: "var(--color-status-verified)", borderColor: "var(--color-status-verified)" }}
                >
                  ✓ Accept Finding
                </button>

                <button
                  type="button"
                  className="btn btn-destructive"
                  onClick={() => handleAction("reject")}
                  disabled={actionLoading}
                >
                  ✕ Reject Finding
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleAction("request_clarification")}
                  disabled={actionLoading}
                >
                  💬 Request Clarification
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleAction("mark_verified")}
                  disabled={actionLoading}
                >
                  ☑ Mark as Verified
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOverrideInput(!showOverrideInput)}
                  disabled={actionLoading}
                  style={{ fontWeight: 600 }}
                >
                  ⚡ Override Finding...
                </button>
              </div>

              {showOverrideInput && (
                <div style={{ backgroundColor: "#F8FAFC", padding: "18px", borderRadius: "6px", border: "1px solid var(--color-border)", marginTop: "12px" }}>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label htmlFor="override-note" className="form-label" style={{ fontWeight: 700, fontSize: "13px" }}>
                      Mandatory Override Rationale: <span className="form-required">*</span>
                    </label>
                    <textarea
                      id="override-note"
                      className="form-input"
                      value={overrideNote}
                      onChange={(e) => setOverrideNote(e.target.value)}
                      placeholder="Explain the technical or regulatory justification for overriding this AI finding..."
                      rows={3}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowOverrideInput(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAction("override")}
                      disabled={actionLoading || !overrideNote.trim()}
                    >
                      {actionLoading ? "Submitting..." : "Confirm & Apply Override"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Audit / Action History for this Finding */}
        {finding.audit_history && finding.audit_history.length > 0 && (
          <div className="card mb-6" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "15.5px", color: "var(--color-navy-900)", marginBottom: "14px" }}>
              Action & Audit History ({finding.audit_history.length})
            </h3>
            <div className="data-table-desktop">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "22%" }}>Timestamp</th>
                    <th style={{ width: "20%" }}>Procurement Officer</th>
                    <th style={{ width: "20%" }}>Action Taken</th>
                    <th style={{ width: "38%" }}>Official Note</th>
                  </tr>
                </thead>
                <tbody>
                  {finding.audit_history.map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="text-sm">
                        {new Date(entry.created_at).toLocaleString("en-IN")}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--color-navy-900)" }}>
                        {entry.officer_name || "Procurement Officer"}
                      </td>
                      <td>
                        <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
                          {entry.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="text-secondary text-sm">
                        {entry.note || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
