"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import { createTender, extractRules, uploadTenderPdf } from "@/app/lib/api";

export default function OfficerNewTenderPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tenderText, setTenderText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError("");

    if (selected.name.endsWith(".txt")) {
      const text = await selected.text();
      setTenderText(text);
      if (!title) setTitle(selected.name.replace(".txt", ""));
      return;
    }

    setUploadingPdf(true);
    try {
      const res = await uploadTenderPdf(selected);
      if (res.text) {
        setTenderText(res.text);
        if (!title) {
          setTitle(`Procurement Tender - ${selected.name.replace(".pdf", "")}`);
        }
      }
    } catch (err: any) {
      setError(`PDF extraction warning: ${err.message}. You can also paste text directly.`);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !tenderText.trim()) {
      setError("Please provide tender title and document text.");
      return;
    }

    setLoading(true);
    setError("");
    setStatusMessage("Step 1 of 2: Creating tender dossier in database...");

    try {
      const tender = await createTender({
        title: title.trim(),
        organization: organization.trim() || "Ministry of Commerce & Industry",
        category: category.trim() || "Goods & Equipment",
        deadline: deadline || undefined,
        uploaded_text: tenderText.trim(),
      });

      setStatusMessage("Step 2 of 2: Extracting eligibility rules with Gemini AI...");
      await extractRules(tender.id);

      setStatusMessage("Complete! Opening rules review...");
      router.push(`/officer/tenders/${tender.id}/rules`);
    } catch (err: any) {
      setError(err.message || "Failed to create tender or extract eligibility rules.");
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", width: "100%" }}>
          <PageHeader
            title="Create or Import Tender"
            breadcrumbs={[
              { label: "Officer Portal", href: "/officer" },
              { label: "Tenders", href: "/officer/tenders" },
              { label: "New Tender" },
            ]}
          />

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

          {/* Tender Creation Form */}
          <div className="card" style={{ padding: "32px", borderTop: "4px solid var(--color-navy-700)" }}>
            <h2 style={{ fontSize: "17px", color: "var(--color-navy-900)", marginBottom: "18px" }}>
              Tender Specification & Requirements Ingestion
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="tender-title" className="form-label">
                    Tender Title / GeM Bid Reference <span className="form-required">*</span>
                  </label>
                  <input
                    id="tender-title"
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. CPCL Mechanical Procurement - GeM Bid No. GEM/2026/B/8912400"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="org" className="form-label">
                    Procuring Entity / Ministry
                  </label>
                  <input
                    id="org"
                    type="text"
                    className="form-input"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Chennai Petroleum Corporation Limited (CPCL)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cat" className="form-label">
                    Procurement Category
                  </label>
                  <input
                    id="cat"
                    type="text"
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Industrial Mechanical Equipment"
                  />
                </div>
              </div>

              {/* PDF Document Upload */}
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label">
                  Upload Tender Document PDF <span className="text-secondary text-sm">(auto-extracts text via pdfplumber)</span>
                </label>
                <div
                  style={{
                    border: "2px dashed var(--color-border)",
                    borderRadius: "6px",
                    padding: "20px",
                    textAlign: "center",
                    backgroundColor: "#F8FAFC",
                    cursor: "pointer",
                  }}
                  onClick={() => document.getElementById("pdf-input")?.click()}
                >
                  <input
                    id="pdf-input"
                    type="file"
                    accept=".pdf,.txt"
                    style={{ display: "none" }}
                    onChange={handlePdfUpload}
                  />
                  {uploadingPdf ? (
                    <div className="loading-state">
                      <div className="spinner"></div>
                      <span>Extracting text from PDF document...</span>
                    </div>
                  ) : file ? (
                    <div style={{ color: "var(--color-status-verified)", fontWeight: 600, fontSize: "13.5px" }}>
                      Loaded: {file.name} ({Math.round(file.size / 1024)} KB) — Text extracted below
                    </div>
                  ) : (
                    <div style={{ fontSize: "13px", color: "var(--color-navy-700)" }}>
                      <strong>Click to upload</strong> Tender PDF / TXT document, or paste text below
                    </div>
                  )}
                </div>
              </div>

              {/* Tender Document Text */}
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label htmlFor="tender-text" className="form-label" style={{ margin: 0 }}>
                    Tender Clauses & Eligibility Requirements Text <span className="form-required">*</span>
                  </label>
                  {tenderText && (
                    <button
                      type="button"
                      onClick={() => setTenderText("")}
                      style={{ background: "none", border: "none", color: "var(--color-status-issue)", fontSize: "12px", cursor: "pointer" }}
                    >
                      Clear text
                    </button>
                  )}
                </div>
                <textarea
                  id="tender-text"
                  className="form-input mono"
                  rows={9}
                  value={tenderText}
                  onChange={(e) => setTenderText(e.target.value)}
                  placeholder="Paste tender document text or eligibility requirement clauses here..."
                  style={{ fontSize: "12.5px", lineHeight: 1.5 }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "18px" }}>
                <Link href="/officer/tenders" className="btn btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || uploadingPdf || !title.trim() || !tenderText.trim()}
                  style={{
                    backgroundColor: "var(--color-saffron)",
                    color: "#0A2E4D",
                    fontWeight: 700,
                    fontSize: "14px",
                    padding: "10px 24px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></div>
                      Processing Ingestion...
                    </>
                  ) : (
                    <>
                      <span>+</span> Create Tender & Extract Rules
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
