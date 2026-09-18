"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getBidDetail, reverifyBid, setBidDecision } from "@/app/lib/api";
import { useUserRole } from "@/app/lib/useUserRole";

export default function OfficerBidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;
  const bidId = params.bidId as string;
  const { name: officerName } = useUserRole();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reverifying, setReverifying] = useState(false);
  const [decisionSaving, setDecisionSaving] = useState(false);

  // Decision State
  const [decision, setDecision] = useState<"qualified" | "not_qualified">("qualified");
  const [decisionNote, setDecisionNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const res = await getBidDetail(bidId);
      setData(res);
      if (res.bid?.officer_decision) {
        setDecision(res.bid.officer_decision);
      }
      if (res.bid?.officer_decision_note) {
        setDecisionNote(res.bid.officer_decision_note);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bidId]);

  const handleReverify = async () => {
    setReverifying(true);
    setError("");
    setMessage("");
    try {
      await reverifyBid(bidId);
      setMessage("Re-verification complete. All rules and cross-document checks updated.");
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to re-run verification.");
    } finally {
      setReverifying(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionNote.trim()) {
      setError("Please provide a mandatory justification note for the final qualification decision.");
      return;
    }

    setDecisionSaving(true);
    setError("");
    setMessage("");
    try {
      await setBidDecision(
        bidId,
        decision,
        officerName || "Procurement Officer",
        decisionNote.trim()
      );
      setMessage(`Final qualification decision recorded: ${decision.toUpperCase()}. Entry saved to audit trail.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to record qualification decision.");
    } finally {
      setDecisionSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page-wrapper">
        <Header />
        <div className="page-container" style={{ marginTop: "40px" }}>
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading bidder compliance dossier...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const bidder = data?.bidder || {};
  const bid = data?.bid || {};
  const tender = data?.tender || {};
  const findings = data?.findings || [];
  const documents = data?.documents || [];

  const verifiedCount = findings.filter((f: any) => f.status === "verified").length;
  const issuesCount = findings.filter((f: any) => f.status === "issue_detected").length;
  const missingCount = findings.filter((f: any) => f.status === "missing").length;
  const pendingCount = findings.filter((f: any) => f.status === "pending").length;

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title={bidder.name || "Bidder Compliance Dossier"}
          breadcrumbs={[
            { label: "Officer Portal", href: "/officer" },
            { label: "Tenders", href: "/officer/tenders" },
            { label: tender.title || "Tender", href: `/officer/tenders/${tenderId}` },
            { label: "Submitted Bids", href: `/officer/tenders/${tenderId}/bids` },
            { label: bidder.name || "Dossier" },
          ]}
          action={
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleReverify}
                disabled={reverifying}
              >
                {reverifying ? "Re-running..." : "Re-run Verification"}
              </button>
              <StatusBadge status={bid.status || "submitted"} />
            </div>
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

        {/* Bidder Identification Card */}
        <div className="card mb-6" style={{ borderLeft: "4px solid var(--color-navy-700)", padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <span className="text-secondary text-sm">Company Name</span>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-navy-900)", marginTop: "2px" }}>
                {bidder.name}
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm">Legal Name</span>
              <div style={{ fontWeight: 600, color: "var(--color-navy-900)", marginTop: "2px" }}>
                {bidder.legal_name || bidder.name}
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm">PAN / GSTIN</span>
              <div className="mono" style={{ fontSize: "12.5px", color: "var(--color-navy-900)", marginTop: "2px" }}>
                PAN: {bidder.pan || "--"} | GST: {bidder.gstin || "--"}
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm">Submission Timestamp</span>
              <div style={{ fontSize: "13px", color: "var(--color-navy-900)", marginTop: "2px" }}>
                {bid.submitted_at ? new Date(bid.submitted_at).toLocaleString("en-IN") : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Summary Counts */}
        <div className="summary-grid mb-6">
          <div className="summary-card">
            <div className="summary-card-label">Applicable Checks</div>
            <div className="summary-card-value" style={{ color: "var(--color-navy-900)" }}>
              {findings.length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Verified (Clean)</div>
            <div className="summary-card-value" style={{ color: "var(--color-status-verified)" }}>
              {verifiedCount}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Inconsistencies / Issues</div>
            <div className="summary-card-value" style={{ color: "var(--color-status-issue)" }}>
              {issuesCount}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Missing Documents</div>
            <div className="summary-card-value" style={{ color: "var(--color-status-missing)" }}>
              {missingCount}
            </div>
          </div>
        </div>

        {/* Compliance Findings List */}
        <div className="card mb-6" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "16px", color: "var(--color-navy-900)", margin: 0 }}>
                Compliance Findings & Verification Checklist
              </h2>
              <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                Click on any finding to review evidence comparison and execute human-in-the-loop actions.
              </p>
            </div>
          </div>

          <div className="data-table-desktop">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "12%" }}>Check Code</th>
                  <th style={{ width: "34%" }}>Requirement Checked</th>
                  <th style={{ width: "14%" }}>Automated Status</th>
                  <th style={{ width: "26%" }}>Analysis Summary</th>
                  <th style={{ width: "14%", textAlign: "right" }}>Officer Action</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f: any) => (
                  <tr key={f.id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, fontSize: "11.5px", background: "#F1F5F9", padding: "3px 6px", borderRadius: "3px" }}>
                        {f.rule_code || "CROSS_DOC"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-navy-900)" }}>
                        {f.rule_requirement || "Cross-Document Legal Name Consistency"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={f.status} />
                    </td>
                    <td style={{ fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
                      {f.explanation ? (f.explanation.length > 90 ? f.explanation.substring(0, 90) + "..." : f.explanation) : "--"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/officer/tenders/${tenderId}/bids/${bidId}/findings/${f.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "12px", whiteSpace: "nowrap" }}
                      >
                        Inspect Evidence &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Uploaded Documents Grid */}
        <div className="card mb-6" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15.5px", color: "var(--color-navy-900)", marginBottom: "14px" }}>
            Uploaded Bidder Documents ({documents.length})
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                style={{
                  padding: "14px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "#F8FAFC",
                  borderLeft: doc.extraction_status === "done" ? "4px solid var(--color-status-verified)" : "4px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--color-navy-900)" }}>
                    {doc.document_type}
                  </span>
                  <StatusBadge status={doc.extraction_status} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                  {doc.filename}
                </div>
                {doc.legal_name && (
                  <div style={{ fontSize: "11.5px", color: "var(--color-navy-900)" }}>
                    Name: <strong>{doc.legal_name}</strong>
                  </div>
                )}
                {doc.id_number && (
                  <div className="mono" style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    ID: {doc.id_number}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* OFFICER FINAL QUALIFICATION DECISION PANEL */}
        <div className="card" style={{ padding: "28px", border: "2px solid var(--color-navy-900)", backgroundColor: "#FFFFFF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span className="portal-section-kicker">Evaluation Committee Authority</span>
              <h3 style={{ fontSize: "17px", color: "var(--color-navy-900)", margin: "2px 0 0 0" }}>
                Final Procurement Qualification Decision
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                BidShield AI provides automated evidence extraction; the human Procurement Officer retains exclusive authority to qualify or disqualify.
              </p>
            </div>
            {bid.officer_decision && (
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  background: bid.officer_decision === "qualified" ? "#DCFCE7" : "#FEE2E2",
                  color: bid.officer_decision === "qualified" ? "#166534" : "#991B1B",
                }}
              >
                Recorded: {bid.officer_decision}
              </span>
            )}
          </div>

          <form onSubmit={handleDecisionSubmit}>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: "13px" }}>
                Select Decision Outcome: <span className="form-required">*</span>
              </label>
              <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, color: "#166534" }}>
                  <input
                    type="radio"
                    name="decision"
                    value="qualified"
                    checked={decision === "qualified"}
                    onChange={() => setDecision("qualified")}
                  />
                  QUALIFIED (Bidder satisfies mandatory eligibility)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, color: "#991B1B" }}>
                  <input
                    type="radio"
                    name="decision"
                    value="not_qualified"
                    checked={decision === "not_qualified"}
                    onChange={() => setDecision("not_qualified")}
                  />
                  NOT QUALIFIED (Disqualified due to non-compliance)
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label htmlFor="decision-note" className="form-label" style={{ fontWeight: 700, fontSize: "13px" }}>
                Official Justification & Evaluation Note <span className="form-required">* (required for audit trail)</span>
              </label>
              <textarea
                id="decision-note"
                className="form-input"
                rows={4}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="State the committee's justification for qualifying or disqualifying this bidder proposal..."
                required
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", alignItems: "center" }}>
              <Link href={`/officer/tenders/${tenderId}/bids`} className="btn btn-secondary">
                Back to Submitted Bids
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={decisionSaving || !decisionNote.trim()}
                style={{
                  backgroundColor: decision === "qualified" ? "var(--color-status-verified)" : "var(--color-status-issue)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  padding: "10px 24px",
                }}
              >
                {decisionSaving ? "Recording Decision..." : `Record Decision as ${decision.toUpperCase()}`}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
