"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import StatusBadge from "@/app/components/StatusBadge";
import { listTenders, getGlobalAuditLog } from "@/app/lib/api";
import { useUserRole } from "@/app/lib/useUserRole";

export default function OfficerDashboardPage() {
  const { name } = useUserRole();
  const [tenders, setTenders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      listTenders().catch(() => []),
      getGlobalAuditLog().catch(() => []),
    ])
      .then(([tendersData, auditData]) => {
        setTenders(tendersData || []);
        setAuditLogs(auditData || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openTenders = tenders.filter((t) => t.status === "open" || t.status === "active");
  const draftTenders = tenders.filter((t) => t.status === "draft" || t.status === "rules_pending" || t.status === "rules_approved");
  const evalTenders = tenders.filter((t) => t.status === "under_evaluation" || t.status === "bid_submission_closed");

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
          <div>
            <span className="portal-section-kicker">Procurement Evaluation Authority</span>
            <h1 className="portal-section-title" style={{ fontSize: "1.8rem", margin: "4px 0" }}>
              Procurement Officer Dashboard
            </h1>
            <p className="portal-section-desc">
              Manage tender lifecycles, review AI compliance findings, inspect cross-document evidence, and make final qualification decisions.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href="/officer/tenders/new"
              className="btn btn-primary"
              style={{
                backgroundColor: "var(--color-saffron)",
                color: "#0A2E4D",
                fontWeight: 700,
                fontSize: "13.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>+</span> Create / Import Tender
            </Link>
          </div>
        </div>

        {error && (
          <div className="card mb-4 form-error" role="alert">
            {error}
          </div>
        )}

        {/* Top Summary Metrics */}
        <div className="summary-grid mb-6">
          <div className="summary-card">
            <div className="summary-card-label">Total Dossiers</div>
            <div className="summary-card-value" style={{ color: "var(--color-navy-900)" }}>
              {tenders.length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Accepting Bids (OPEN)</div>
            <div className="summary-card-value" style={{ color: "var(--color-status-verified)" }}>
              {openTenders.length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Under Evaluation</div>
            <div className="summary-card-value" style={{ color: "#0284c7" }}>
              {evalTenders.length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Draft / Rules Pending</div>
            <div className="summary-card-value" style={{ color: "var(--color-status-pending)" }}>
              {draftTenders.length}
            </div>
          </div>
        </div>

        {/* Section 1: Active Tenders Grid */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "var(--color-navy-900)", margin: 0 }}>
                Procurement Tenders Under Management
              </h2>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                Select a tender to inspect submitted bids, review compliance findings, or manage rules.
              </p>
            </div>
            <Link href="/officer/tenders" className="btn btn-secondary btn-sm">
              View All Tenders &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Loading procurement tenders...</span>
            </div>
          ) : tenders.length === 0 ? (
            <div className="card empty-state" style={{ padding: "40px", textAlign: "center" }}>
              <p>No procurement tenders found.</p>
              <Link href="/officer/tenders/new" className="btn btn-primary mt-2">
                Create or Import First Tender
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {tenders.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                    borderLeft: "4px solid var(--color-navy-700)",
                    padding: "18px 24px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "3px",
                          background: "#e0f2fe",
                          color: "#0369a1",
                          textTransform: "uppercase",
                        }}
                      >
                        {t.category || "GeM Bid"}
                      </span>
                      <StatusBadge status={t.status} />
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        Created: {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-navy-900)", margin: "2px 0 4px 0" }}>
                      {t.title}
                    </h3>
                    <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", margin: 0 }}>
                      Procuring Entity: <strong>{t.organization || "Ministry of Commerce & Industry"}</strong>
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Link
                      href={`/officer/tenders/${t.id}/bids`}
                      className="btn btn-primary"
                      style={{ fontSize: "13px" }}
                    >
                      Submitted Bids &rarr;
                    </Link>
                    <Link
                      href={`/officer/tenders/${t.id}/rules`}
                      className="btn btn-secondary"
                      style={{ fontSize: "13px" }}
                    >
                      Rules Setup
                    </Link>
                    <Link
                      href={`/officer/tenders/${t.id}`}
                      className="btn btn-secondary"
                      style={{ fontSize: "13px" }}
                    >
                      Overview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Recent Officer Actions / Audit */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "var(--color-navy-900)", margin: 0 }}>
                Recent Officer Audit Trail
              </h2>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                Immutable log of human-in-the-loop review actions, overrides, and qualification decisions.
              </p>
            </div>
            <Link href="/officer/audit" className="btn btn-secondary btn-sm">
              Full Audit Trail &rarr;
            </Link>
          </div>

          {auditLogs.length === 0 ? (
            <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "13px" }}>
              No review actions recorded yet. Actions taken during evidence review and qualification decisions will be audited here.
            </div>
          ) : (
            <div className="data-table-desktop">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Officer</th>
                    <th>Action Taken</th>
                    <th>Rule / Check</th>
                    <th>Bidder Involved</th>
                    <th>Note / Justification</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.slice(0, 5).map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                        {new Date(entry.created_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td style={{ fontWeight: 600 }}>{entry.officer_name}</td>
                      <td style={{ textTransform: "capitalize" }}>
                        {(entry.action || "").replace(/_/g, " ")}
                      </td>
                      <td style={{ fontSize: "12.5px" }}>
                        <span className="mono">{entry.rule_code}</span>
                      </td>
                      <td>{entry.bidder_name || "--"}</td>
                      <td style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", maxWidth: "260px" }}>
                        {entry.note || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
