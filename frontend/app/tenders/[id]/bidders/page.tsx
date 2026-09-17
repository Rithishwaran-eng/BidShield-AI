"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import {
  listBidders,
  createBidder,
  listDocuments,
  uploadDocument,
  runVerification,
  getRules,
} from "@/app/lib/api";
import { useUserRole } from "@/app/lib/useUserRole";


interface BidderWithDocs {
  id: string;
  name: string;
  documents: any[];
  verificationResult?: any;
}

const DOC_TYPES = ["GST", "PAN", "UDYAM", "FINANCIALS", "EXPERIENCE", "EMD", "BID_FORM"];

const SIMULATED_SOURCES = [
  "GST Network (GSTN)",
  "Income Tax (PAN)",
  "Ministry of MSME (Udyam)",
  "MCA-21 Corporate Registry",
  "DPIIT Startup Recognition",
  "NSIC Registration Directory",
  "EPFO Compliance",
  "ESIC Registration",
  "DigiLocker",
  "OEM Authorization",
  "Debarment & Blacklist Check",
];

export default function BiddersPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const { isAuditor } = useUserRole();

  const [bidders, setBidders] = useState<BidderWithDocs[]>([]);

  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newBidderName, setNewBidderName] = useState("");
  const [addingBidder, setAddingBidder] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [expandedBidder, setExpandedBidder] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [bidderList, ruleList] = await Promise.all([
        listBidders(tenderId),
        getRules(tenderId),
      ]);
      setRules(ruleList);

      const biddersWithDocs = await Promise.all(
        bidderList.map(async (b: any) => {
          const docs = await listDocuments(b.id);
          return { ...b, documents: docs };
        })
      );
      setBidders(biddersWithDocs);
      if (biddersWithDocs.length > 0 && !expandedBidder) {
        setExpandedBidder(biddersWithDocs[0].id);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenderId]);

  const handleAddBidder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBidderName.trim()) return;

    setAddingBidder(true);
    setError("");
    try {
      await createBidder(tenderId, newBidderName.trim());
      setNewBidderName("");
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddingBidder(false);
    }
  };

  const handleUpload = async (bidderId: string, docType: string, file: File) => {
    setUploadingFor(`${bidderId}-${docType}`);
    setError("");
    try {
      await uploadDocument(bidderId, file, docType);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingFor(null);
    }
  };

  const handleVerify = async (bidderId: string) => {
    setVerifying(bidderId);
    setError("");
    try {
      const result = await runVerification(bidderId);
      const updated = bidders.map((b) =>
        b.id === bidderId ? { ...b, verificationResult: result } : b
      );
      setBidders(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setVerifying(null);
    }
  };

  const getDocForType = (docs: any[], type: string) => {
    return docs.find((d) => d.document_type === type);
  };

  const getMandatoryTypes = () => {
    const types = new Set<string>();
    rules.forEach((r) => {
      if (r.mandatory) {
        (r.evidence_required || []).forEach((ev: string) => {
          if (ev.toLowerCase().includes("gst")) types.add("GST");
          else if (ev.toLowerCase().includes("pan")) types.add("PAN");
          else if (ev.toLowerCase().includes("udyam") || ev.toLowerCase().includes("msme")) types.add("UDYAM");
          else if (ev.toLowerCase().includes("financial") || ev.toLowerCase().includes("turnover")) types.add("FINANCIALS");
          else if (ev.toLowerCase().includes("experience") || ev.toLowerCase().includes("work order")) types.add("EXPERIENCE");
          else if (ev.toLowerCase().includes("emd") || ev.toLowerCase().includes("bank guarantee")) types.add("EMD");
        });
      }
    });
    return types;
  };

  const mandatoryTypes = getMandatoryTypes();

  const getMissingMandatory = (docs: any[]) => {
    const uploaded = new Set(docs.map((d) => d.document_type));
    return [...mandatoryTypes].filter((t) => !uploaded.has(t));
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <span>Loading bidders...</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Bidders"
        breadcrumbs={[
          { label: "Tenders", href: "/tenders" },
          { label: "Tender", href: `/tenders/${tenderId}` },
          { label: "Bidders" },
        ]}
      />

      {error && (
        <div className="form-error mb-4" role="alert">{error}</div>
      )}

      {/* Add Bidder form (Officer / Admin only) */}
      {!isAuditor ? (
        <div className="card mb-6">
          <h3>Add Bidder</h3>
          <form onSubmit={handleAddBidder} className="flex gap-2 mt-2" style={{ maxWidth: "480px" }}>
            <div className="flex-1">
              <label htmlFor="bidder-name" className="form-label">
                Bidder Name <span className="form-required">(required)</span>
              </label>
              <input
                id="bidder-name"
                type="text"
                className="form-input"
                value={newBidderName}
                onChange={(e) => setNewBidderName(e.target.value)}
                placeholder="e.g., Reliable Systems Pvt Ltd"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addingBidder || !newBidderName.trim()}
              style={{ alignSelf: "flex-end" }}
            >
              {addingBidder ? "Adding..." : "Add Bidder"}
            </button>
          </form>
        </div>
      ) : (
        <div className="card mb-6" style={{ backgroundColor: "var(--color-bg)", borderLeft: "4px solid var(--color-navy-700)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
            <strong>Auditor Mode:</strong> Read-only access to uploaded bidder dossiers and verification reports. Document uploads and verification executions are disabled.
          </p>
        </div>
      )}


      {/* Bidder list */}
      {bidders.length === 0 ? (
        <div className="empty-state">
          <h3>No bidders added yet</h3>
          <p>Add bidders and upload their documents for compliance verification.</p>
        </div>
      ) : (
        <div className="accordion">
          {bidders.map((bidder) => {
            const isExpanded = expandedBidder === bidder.id;
            const missing = getMissingMandatory(bidder.documents);
            const docCount = bidder.documents.length;
            const canVerify = missing.length === 0 && docCount > 0;

            return (
              <div className="accordion-item" key={bidder.id}>
                <button
                  className="accordion-header"
                  onClick={() => setExpandedBidder(isExpanded ? null : bidder.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{bidder.name}</span>
                    <span className="text-secondary text-sm">
                      {docCount} document{docCount !== 1 ? "s" : ""} uploaded
                    </span>
                    {missing.length > 0 && (
                      <StatusBadge status="missing" label={`${missing.length} missing`} />
                    )}
                    {canVerify && bidder.verificationResult && (
                      <StatusBadge status="verified" label="Verified" />
                    )}
                  </div>
                  <span style={{ fontSize: "var(--text-sm)" }}>
                    {isExpanded ? "Collapse" : "Expand"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="accordion-body">
                    {/* Document upload grid */}
                    <h3 className="mb-4">Documents</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-3)" }}>
                      {DOC_TYPES.map((docType) => {
                        const doc = getDocForType(bidder.documents, docType);
                        const isMandatory = mandatoryTypes.has(docType);
                        const isUploading = uploadingFor === `${bidder.id}-${docType}`;

                        return (
                          <div
                            key={docType}
                            className="card"
                            style={{
                              borderLeftWidth: "3px",
                              borderLeftColor: doc
                                ? doc.extraction_status === "done"
                                  ? "var(--color-status-verified)"
                                  : doc.extraction_status === "pending"
                                  ? "var(--color-status-missing)"
                                  : "var(--color-status-issue)"
                                : "var(--color-border)",
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{docType}</span>
                              {isMandatory && (
                                <span className="text-sm text-secondary">(required)</span>
                              )}
                            </div>

                            {doc ? (
                              <>
                                <p className="text-sm text-secondary mb-2">
                                  {doc.filename}
                                </p>
                                <StatusBadge status={doc.extraction_status} />
                                {doc.legal_name && (
                                  <p className="text-sm mt-2">
                                    <span className="text-secondary">Name: </span>
                                    {doc.legal_name}
                                  </p>
                                )}
                                {doc.id_number && (
                                  <p className="text-sm mt-2">
                                    <span className="text-secondary">ID: </span>
                                    <span className="mono">{doc.id_number}</span>
                                  </p>
                                )}
                                {doc.confidence !== null && doc.confidence !== undefined && (
                                  <p className={`text-sm mt-2 ${parseFloat(doc.confidence) < 0.7 ? "low-confidence-label" : "text-secondary"}`}>
                                    Confidence: {(parseFloat(doc.confidence) * 100).toFixed(0)}%
                                    {parseFloat(doc.confidence) < 0.7 && " -- Low confidence, review recommended"}
                                  </p>
                                )}
                              </>
                            ) : isAuditor ? (
                              <div style={{ padding: "var(--space-3)", marginTop: "var(--space-2)", backgroundColor: "#f8fafc", borderRadius: "4px", textAlign: "center", border: "1px dashed var(--color-border)" }}>
                                <span className="text-secondary text-sm">Document not uploaded</span>
                              </div>
                            ) : (
                              <>
                                <label
                                  className="file-upload"
                                  style={{ padding: "var(--space-3)", marginTop: "var(--space-2)" }}
                                >
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleUpload(bidder.id, docType, f);
                                    }}
                                    disabled={isUploading}
                                  />
                                  <span className="file-upload-label">
                                    {isUploading ? (
                                      <span className="flex items-center gap-2">
                                        <span className="spinner"></span> Uploading...
                                      </span>
                                    ) : (
                                      <><strong>Upload</strong> {docType} document</>
                                    )}
                                  </span>
                                </label>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Verification controls */}
                    <div className="mt-4">
                      {missing.length > 0 && !isAuditor && (
                        <p className="text-secondary text-sm mb-2">
                          Missing mandatory documents: {missing.join(", ")}. Upload these before running verification.
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {!isAuditor && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleVerify(bidder.id)}
                            disabled={!canVerify || verifying === bidder.id}
                          >
                            {verifying === bidder.id ? "Running Verification..." : "Run Verification"}
                          </button>
                        )}
                        {bidder.verificationResult && (
                          <Link
                            href={`/tenders/${tenderId}/bidders/${bidder.id}/results`}
                            className="btn btn-secondary"
                          >
                            View Results
                          </Link>
                        )}
                      </div>
                    </div>

                      {verifying === bidder.id && (
                        <div className="loading-state mt-2">
                          <div className="spinner"></div>
                          <span>Running cross-document checks and compliance engine...</span>
                        </div>
                      )}

                      {bidder.verificationResult && (
                        <div className="card mt-4" style={{ backgroundColor: "var(--color-bg)" }}>
                          <h3 className="mb-2">Verification Summary</h3>
                          <div className="flex gap-4 flex-wrap">
                            {Object.entries(bidder.verificationResult.status_counts || {}).map(
                              ([status, count]) => (
                                <div key={status} className="flex items-center gap-2">
                                  <StatusBadge status={status} />
                                  <span className="font-semibold">{count as number}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Verification Sources Panel */}
      <div className="card mt-6">
        <h3 className="mb-2" style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-navy-900)" }}>
          Verification Sources (Simulated)
        </h3>
        <p className="text-secondary text-sm mb-3">
          Statutory registries simulated for bidder credential validation during automated verification:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {SIMULATED_SOURCES.map((name) => (
            <span
              key={name}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                background: "var(--color-status-pending-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                fontSize: "12px",
                color: "var(--color-text-primary)",
              }}
            >
              <span>{name}</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "var(--color-text-secondary)",
                  background: "rgba(0,0,0,0.06)",
                  padding: "1px 5px",
                  borderRadius: "2px",
                }}
              >
                Simulated
              </span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
