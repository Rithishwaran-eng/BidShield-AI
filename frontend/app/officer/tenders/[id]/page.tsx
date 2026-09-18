"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getTender, getRules, listSubmittedBids, publishTender, updateTenderStatus } from "@/app/lib/api";

const PHASES = [
  { key: "draft", label: "Draft" },
  { key: "rules_approved", label: "Rules Approved" },
  { key: "open", label: "Open (Accepting Bids)" },
  { key: "bid_submission_closed", label: "Submission Closed" },
  { key: "under_evaluation", label: "Under Evaluation" },
  { key: "decision_pending", label: "Decision Pending" },
  { key: "completed", label: "Completed" },
];

export default function OfficerTenderOverviewPage() {
  const params = useParams();
  const tenderId = params.id as string;

  const [tender, setTender] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const [tData, rData, bData] = await Promise.all([
        getTender(tenderId),
        getRules(tenderId).catch(() => []),
        listSubmittedBids(tenderId).catch(() => []),
      ]);
      setTender(tData);
      setRules(rData || []);
      setBids(bData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenderId]);

  const handlePublish = async () => {
    setUpdatingStatus(true);
    setError("");
    setMessage("");
    try {
      await publishTender(tenderId);
      setMessage("Tender published successfully! It is now OPEN and accepting bidder submissions.");
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to publish tender.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePhaseChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    setError("");
    setMessage("");
    try {
      await updateTenderStatus(tenderId, newStatus);
      setMessage(`Tender lifecycle phase updated to: ${newStatus.replace(/_/g, " ").toUpperCase()}`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update lifecycle phase.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page-wrapper">
        <Header />
        <div className="page-container" style={{ marginTop: "40px" }}>
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading tender overview...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStatus = tender?.status || "draft";
  const allRulesApproved = rules.length > 0 && rules.every((r) => r.approved);

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title={tender?.title || "Tender Command Center"}
          breadcrumbs={[
            { label: "Officer Portal", href: "/officer" },
            { label: "Tenders", href: "/officer/tenders" },
            { label: tender?.title || "Tender" },
          ]}
          action={<StatusBadge status={currentStatus} />}
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

        {/* Lifecycle Phase Progression Bar */}
        <div className="card mb-6" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-navy-900)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Tender Lifecycle Phase
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="phase-select" style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                Manual Phase Override:
              </label>
              <select
                id="phase-select"
                className="form-select"
                value={currentStatus}
                onChange={(e) => handlePhaseChange(e.target.value)}
                disabled={updatingStatus}
                style={{ fontSize: "12px", padding: "4px 8px" }}
              >
                {PHASES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
            {PHASES.map((phase, idx) => {
              const isCurrent = currentStatus === phase.key;
              return (
                <div
                  key={phase.key}
                  style={{
                    padding: "10px",
                    borderRadius: "4px",
                    textAlign: "center",
                    border: isCurrent ? "2px solid var(--color-navy-900)" : "1px solid var(--color-border)",
                    backgroundColor: isCurrent ? "var(--color-navy-900)" : "#F8FAFC",
                    color: isCurrent ? "#FFFFFF" : "var(--color-text-secondary)",
                    fontSize: "11.5px",
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  <div style={{ fontSize: "10px", opacity: 0.8, marginBottom: "2px" }}>Phase {idx + 1}</div>
                  {phase.label}
                </div>
              );
            })}
          </div>

          {currentStatus !== "open" && allRulesApproved && (
            <div style={{ marginTop: "16px", padding: "12px 16px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: "#92400E", fontWeight: 600 }}>
                ✓ Rules approved! Tender is ready to be published and opened for bidder proposals.
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handlePublish}
                disabled={updatingStatus}
                style={{ backgroundColor: "#0A2E4D", color: "#FFFFFF", fontWeight: 700 }}
              >
                {updatingStatus ? "Publishing..." : "Publish & Open for Bids"}
              </button>
            </div>
          )}
        </div>

        {/* Quick Navigation Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          <div className="card" style={{ borderLeft: "4px solid var(--color-navy-700)", padding: "20px" }}>
            <span className="text-secondary text-sm">Eligibility Rules</span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-navy-900)", margin: "4px 0" }}>
              {rules.length} Rules ({rules.filter((r) => r.approved).length} Approved)
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
              Deterministic eligibility criteria extracted via Gemini AI.
            </p>
            <Link href={`/officer/tenders/${tenderId}/rules`} className="btn btn-secondary btn-sm w-full text-center">
              Configure & Approve Rules &rarr;
            </Link>
          </div>

          <div className="card" style={{ borderLeft: "4px solid var(--color-status-verified)", padding: "20px" }}>
            <span className="text-secondary text-sm">Submitted Bids</span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-status-verified)", margin: "4px 0" }}>
              {bids.length} Submissions
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
              Bidder proposals automatically verified against compliance rules.
            </p>
            <Link href={`/officer/tenders/${tenderId}/bids`} className="btn btn-primary btn-sm w-full text-center">
              Inspect Submitted Bids &rarr;
            </Link>
          </div>

          <div className="card" style={{ borderLeft: "4px solid #0284c7", padding: "20px" }}>
            <span className="text-secondary text-sm">Audit Trail</span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#0284c7", margin: "4px 0" }}>
              Full Log
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
              Immutable record of officer reviews, overrides, and final decisions.
            </p>
            <Link href={`/officer/tenders/${tenderId}/audit`} className="btn btn-secondary btn-sm w-full text-center">
              View Tender Audit Log &rarr;
            </Link>
          </div>
        </div>

        {/* Tender Specification Details */}
        <div className="card mb-6" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", color: "var(--color-navy-900)", marginBottom: "14px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
            Tender Specification & Scope
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div>
              <span className="text-secondary text-sm">Procuring Authority</span>
              <div style={{ fontWeight: 600, color: "var(--color-navy-900)", marginTop: "2px" }}>
                {tender?.organization || "Ministry of Commerce & Industry"}
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm">Procurement Category</span>
              <div style={{ fontWeight: 600, color: "var(--color-navy-900)", marginTop: "2px" }}>
                {tender?.category || "Industrial Goods & Equipment"}
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm">Created Date</span>
              <div style={{ fontWeight: 600, color: "var(--color-navy-900)", marginTop: "2px" }}>
                {new Date(tender?.created_at).toLocaleDateString("en-IN")}
              </div>
            </div>
          </div>

          {tender?.description && (
            <p style={{ fontSize: "13.5px", color: "var(--color-text-primary)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              {tender.description}
            </p>
          )}

          {tender?.uploaded_text && (
            <div>
              <span className="text-secondary text-sm">Raw Tender Ingested Text:</span>
              <pre
                style={{
                  background: "#F8FAFC",
                  padding: "14px",
                  borderRadius: "4px",
                  border: "1px solid var(--color-border)",
                  fontSize: "12px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  marginTop: "6px",
                }}
              >
                {tender.uploaded_text}
              </pre>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
