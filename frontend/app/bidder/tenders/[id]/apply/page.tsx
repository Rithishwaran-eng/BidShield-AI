"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import { getTender, getRules, submitBidApplication } from "@/app/lib/api";
import { useUserRole } from "@/app/lib/useUserRole";

const STANDARD_DOCUMENT_TYPES = [
  { key: "GST", label: "GST Registration Certificate", hint: "Active GSTIN Certificate" },
  { key: "PAN", label: "PAN Card", hint: "Matching legal entity name" },
  { key: "UDYAM", label: "Udyam / MSME Certificate", hint: "If claiming MSME benefits" },
  { key: "FINANCIALS", label: "Audited Financial Statements", hint: "CA-certified turnover reports (FY 2022-25)" },
  { key: "EXPERIENCE", label: "Past Experience / Work Orders", hint: "Completion certificates for prior supply contracts" },
  { key: "EMD", label: "Earnest Money Deposit (EMD)", hint: "Bank Guarantee or DD receipt" },
  { key: "BID_FORM", label: "Bid Submission Form / Declaration", hint: "Signed declaration on company letterhead" },
];

export default function BidApplyPage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;
  const { name, email: userEmail } = useUserRole();

  const [tender, setTender] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loadingTender, setLoadingTender] = useState(true);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [certify, setCertify] = useState(false);

  // File uploads state: { [docType]: File }
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    Promise.all([
      getTender(tenderId),
      getRules(tenderId),
    ])
      .then(([t, r]) => {
        setTender(t);
        setRules(r || []);
        if (userEmail) setContactEmail(userEmail);
        if (name && name !== "BIDDER") setCompanyName(name);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingTender(false));
  }, [tenderId, userEmail, name]);

  const handleFileChange = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles((prev) => ({
        ...prev,
        [docType]: file,
      }));
    }
  };

  const handleRemoveFile = (docType: string) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
  };

  const handleQuickFillSample = () => {
    setCompanyName("Reliable Systems Private Limited");
    setLegalName("Reliable Systems Private Limited");
    setPan("AABCR1234M");
    setGstin("27AABCR1234M1Z5");
    setContactEmail(userEmail || "tenders@reliablesystems.in");
    setContactPhone("+91 98201 12345");
    setCertify(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactEmail.trim()) {
      setError("Please provide company name and contact email.");
      return;
    }

    const fileEntries = Object.entries(uploadedFiles);
    if (fileEntries.length === 0) {
      setError("Please upload at least one compliance document (e.g. GST, PAN, Financials) before submitting.");
      return;
    }

    if (!certify) {
      setError("Please certify that all submitted documents are accurate.");
      return;
    }

    setSubmitting(true);
    setError("");
    setStatusMessage("Submitting bid and initiating BidShield automated compliance verification...");

    try {
      const docPayload = fileEntries.map(([docType, file]) => ({
        file,
        documentType: docType,
      }));

      const res = await submitBidApplication(
        tenderId,
        {
          company_name: companyName.trim(),
          legal_name: (legalName || companyName).trim(),
          pan: pan.trim() || undefined,
          gstin: gstin.trim() || undefined,
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || undefined,
        },
        docPayload
      );

      setStatusMessage("Verification complete! Redirecting to submission confirmation...");
      const bidId = res.bid_id || res.bidder_id;
      router.push(`/bidder/submissions/${bidId}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit bid. Please check backend connection.");
      setSubmitting(false);
      setStatusMessage("");
    }
  };

  if (loadingTender) {
    return (
      <div className="landing-page-wrapper">
        <Header />
        <div className="page-container" style={{ marginTop: "40px" }}>
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading bid submission form...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title="Submit Bid Proposal"
          breadcrumbs={[
            { label: "Bidder Portal", href: "/bidder" },
            { label: "Open Tenders", href: "/bidder/tenders" },
            { label: tender?.title || "Tender", href: `/bidder/tenders/${tenderId}` },
            { label: "Apply" },
          ]}
        />

        {/* Header Notice Banner */}
        <div className="card mb-6" style={{ borderLeft: "4px solid var(--color-navy-700)", backgroundColor: "#FFFFFF", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span className="text-secondary text-sm">Applying for Procurement Tender</span>
              <h2 style={{ fontSize: "16.5px", color: "var(--color-navy-900)", margin: "2px 0 4px 0" }}>
                {tender?.title}
              </h2>
              <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", margin: 0 }}>
                Procuring Authority: <strong>{tender?.organization || "Ministry of Commerce & Industry"}</strong>
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleQuickFillSample}
              style={{ fontSize: "12px" }}
            >
              Quick Fill Sample Data
            </button>
          </div>
        </div>

        {error && (
          <div className="card mb-4 form-error" role="alert">
            {error}
          </div>
        )}

        {statusMessage && (
          <div className="card mb-4" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="spinner" style={{ borderColor: "#166534", borderTopColor: "transparent" }}></div>
            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Bidder Company Information */}
          <div className="card mb-6" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "15.5px", color: "var(--color-navy-900)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
              1. Company & Identification Details
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div className="form-group">
                <label htmlFor="company-name" className="form-label">
                  Company / Entity Name <span className="form-required">*</span>
                </label>
                <input
                  id="company-name"
                  type="text"
                  className="form-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Reliable Systems Private Limited"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="legal-name" className="form-label">
                  Legal Entity Name (as in PAN / GST)
                </label>
                <input
                  id="legal-name"
                  type="text"
                  className="form-input"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Leave blank if identical to company name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pan" className="form-label">
                  Permanent Account Number (PAN)
                </label>
                <input
                  id="pan"
                  type="text"
                  className="form-input mono"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="e.g. AABCR1234M"
                  maxLength={10}
                />
              </div>

              <div className="form-group">
                <label htmlFor="gstin" className="form-label">
                  GST Identification Number (GSTIN)
                </label>
                <input
                  id="gstin"
                  type="text"
                  className="form-input mono"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AABCR1234M1Z5"
                  maxLength={15}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Authorized Contact Email <span className="form-required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  placeholder="bids@company.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Contact Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="form-input"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98201 12345"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Required Document Uploads Checklist */}
          <div className="card mb-6" style={{ padding: "24px" }}>
            <div style={{ marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "15.5px", color: "var(--color-navy-900)", margin: 0 }}>
                2. Mandatory Compliance Documents Upload
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
                Upload self-attested PDF copies for automated compliance verification by BidShield AI.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {STANDARD_DOCUMENT_TYPES.map((dt) => {
                const uploadedFile = uploadedFiles[dt.key];

                return (
                  <div
                    key={dt.key}
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "6px",
                      padding: "16px",
                      backgroundColor: uploadedFile ? "#F0FDF4" : "#F8FAFC",
                      borderLeft: uploadedFile ? "4px solid var(--color-status-verified)" : "4px solid var(--color-border)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--color-navy-900)" }}>
                          {dt.label}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 600, background: "#E2E8F0", padding: "1px 6px", borderRadius: "3px" }}>
                          {dt.key}
                        </span>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 10px 0" }}>
                        {dt.hint}
                      </p>
                    </div>

                    {uploadedFile ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", padding: "8px 12px", borderRadius: "4px", border: "1px solid #BBF7D0" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>
                          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#166534" }}>
                            {uploadedFile.name}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                            {Math.round(uploadedFile.size / 1024)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(dt.key)}
                          style={{ background: "none", border: "none", color: "var(--color-status-issue)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <label
                        style={{
                          display: "block",
                          border: "1px dashed #94a3b8",
                          borderRadius: "4px",
                          padding: "10px",
                          textAlign: "center",
                          cursor: "pointer",
                          backgroundColor: "#FFFFFF",
                          fontSize: "12.5px",
                          color: "var(--color-navy-700)",
                          fontWeight: 500,
                        }}
                      >
                        <input
                          type="file"
                          accept=".pdf"
                          style={{ display: "none" }}
                          onChange={(e) => handleFileChange(dt.key, e)}
                        />
                        <span>+ Select {dt.key} PDF Document</span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Declaration & Submission */}
          <div className="card mb-6" style={{ padding: "24px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "20px" }}>
              <input
                id="certify-checkbox"
                type="checkbox"
                checked={certify}
                onChange={(e) => setCertify(e.target.checked)}
                style={{ marginTop: "4px", width: "18px", height: "18px" }}
                required
              />
              <label htmlFor="certify-checkbox" style={{ fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                <strong>Bidder Declaration:</strong> I hereby certify that the information provided and all attached documents are authentic, self-attested, and compliant with the requirements of GeM Tender <em>{tender?.title}</em>. I understand that legal name discrepancies across statutory records will be audited by the Procurement Evaluation Committee.
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "18px", flexWrap: "wrap", gap: "12px" }}>
              <Link href={`/bidder/tenders/${tenderId}`} className="btn btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !certify || Object.keys(uploadedFiles).length === 0}
                style={{
                  backgroundColor: "var(--color-saffron)",
                  color: "#0A2E4D",
                  fontWeight: 700,
                  fontSize: "14px",
                  padding: "10px 28px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {submitting ? (
                  <>
                    <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></div>
                    Submitting & Verifying...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Submit Bid Proposal ({Object.keys(uploadedFiles).length} Files Attached)
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
