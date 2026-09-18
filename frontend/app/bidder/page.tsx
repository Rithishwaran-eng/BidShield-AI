"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import StatusBadge from "../components/StatusBadge";
import { listTenders, getBidderSubmissions } from "../lib/api";
import { useUserRole } from "../lib/useUserRole";

export default function BidderDashboardPage() {
  const { name, isOfficer } = useUserRole();
  const [openTenders, setOpenTenders] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      listTenders("open").catch(() => []),
      getBidderSubmissions().catch(() => []),
    ])
      .then(([tendersData, subsData]) => {
        setOpenTenders(tendersData || []);
        setSubmissions(subsData || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        {/* Welcome Banner */}
        <div style={{ marginBottom: "28px" }}>
          <span className="portal-section-kicker">Bidder & Supplier Portal</span>
          <h1 className="portal-section-title" style={{ fontSize: "1.8rem", margin: "4px 0" }}>
            Welcome, {name || "Bidder"}
          </h1>
          <p className="portal-section-desc">
            Discover public procurement opportunities, submit compliance dossiers, and track your bid evaluation status.
          </p>
        </div>

        {error && (
          <div className="card mb-4 form-error" role="alert">
            {error}
          </div>
        )}

        {/* Top Summary Metrics */}
        <div className="summary-grid mb-6">
          <div className="summary-card">
            <div className="summary-card-label">Open Opportunities</div>
            <div className="summary-card-value" style={{ color: "var(--color-navy-700)" }}>
              {openTenders.length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">My Submissions</div>
            <div className="summary-card-value" style={{ color: "var(--color-status-verified)" }}>
              {submissions.length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Under Evaluation</div>
            <div className="summary-card-value" style={{ color: "#0284c7" }}>
              {submissions.filter((s) => s.status === "verified" || s.status === "submitted").length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Clarifications Needed</div>
            <div className="summary-card-value" style={{ color: "var(--color-status-issue)" }}>
              {submissions.filter((s) => s.status === "issue_detected" || s.status === "clarification_required").length}
            </div>
          </div>
        </div>

        {/* Section 1: Open Tenders */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "var(--color-navy-900)", margin: 0 }}>
                Active Procurement Tenders
              </h2>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                Verified government tenders currently accepting bid submissions.
              </p>
            </div>
            <Link href="/bidder/tenders" className="btn btn-secondary btn-sm">
              View All Opportunities &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Loading tenders...</span>
            </div>
          ) : openTenders.length === 0 ? (
            <div className="card empty-state" style={{ padding: "32px", textAlign: "center" }}>
              <p>No tenders are currently open for bidding.</p>
              <p className="text-secondary text-sm">Please check back soon for newly published procurement notices.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
              {openTenders.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderLeft: "4px solid var(--color-navy-700)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
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
                        {t.category || "GeM Tender"}
                      </span>
                      <StatusBadge status="open" label="Accepting Bids" />
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-navy-900)", marginBottom: "6px" }}>
                      {t.title}
                    </h3>
                    <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", marginBottom: "12px", lineHeight: 1.4 }}>
                      {t.organization || "Ministry of Commerce & Industry"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
                    <Link
                      href={`/bidder/tenders/${t.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, textAlign: "center" }}
                    >
                      View Details
                    </Link>
                    {!isOfficer ? (
                      <Link
                        href={`/bidder/tenders/${t.id}/apply`}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, textAlign: "center", backgroundColor: "var(--color-saffron)", color: "#0A2E4D", fontWeight: 700 }}
                      >
                        Apply & Submit &rarr;
                      </Link>
                    ) : (
                      <Link
                        href={`/officer/tenders/${t.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, textAlign: "center", backgroundColor: "var(--color-navy-900)", color: "#FFFFFF", fontWeight: 700 }}
                      >
                        Officer Command &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: My Submitted Bids */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "var(--color-navy-900)", margin: 0 }}>
                My Submitted Bids
              </h2>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                Status of your submitted proposals and document compliance verification.
              </p>
            </div>
            <Link href="/bidder/submissions" className="btn btn-secondary btn-sm">
              All Submissions &rarr;
            </Link>
          </div>

          {submissions.length === 0 ? (
            <div className="card empty-state" style={{ padding: "32px", textAlign: "center" }}>
              <p>You have not submitted any bids yet.</p>
              <Link href="/bidder/tenders" className="btn btn-primary mt-2">
                Browse Open Tenders
              </Link>
            </div>
          ) : (
            <div className="data-table-desktop">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tender Reference</th>
                    <th>Procuring Organization</th>
                    <th>Submitted On</th>
                    <th>Documents</th>
                    <th>Verification Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.bid_id}>
                      <td style={{ fontWeight: 600, color: "var(--color-navy-900)" }}>
                        {sub.tender_title}
                      </td>
                      <td style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                        {sub.organization}
                      </td>
                      <td style={{ fontSize: "12.5px" }}>
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "--"}
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", background: "#F1F5F9", padding: "3px 8px", borderRadius: "4px" }}>
                          {sub.documents_count} Files Uploaded
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={sub.status} label={sub.display_status} />
                      </td>
                      <td>
                        <Link
                          href={`/bidder/submissions/${sub.bid_id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          View Receipt
                        </Link>
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
