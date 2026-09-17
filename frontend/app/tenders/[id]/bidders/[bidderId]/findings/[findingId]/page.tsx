"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getFinding, takeAction, reopenFinding } from "@/app/lib/api";
import { useUserRole } from "@/app/lib/useUserRole";

export default function EvidenceReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuditor } = useUserRole();
  const tenderId = params.id as string;
  const bidderId = params.bidderId as string;
  const findingId = params.findingId as string;


  const [finding, setFinding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");
  const [showOverrideInput, setShowOverrideInput] = useState(false);

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
    try {
      await takeAction(
        findingId,
        action,
        "Procurement Officer",
        action === "override" ? overrideNote : undefined
      );
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
    try {
      await reopenFinding(findingId);
      await fetchFinding();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <span>Loading finding details...</span>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="empty-state">
        <h3>Finding not found</h3>
      </div>
    );
  }

  const isLocked = !!finding.officer_action;

  // Group evidence by document
  const evidenceByDoc: Record<string, any[]> = {};
  (finding.evidence || []).forEach((ev: any) => {
    const key = ev.document_type || ev.document_id || "Unknown";
    if (!evidenceByDoc[key]) evidenceByDoc[key] = [];
    evidenceByDoc[key].push(ev);
  });

  return (
    <>
      <PageHeader
        title="Evidence Review"
        breadcrumbs={[
          { label: "Tenders", href: "/tenders" },
          { label: "Tender", href: `/tenders/${tenderId}` },
          { label: "Dashboard", href: `/tenders/${tenderId}/dashboard` },
          { label: "Evidence Review" },
        ]}
      />

      {error && (
        <div className="form-error mb-4" role="alert">{error}</div>
      )}

      {/* Rule and status */}
      <div className="card mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-secondary text-sm">
              {finding.rule_requirement
                ? `Rule: ${finding.rule_requirement}`
                : "Cross-Document Consistency Check"}
            </p>
            <p className="font-semibold mt-2">
              Bidder: {finding.bidder_name}
            </p>
          </div>
          <StatusBadge status={finding.status} />
        </div>
      </div>

      {/* Evidence comparison -- the star layout */}
      <div className="mb-4">
        <h2 className="mb-4">Evidence Comparison</h2>
        <div className="evidence-grid">
          {Object.entries(evidenceByDoc).map(([docType, items]) => (
            <div key={docType} className="evidence-block">
              <div className="evidence-block-header">
                {docType}
                {items[0]?.page && `, p.${items[0].page}`}
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="evidence-field">
                  <span className="evidence-field-label">{item.field}</span>
                  <span
                    className={`evidence-field-value ${
                      finding.status === "issue_detected" &&
                      item.field === "legal_name"
                        ? "mismatch"
                        : ""
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Plain-language explanation */}
      <div className="card mb-4" style={{
        borderLeftWidth: "3px",
        borderLeftColor: finding.status === "verified"
          ? "var(--color-status-verified)"
          : finding.status === "issue_detected"
          ? "var(--color-status-issue)"
          : finding.status === "missing"
          ? "var(--color-status-missing)"
          : "var(--color-status-pending)"
      }}>
        <h3 className="mb-2">Analysis</h3>
        <p>{finding.explanation}</p>
      </div>

      {/* Officer action controls */}
      <div className="card mb-4">
        <h3 className="mb-4">Officer Action</h3>

        {isLocked ? (
          <>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div>
                <span className="text-secondary text-sm">Action taken: </span>
                <span className="font-semibold" style={{ textTransform: "capitalize" }}>
                  {finding.officer_action.replace("_", " ")}
                </span>
              </div>
              {finding.action_at && (
                <span className="text-secondary text-sm">
                  {new Date(finding.action_at).toLocaleString("en-IN")}
                </span>
              )}
            </div>
            {finding.officer_note && (
              <div className="card mb-4" style={{ backgroundColor: "var(--color-bg)" }}>
                <span className="text-secondary text-sm">Note: </span>
                {finding.officer_note}
              </div>
            )}
            {!isAuditor && (
              <button
                className="btn btn-secondary"
                onClick={handleReopen}
                disabled={actionLoading}
              >
                {actionLoading ? "Reopening..." : "Reopen for Further Review"}
              </button>
            )}
          </>
        ) : isAuditor ? (
          <div style={{ backgroundColor: "var(--color-bg)", padding: "12px 16px", borderRadius: "4px", borderLeft: "4px solid var(--color-navy-700)" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
              <strong>Auditor Mode:</strong> Read-only view. Review decisions (Accept, Reject, Request Clarification, Mark Verified, Override) are restricted to Procurement Officers.
            </p>
          </div>
        ) : (
          <>

            <div className={`action-bar ${isLocked ? "action-bar-locked" : ""}`}>
              <button
                className="btn btn-primary"
                onClick={() => handleAction("accept")}
                disabled={actionLoading}
              >
                Accept
              </button>
              <button
                className="btn btn-destructive"
                onClick={() => handleAction("reject")}
                disabled={actionLoading}
              >
                Reject
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleAction("request_clarification")}
                disabled={actionLoading}
              >
                Request Clarification
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleAction("mark_verified")}
                disabled={actionLoading}
              >
                Mark Verified
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowOverrideInput(!showOverrideInput)}
                disabled={actionLoading}
              >
                Override
              </button>
            </div>

            {showOverrideInput && (
              <div className="mt-4">
                <div className="form-group">
                  <label htmlFor="override-note" className="form-label">
                    Override Note <span className="form-required">(required)</span>
                  </label>
                  <textarea
                    id="override-note"
                    className="form-input"
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                    placeholder="Explain the rationale for overriding this finding..."
                    rows={3}
                    required
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAction("override")}
                  disabled={actionLoading || !overrideNote.trim()}
                >
                  {actionLoading ? "Submitting..." : "Submit Override"}
                </button>
              </div>
            )}

            {actionLoading && (
              <div className="loading-state mt-2">
                <div className="spinner"></div>
                <span>Recording action...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Audit history for this finding */}
      {finding.audit_history && finding.audit_history.length > 0 && (
        <div className="card">
          <h3 className="mb-4">Action History</h3>
          <div className="data-table-desktop">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Officer</th>
                  <th>Action</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {finding.audit_history.map((entry: any) => (
                  <tr key={entry.id}>
                    <td className="text-sm">
                      {new Date(entry.created_at).toLocaleString("en-IN")}
                    </td>
                    <td>{entry.officer_name}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {entry.action.replace("_", " ")}
                    </td>
                    <td className="text-secondary text-sm">
                      {entry.note || "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="stacked-cards-mobile">
            {finding.audit_history.map((entry: any) => (
              <div className="stacked-card" key={entry.id}>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Timestamp</span>
                  <span className="stacked-card-value text-sm">
                    {new Date(entry.created_at).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Officer</span>
                  <span className="stacked-card-value">{entry.officer_name}</span>
                </div>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Action</span>
                  <span className="stacked-card-value" style={{ textTransform: "capitalize" }}>
                    {entry.action.replace("_", " ")}
                  </span>
                </div>
                {entry.note && (
                  <div className="stacked-card-row">
                    <span className="stacked-card-label">Note</span>
                    <span className="stacked-card-value text-secondary">{entry.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
