"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getBidderSubmissionDetail } from "@/app/lib/api";

export default function BidderSubmissionDetailPage() {
  const params = useParams();
  const bidId = params.bidId as string;

  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBidderSubmissionDetail(bidId)
      .then(setSubmission)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bidId]);

  if (loading) {
    return (
      <div className="landing-page-wrapper">
        <Header />
        <div className="page-container" style={{ marginTop: "40px" }}>
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading submission details...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="landing-page-wrapper">
        <Header />
        <div className="page-container" style={{ marginTop: "40px" }}>
          <div className="card form-error">
            <h3>Submission Not Found</h3>
            <p>{error || "Could not retrieve the requested bid submission details."}</p>
            <Link href="/bidder/submissions" className="btn btn-primary mt-4">
              &larr; Back to My Submissions
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const rawStatus = submission.status || "submitted";
  let displayStatus = "Submission Received & Verified";
  if (rawStatus === "verified" || rawStatus === "reviewed") {
    displayStatus = "Under Evaluation by Procurement Officer";
  } else if (rawStatus === "issue_detected" || rawStatus === "clarification_required") {
    displayStatus = "Clarification May Be Requested";
  } else if (rawStatus === "processing") {
    displayStatus = "Automated Verification in Progress";
  }

  if (submission.officer_decision === "qualified") {
    displayStatus = "Qualified (Officer Decision)";
  } else if (submission.officer_decision === "not_qualified") {
    displayStatus = "Not Qualified (Officer Decision)";
  }

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title="Submission Confirmation & Status"
          breadcrumbs={[
            { label: "Bidder Portal", href: "/bidder" },
            { label: "My Submissions", href: "/bidder/submissions" },
            { label: `Receipt #${bidId.substring(0, 8)}` },
          ]}
        />

        {/* Success Confirmation Card */}
        <div
          className="card mb-6"
          style={{
            backgroundColor: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderLeft: "5px solid #16a34a",
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#DCFCE7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "18px", color: "#14532d", margin: "0 0 4px 0" }}>
                Bid Proposal Successfully Submitted
              </h2>
              <p style={{ fontSize: "13.5px", color: "#166534", margin: 0, lineHeight: 1.5 }}>
                Your compliance documents have been received by BidShield AI and registered for official evaluation by the Procurement Authority.
              </p>
            </div>
          </div>
        </div>

        {/* Submission Details Grid */}
        <div className="card mb-6" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", color: "var(--color-navy-900)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
            Submission Summary
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div>
              <span className="text-secondary text-sm">Submission Reference ID</span>
              <div className="mono" style={{ fontWeight: 700, color: "var(--color-navy-900)", marginTop: "2px" }}>
                {bidId}
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm">Tender Reference</span>
              <div style={{ fontWeight: 600, color: "var(--color-navy-900)", marginTop: "2px" }}>
                {submission.tender_title}
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm">Procuring Authority</span>
              <div style={{ fontWeight: 600, color: "var(--color-navy-900)", marginTop: "2px" }}>
                {submission.organization || "Ministry of Commerce & Industry"}
              </div>
            </div>
            <div>
              <span className="text-secondary text-sm">Submission Timestamp</span>
              <div style={{ fontWeight: 600, color: "var(--color-navy-900)", marginTop: "2px" }}>
                {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }) : "--"}
              </div>
            </div>
          </div>

          <div style={{ padding: "14px 18px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span className="text-secondary text-sm">Current Evaluation Status:</span>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-navy-900)", marginTop: "2px" }}>
                {displayStatus}
              </div>
            </div>
            <StatusBadge status={rawStatus} label={displayStatus} />
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="card mb-6" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", color: "var(--color-navy-900)", marginBottom: "12px" }}>
            Uploaded Compliance Documents ({submission.documents?.length || 0})
          </h3>
          <p className="text-secondary text-sm mb-4">
            The following self-attested documents were received and archived for the procurement evaluation committee:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
            {(submission.documents || []).map((doc: any) => (
              <div
                key={doc.id}
                style={{
                  padding: "14px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                  background: "#F8FAFC",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--color-navy-900)" }}>
                    📄 {doc.document_type}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                    {doc.filename}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: doc.extraction_status === "done" ? "#DCFCE7" : "#FEF3C7",
                    color: doc.extraction_status === "done" ? "#166534" : "#92400E",
                  }}
                >
                  {doc.extraction_status === "done" ? "VERIFIED" : "PROCESSING"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Information Notice */}
        <div className="card" style={{ backgroundColor: "#F8FAFC", borderLeft: "4px solid var(--color-navy-700)" }}>
          <h4 style={{ fontSize: "13.5px", color: "var(--color-navy-900)", margin: "0 0 6px 0" }}>
            Next Steps in the Procurement Process
          </h4>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
            BidShield AI provides automated compliance extraction to the Procurement Officer. All qualification decisions are reviewed and executed by authorized evaluating officers. If clarification regarding legal entity names or certificates is requested, you will be contacted via your registered email address.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
