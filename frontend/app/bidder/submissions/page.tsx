"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getBidderSubmissions } from "@/app/lib/api";

export default function BidderSubmissionsListPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBidderSubmissions()
      .then(setSubmissions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title="My Submitted Bids"
          breadcrumbs={[
            { label: "Bidder Portal", href: "/bidder" },
            { label: "My Submissions" },
          ]}
        />

        {error && (
          <div className="card form-error mb-4" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading submissions...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="card empty-state" style={{ textAlign: "center", padding: "40px" }}>
            <h3>No submissions recorded yet</h3>
            <p className="text-secondary text-sm mb-4">
              Explore open tenders to apply and submit your first bid compliance dossier.
            </p>
            <Link href="/bidder/tenders" className="btn btn-primary">
              Browse Open Opportunities
            </Link>
          </div>
        ) : (
          <div className="data-table-desktop">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tender Specification</th>
                  <th>Procuring Organization</th>
                  <th>Submission Timestamp</th>
                  <th>Documents Attached</th>
                  <th>Verification Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
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
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : "--"}
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", background: "#F1F5F9", padding: "3px 8px", borderRadius: "4px" }}>
                        {sub.documents_count} Files Uploaded
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={sub.status} label={sub.display_status} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/bidder/submissions/${sub.bid_id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View Submission &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
