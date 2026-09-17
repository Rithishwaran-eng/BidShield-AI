"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getDashboard } from "@/app/lib/api";

export default function DashboardPage() {
  const params = useParams();
  const tenderId = params.id as string;

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bidderFilter, setBidderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchDashboard = async () => {
    try {
      const data = await getDashboard(tenderId, {
        bidder: bidderFilter || undefined,
        status: statusFilter || undefined,
      });
      setDashboard(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [tenderId, bidderFilter, statusFilter]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="empty-state">
        <h3>Dashboard unavailable</h3>
        <p>{error || "Could not load dashboard data."}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Compliance Dashboard"
        breadcrumbs={[
          { label: "Tenders", href: "/tenders" },
          { label: dashboard.tender_title || "Tender", href: `/tenders/${tenderId}` },
          { label: "Dashboard" },
        ]}
      />

      {error && (
        <div className="form-error mb-4" role="alert">{error}</div>
      )}

      {/* Per-bidder summary cards */}
      {dashboard.bidder_summaries.map((bidder: any) => (
        <div key={bidder.bidder_id} className="mb-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h2>{bidder.bidder_name}</h2>
            <span className="text-secondary text-sm">
              Evidence Coverage: {bidder.evidence_coverage}% ({bidder.total_documents_uploaded}/{bidder.total_documents_required} documents)
            </span>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-card-label">Verified</div>
              <div className="summary-card-value verified">
                {bidder.verified_count}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Issue Detected</div>
              <div className="summary-card-value issue">
                {bidder.issue_count}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Missing</div>
              <div className="summary-card-value missing">
                {bidder.missing_count}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Pending</div>
              <div className="summary-card-value pending">
                {bidder.pending_count}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Findings table with filters */}
      <div className="mt-6">
        <h2 className="mb-4">
          All Findings ({dashboard.findings.length})
        </h2>

        <div className="filter-bar">
          <select
            value={bidderFilter}
            onChange={(e) => setBidderFilter(e.target.value)}
            aria-label="Filter by bidder"
          >
            <option value="">All Bidders</option>
            {dashboard.bidder_summaries.map((b: any) => (
              <option key={b.bidder_id} value={b.bidder_id}>
                {b.bidder_name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="issue_detected">Issue Detected</option>
            <option value="missing">Missing</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {dashboard.findings.length === 0 ? (
          <div className="empty-state">
            <h3>No findings yet</h3>
            <p>Run verification on bidders to generate compliance findings.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="data-table-desktop">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bidder</th>
                    <th>Rule / Check</th>
                    <th>Status</th>
                    <th>Explanation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.findings.map((finding: any) => (
                    <tr key={finding.id}>
                      <td className="font-semibold">{finding.bidder_name}</td>
                      <td>
                        {finding.rule_requirement || "Cross-Document Consistency"}
                      </td>
                      <td>
                        <StatusBadge status={finding.status} />
                      </td>
                      <td className="text-secondary text-sm" style={{ maxWidth: "300px" }}>
                        {finding.explanation.length > 120
                          ? finding.explanation.substring(0, 120) + "..."
                          : finding.explanation}
                      </td>
                      <td>
                        <Link
                          href={`/tenders/${tenderId}/bidders/${finding.bidder_id}/findings/${finding.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="stacked-cards-mobile">
              {dashboard.findings.map((finding: any) => (
                <div className="stacked-card" key={finding.id}>
                  <div className="stacked-card-row">
                    <span className="stacked-card-label">Bidder</span>
                    <span className="stacked-card-value font-semibold">
                      {finding.bidder_name}
                    </span>
                  </div>
                  <div className="stacked-card-row">
                    <span className="stacked-card-label">Rule</span>
                    <span className="stacked-card-value text-sm">
                      {finding.rule_requirement || "Cross-Doc Check"}
                    </span>
                  </div>
                  <div className="stacked-card-row">
                    <span className="stacked-card-label">Status</span>
                    <span className="stacked-card-value">
                      <StatusBadge status={finding.status} />
                    </span>
                  </div>
                  <div className="stacked-card-row">
                    <span className="stacked-card-label">Explanation</span>
                    <span className="stacked-card-value text-secondary text-sm">
                      {finding.explanation.length > 80
                        ? finding.explanation.substring(0, 80) + "..."
                        : finding.explanation}
                    </span>
                  </div>
                  <div style={{ marginTop: "var(--space-3)" }}>
                    <Link
                      href={`/tenders/${tenderId}/bidders/${finding.bidder_id}/findings/${finding.id}`}
                      className="btn btn-secondary btn-sm w-full"
                    >
                      Review Evidence
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
