"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { listDocuments } from "@/app/lib/api";

export default function VerificationResultsPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const bidderId = params.bidderId as string;

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listDocuments(bidderId)
      .then(setDocuments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [bidderId]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <span>Loading verification results...</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Verification Results"
        breadcrumbs={[
          { label: "Tenders", href: "/tenders" },
          { label: "Tender", href: `/tenders/${tenderId}` },
          { label: "Bidders", href: `/tenders/${tenderId}/bidders` },
          { label: "Results" },
        ]}
        action={
          <Link
            href={`/tenders/${tenderId}/dashboard`}
            className="btn btn-secondary"
          >
            View Dashboard
          </Link>
        }
      />

      {error && (
        <div className="form-error mb-4" role="alert">{error}</div>
      )}

      {documents.length === 0 ? (
        <div className="empty-state">
          <h3>No documents found</h3>
          <p>Upload documents for this bidder to see verification results.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "var(--space-4)" }}>
          {documents.map((doc) => {
            const isLowConfidence =
              doc.confidence !== null &&
              doc.confidence !== undefined &&
              parseFloat(doc.confidence) < 0.7;

            return (
              <div
                key={doc.id}
                className={`card ${isLowConfidence ? "low-confidence" : ""}`}
              >
                <div className="card-header">
                  <div>
                    <h3>{doc.document_type}</h3>
                    <p className="text-secondary text-sm">{doc.filename}</p>
                  </div>
                  <StatusBadge status={doc.extraction_status} />
                </div>

                {isLowConfidence && (
                  <div
                    className="mb-4"
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      backgroundColor: "var(--color-status-missing-bg)",
                      borderRadius: "var(--radius)",
                    }}
                  >
                    <span className="low-confidence-label">
                      Low confidence -- review recommended
                    </span>
                  </div>
                )}

                <div className="evidence-field">
                  <span className="evidence-field-label">Legal Name</span>
                  <span className="evidence-field-value">
                    {doc.legal_name || "Not extracted"}
                  </span>
                </div>

                <div className="evidence-field">
                  <span className="evidence-field-label">ID Number</span>
                  <span className="evidence-field-value mono">
                    {doc.id_number || "Not extracted"}
                  </span>
                </div>

                {doc.registration_date && (
                  <div className="evidence-field">
                    <span className="evidence-field-label">Registration Date</span>
                    <span className="evidence-field-value">
                      {new Date(doc.registration_date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                <div className="evidence-field">
                  <span className="evidence-field-label">Confidence</span>
                  <span
                    className={`evidence-field-value ${isLowConfidence ? "mismatch" : ""}`}
                  >
                    {doc.confidence !== null && doc.confidence !== undefined
                      ? `${(parseFloat(doc.confidence) * 100).toFixed(0)}%`
                      : "N/A"}
                  </span>
                </div>

                <div className="evidence-field">
                  <span className="evidence-field-label">Page</span>
                  <span className="evidence-field-value">
                    {doc.page || "N/A"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
