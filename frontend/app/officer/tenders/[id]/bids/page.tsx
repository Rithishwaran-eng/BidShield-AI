"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getTender, listSubmittedBids } from "@/app/lib/api";

export default function OfficerSubmittedBidsPage() {
  const params = useParams();
  const tenderId = params.id as string;

  const [tender, setTender] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const [tData, bData] = await Promise.all([
        getTender(tenderId),
        listSubmittedBids(tenderId),
      ]);
      setTender(tData);
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

  const handleSyncGeM = async () => {
    setSyncing(true);
    setMessage("");
    try {
      // Simulated GeM sync delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      await fetchData();
      setMessage("Synced with GeM simulated e-Procurement repository. All received bids updated.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page-wrapper">
        <Header />
        <div className="page-container" style={{ marginTop: "40px" }}>
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading submitted bids...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const verifiedCount = bids.filter((b) => b.status === "verified" || b.status === "qualified").length;
  const issuesCount = bids.filter((b) => b.status === "issue_detected" || b.issue_count > 0).length;
  const missingCount = bids.filter((b) => b.status === "missing" || b.missing_count > 0).length;

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title="Submitted Bids & Compliance Status"
          breadcrumbs={[
            { label: "Officer Portal", href: "/officer" },
            { label: "Tenders", href: "/officer/tenders" },
            { label: tender?.title || "Tender", href: `/officer/tenders/${tenderId}` },
            { label: "Submitted Bids" },
          ]}
          action={
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSyncGeM}
                disabled={syncing}
                title="Sync with GeM bid repository"
              >
                {syncing ? "Syncing GeM..." : "🔄 Sync Bids (GeM)"}
              </button>
              <StatusBadge status={tender?.status || "open"} />
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

        {/* Top Metric Cards */}
        <div className="summary-grid mb-6">
          <div className="summary-card">
            <div className="summary-card-label">Total Submissions Received</div>
            <div className="summary-card-value" style={{ color: "var(--color-navy-900)" }}>
              {bids.length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Clean & Verified</div>
            <div className="summary-card-value" style={{ color: "var(--color-status-verified)" }}>
              {verifiedCount}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Inconsistencies Detected</div>
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

        {/* Submitted Bids Table */}
        <div className="card mb-6" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "16px", color: "var(--color-navy-900)", margin: 0 }}>
                Submitted Bid Proposals ({bids.length})
              </h2>
              <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                Bids are automatically evaluated against the approved rules upon submission. Click <strong>Inspect Dossier</strong> to review evidence findings.
              </p>
            </div>
          </div>

          {bids.length === 0 ? (
            <div className="card empty-state" style={{ padding: "36px", textAlign: "center" }}>
              <p>No bids have been submitted for this tender yet.</p>
              <p className="text-secondary text-sm">
                Ensure the tender is <strong>OPEN</strong> so bidders can submit their compliance dossiers through the Bidder Portal.
              </p>
            </div>
          ) : (
            <div className="data-table-desktop">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bidder Company</th>
                    <th>Submission Time</th>
                    <th>Automated Verification</th>
                    <th style={{ textAlign: "center" }}>Verified</th>
                    <th style={{ textAlign: "center" }}>Issues</th>
                    <th style={{ textAlign: "center" }}>Missing</th>
                    <th>Officer Decision</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b) => (
                    <tr key={b.bid_id || b.bidder_id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--color-navy-900)" }}>
                          {b.bidder_name}
                        </div>
                        {b.legal_name && b.legal_name !== b.bidder_name && (
                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                            Legal: {b.legal_name}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                        {b.submitted_at ? new Date(b.submitted_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : "--"}
                      </td>
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-status-verified)" }}>
                          {b.verified_count}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 700, color: b.issue_count > 0 ? "var(--color-status-issue)" : "var(--color-text-secondary)" }}>
                          {b.issue_count}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 700, color: b.missing_count > 0 ? "var(--color-status-missing)" : "var(--color-text-secondary)" }}>
                          {b.missing_count}
                        </span>
                      </td>
                      <td>
                        {b.officer_decision ? (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "3px",
                              fontSize: "11px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              background: b.officer_decision === "qualified" ? "#DCFCE7" : "#FEE2E2",
                              color: b.officer_decision === "qualified" ? "#166534" : "#991B1B",
                            }}
                          >
                            {b.officer_decision}
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                            Pending Decision
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          href={`/officer/tenders/${tenderId}/bids/${b.bid_id || b.bidder_id}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: "12.5px" }}
                        >
                          Inspect Dossier &rarr;
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
