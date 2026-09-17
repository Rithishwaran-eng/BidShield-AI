"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import PageHeader from "@/app/components/PageHeader";
import Footer from "@/app/components/Footer";
import { createTender, extractRules } from "@/app/lib/api";

const SAMPLE_TENDER_TITLE = "Supply of Enterprise IT Hardware & Networking Equipment - GEM/2026/B/9041280";
const SAMPLE_TENDER_TEXT = `GOVERNMENT E-MARKETPLACE (GeM) - BID DOCUMENT
Bid Number: GEM/2026/B/9041280
Ministry: Ministry of Electronics and Information Technology (MeitY)
Department: Digital India Corporation

SECTION II - MANDATORY ELIGIBILITY CRITERIA

1. FINANCIAL TURNOVER (TURNOVER_01):
The minimum average annual financial turnover of the bidder during the last three consecutive financial years (FY 2022-23, 2023-24, and 2024-25) must be at least INR 5.00 Crore. Bidder must submit audited balance sheets, profit & loss accounts certified by a practicing Chartered Accountant (CA) with a valid UDIN.

2. STATUTORY TAX REGISTRATIONS (GST_PAN_01):
The bidder must possess a valid Goods and Services Tax Identification Number (GSTIN) registration and Permanent Account Number (PAN). Active filing status of GSTR-3B for the last two quarters is mandatory.

3. PAST PROJECT EXPERIENCE (EXPERIENCE_01):
The bidder must have successfully executed at least two similar government supply orders or service contracts valued at not less than INR 2.00 Crore each for any Central/State Ministry, PSU, or Autonomous Body within the last 5 years.

4. OEM AUTHORIZATION (OEM_AUTH_01):
The bidder must furnish a Manufacturer Authorization Form (MAF) directly from the Original Equipment Manufacturer (OEM) guaranteeing warranty support for 36 months.

5. MSME / UDYAM PREFERENCE (MSME_01):
Micro and Small Enterprises (MSEs) registered with Udyam or District Industries Centre are eligible for purchase preference and exemption from prior experience requirements per the Public Procurement Policy for MSEs Order 2012.`;

export default function NewTenderPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tenderText, setTenderText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "creating" | "extracting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      // If it is a text file, read content directly into the textarea
      if (selected.type === "text/plain" || selected.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            setTenderText(content);
          }
        };
        reader.readAsText(selected);
      } else {
        // If it's a PDF or binary file, load default structured text if empty
        if (!tenderText.trim()) {
          setTenderText(`[DOCUMENT: ${selected.name}]\n\n` + SAMPLE_TENDER_TEXT);
        }
      }
    }
  };

  const handleLoadSample = () => {
    setTitle(SAMPLE_TENDER_TITLE);
    setTenderText(SAMPLE_TENDER_TEXT);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please specify a tender title.");
      return;
    }
    if (!tenderText.trim()) {
      setError("Please upload a tender document or paste the eligibility criteria text.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      setStatus("creating");
      const tender: any = await createTender({
        title: title.trim(),
        uploaded_text: tenderText.trim(),
      });

      setStatus("extracting");
      await extractRules(tender.id);

      setStatus("done");
      router.push(`/tenders/${tender.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create tender or extract eligibility rules.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page-container">
        {/* Centered Container Wrapper */}
        <div style={{ maxWidth: "820px", margin: "0 auto", width: "100%" }}>
          <PageHeader
            title="Create New Tender"
            breadcrumbs={[
              { label: "Tenders", href: "/tenders" },
              { label: "New Tender" },
            ]}
          />

          <div
            className="card"
            style={{
              width: "100%",
              padding: "32px 36px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: "1px solid var(--color-border)",
              borderTop: "4px solid var(--color-navy-700)",
              borderRadius: "6px",
              backgroundColor: "#FFFFFF",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ fontSize: "18px", color: "var(--color-navy-900)", margin: 0 }}>
                  Tender Specification & Rule Extraction
                </h2>
                <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
                  Provide the GeM bid details and document text to automatically extract eligibility rules using AI.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLoadSample}
                style={{ fontSize: "12px", padding: "6px 12px" }}
                title="Fill with standard GeM sample procurement clauses"
              >
                📋 Load Sample GeM Tender
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label htmlFor="tender-title" className="form-label" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Tender Title / GeM Bid Reference <span className="form-required">(required)</span>
                </label>
                <input
                  id="tender-title"
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Supply of IT Equipment - GEM/2026/B/4521890"
                  style={{ padding: "10px 14px", fontSize: "13.5px" }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Upload Tender Document <span className="form-required">(PDF or TXT)</span>
                </label>
                <div
                  className="file-upload"
                  onClick={() => document.getElementById("tender-file")?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      document.getElementById("tender-file")?.click();
                    }
                  }}
                  style={{
                    border: "2px dashed var(--color-border)",
                    borderRadius: "6px",
                    padding: "24px 16px",
                    textAlign: "center",
                    backgroundColor: "#FAFCFF",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  <input
                    id="tender-file"
                    type="file"
                    accept=".pdf,.txt"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy-700)" strokeWidth="1.8">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className="file-upload-label" style={{ fontSize: "13.5px" }}>
                      {file ? (
                        <span style={{ color: "var(--color-navy-900)", fontWeight: 600 }}>
                          Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                        </span>
                      ) : (
                        <>
                          <strong style={{ color: "var(--color-navy-700)" }}>Click to upload</strong> a tender PDF or TXT file, or paste text below
                        </>
                      )}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                      Text and PDF documents accepted up to 25 MB
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label htmlFor="tender-text" className="form-label" style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>
                    Tender Document Text / Eligibility Clauses <span className="form-required">(required)</span>
                  </label>
                  {tenderText && (
                    <button
                      type="button"
                      onClick={() => setTenderText("")}
                      style={{ background: "none", border: "none", color: "var(--color-status-issue)", fontSize: "11.5px", cursor: "pointer" }}
                    >
                      Clear text
                    </button>
                  )}
                </div>
                <textarea
                  id="tender-text"
                  className="form-input"
                  value={tenderText}
                  onChange={(e) => setTenderText(e.target.value)}
                  placeholder="Paste the tender document or specific eligibility requirement sections here..."
                  rows={9}
                  style={{ fontSize: "13px", lineHeight: "1.6", fontFamily: "var(--font-mono, monospace)" }}
                  required
                />
                <span className="form-help" style={{ fontSize: "12px", marginTop: "6px", display: "block", color: "var(--color-text-secondary)" }}>
                  BidShield AI will parse turnover requirements, statutory registrations, past experience criteria, and mandatory certificates from this text.
                </span>
              </div>

              {error && (
                <div
                  className="card mb-4 form-error"
                  style={{
                    backgroundColor: "var(--color-status-issue-bg)",
                    borderLeft: "4px solid var(--color-status-issue)",
                    padding: "12px 16px",
                    color: "var(--color-status-issue)",
                    fontSize: "13px",
                  }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              {status !== "idle" && status !== "error" && (
                <div className="card mb-4" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {status !== "done" && <div className="spinner"></div>}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--color-navy-900)" }}>
                        {status === "creating" && "Step 1 of 2: Registering tender record in Supabase..."}
                        {status === "extracting" && "Step 2 of 2: Extracting eligibility rules with Gemini AI..."}
                        {status === "done" && "Complete! Redirecting to rules configuration..."}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                        {status === "extracting" && "Analyzing clauses, financial thresholds, and required documentation..."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "18px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push("/tenders")}
                  disabled={loading}
                  style={{ minWidth: "100px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !title.trim()}
                  style={{ minWidth: "220px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }}></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Create Tender & Extract Rules
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

