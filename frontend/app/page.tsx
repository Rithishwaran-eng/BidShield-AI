"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "./components/Footer";

function AvailableIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function ComingSoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const PIPELINE_STAGES = [
  "Tender Ingestion / GeM Import",
  "Rule Extraction & Officer Approval",
  "Tender Published (OPEN)",
  "Bidder Proposal Submission",
  "Automated Document Verification",
  "Cross-Document Consistency Engine",
  "Human-in-the-Loop Officer Review",
  "Final Qualification Ruling & Audit",
];

const FEATURE_MODULES = [
  {
    num: 1,
    title: "Tender Intelligence & Import",
    desc: "Extracts eligibility criteria and mandatory document requirements from uploaded PDFs, raw text, or simulated GeM tender APIs.",
    status: "Available",
  },
  {
    num: 2,
    title: "Officer Rule Approval & Publishing",
    desc: "Officers review AI-extracted criteria, edit requirements, approve rules, and explicitly publish tenders to open public bidding.",
    status: "Available",
  },
  {
    num: 3,
    title: "Self-Service Bidder Portal",
    desc: "Vendors discover open tenders, review required document checklists, submit applications with attachments, and track submission progress.",
    status: "Available",
  },
  {
    num: 4,
    title: "Bidder Document Intelligence",
    desc: "Classifies bidder documents (PAN, GSTIN, Udyam, Financial Statements, OEM Authorization) and extracts key entity fields.",
    status: "Available",
  },
  {
    num: 5,
    title: "Cross-Document Consistency Engine",
    desc: "Detects mismatched names, registration numbers, addresses, and dates across a bidder's own paperwork.",
    status: "Available",
  },
  {
    num: 6,
    title: "Compliance Rules Engine",
    desc: "Runs deterministic pass/fail/missing/issue checks against approved tender eligibility rules.",
    status: "Available",
  },
  {
    num: 7,
    title: "Side-by-Side Evidence Review",
    desc: "Star-layout evidence comparison showing extracted values side-by-side with plain-language analysis and mismatch highlights.",
    status: "Available",
  },
  {
    num: 8,
    title: "Human-in-the-Loop Review Controls",
    desc: "Officer actions: Accept Finding, Reject Finding, Request Clarification, Mark Verified, or Override with mandatory note.",
    status: "Available",
  },
  {
    num: 9,
    title: "Officer Final Qualification Decision",
    desc: "Exclusive human authority to qualify or disqualify proposals with mandatory committee justification notes.",
    status: "Available",
  },
  {
    num: 10,
    title: "Immutable Audit Trail",
    desc: "Complete chronological log of all officer actions, overrides, rule approvals, and qualification decisions.",
    status: "Available",
  },
];

const INNOVATIONS = [
  {
    title: "The Golden Rule: Bidder Submits, BidShield Verifies, Officer Decides",
    desc: "AI extracts evidence and highlights discrepancies; only the designated Procurement Officer makes final qualification rulings.",
    status: "Available",
  },
  {
    title: "Tender-to-Rule Intelligence",
    desc: "Complex tender clauses become structured, executable rules instead of a manual checklist.",
    status: "Available",
  },
  {
    title: "Cross-Document Intelligence",
    desc: "Checks whether a bidder's own documents agree with each other, catching subtle entity name or PAN/GST discrepancies.",
    status: "Available",
  },
  {
    title: "Evidence-First AI",
    desc: "Every output is backed by source document, page, field, rule, and rationale; no opaque confidence scores.",
    status: "Available",
  },
  {
    title: "Clean Two-Actor Separation",
    desc: "Clean separation between public Bidders submitting bids and verified Procurement Officers managing tenders.",
    status: "Available",
  },
  {
    title: "Simulated GeM & Registry Adapters",
    desc: "Ready for live GeM and statutory API integrations with pluggable verification architecture.",
    status: "Coming Soon",
    note: "Simulated GeM import available today",
  },
];

export default function LandingPage() {
  const [fontSize, setFontSize] = useState<"small" | "normal" | "large">("normal");
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState<"EN" | "HI">("EN");

  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontSize);
    document.documentElement.setAttribute("data-high-contrast", String(highContrast));
  }, [fontSize, highContrast]);

  return (
    <div className="landing-page-wrapper">
      {/* 1. Accessibility Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* 2. Government Identity & Accessibility Bar */}
      <div className="gov-topbar">
        <div className="gov-topbar-inner">
          <div className="gov-lineage">
            <span className="gov-lineage-flag" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <span>
              {language === "EN" ? "भारत सरकार | Government of India" : "भारत सरकार | Government of India"}
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
            <span style={{ color: "#94a3b8" }}>
              {language === "EN" ? "Ministry of Commerce & Industry" : "वाणिज्य एवं उद्योग मंत्रालय"}
            </span>
          </div>

          <div className="gov-topbar-tools">
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Accessibility:</span>
            <button
              className={`gov-tool-btn ${fontSize === "small" ? "active" : ""}`}
              onClick={() => setFontSize("small")}
              title="Decrease text size"
              aria-label="Decrease text size"
            >
              A-
            </button>
            <button
              className={`gov-tool-btn ${fontSize === "normal" ? "active" : ""}`}
              onClick={() => setFontSize("normal")}
              title="Standard text size"
              aria-label="Standard text size"
            >
              A
            </button>
            <button
              className={`gov-tool-btn ${fontSize === "large" ? "active" : ""}`}
              onClick={() => setFontSize("large")}
              title="Increase text size"
              aria-label="Increase text size"
            >
              A+
            </button>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <button
              className={`gov-tool-btn ${highContrast ? "active" : ""}`}
              onClick={() => setHighContrast(!highContrast)}
              title="Toggle high contrast mode"
            >
              {highContrast ? "Standard Contrast" : "High Contrast"}
            </button>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <button
              className="gov-tool-btn"
              onClick={() => setLanguage(language === "EN" ? "HI" : "EN")}
              title="Toggle language"
            >
              {language === "EN" ? "हिन्दी" : "English"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. BidShield AI Header Bar */}
      <header className="header" style={{ position: "sticky", top: 0, zIndex: 100 }}>
        <div className="header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
              title="National Emblem of India"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF9933" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div>
              <Link href="/" className="header-brand" style={{ display: "block", lineHeight: "1.1" }}>
                BidShield AI
              </Link>
              <span style={{ fontSize: "11px", color: "#cbd5e1", letterSpacing: "0.3px" }}>
                AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement
              </span>
            </div>
          </div>

          <nav className="header-nav open" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Link href="/bidder" style={{ color: "#ffffff", textDecoration: "none", fontSize: "13.5px", fontWeight: 500 }}>
              Bidder Portal
            </Link>
            <Link href="/officer" style={{ color: "#ffffff", textDecoration: "none", fontSize: "13.5px", fontWeight: 500 }}>
              Officer Portal
            </Link>
            <Link
              href="/sign-in"
              className="btn btn-secondary btn-sm"
              style={{
                backgroundColor: "transparent",
                color: "#ffffff",
                borderColor: "rgba(255,255,255,0.4)",
              }}
            >
              Sign In
            </Link>
            <Link
              href="/bidder/tenders"
              className="btn btn-primary btn-sm"
              style={{
                backgroundColor: "var(--color-saffron)",
                color: "#0A2E4D",
                fontWeight: 700,
              }}
            >
              Explore Tenders &rarr;
            </Link>
          </nav>
        </div>
      </header>

      {/* 4. Tricolor Ribbon Strip */}
      <div className="tricolor-strip">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <main id="main-content">
        {/* 5. Hero Section */}
        <section className="landing-hero-simple">
          <div className="landing-hero-simple-inner">
            <span className="portal-section-kicker">GeM Public Procurement Platform</span>
            <h1>BidShield AI</h1>
            <p className="landing-tagline">
              The Bidder submits. BidShield verifies. The Officer decides.
            </p>
            <p className="landing-problem-desc">
              BidShield AI replaces slow, manual bid scrutiny with an automated evidence-driven verification engine. We extract eligibility criteria from tenders, verify submissions automatically across documents, highlight discrepancies with side-by-side evidence, and empower procurement officers with complete human-in-the-loop decision authority.
            </p>

            {/* Portal Action Buttons */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "24px" }}>
              <Link
                href="/bidder"
                className="btn btn-primary"
                style={{
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  backgroundColor: "var(--color-saffron)",
                  color: "#0A2E4D",
                }}
              >
                🏢 Bidder Portal — Discover & Apply &rarr;
              </Link>

              <Link
                href="/officer"
                className="btn btn-secondary"
                style={{
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "#FFFFFF",
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                🛡️ Officer Portal — Tender & Evaluation Command &rarr;
              </Link>
            </div>
          </div>
        </section>

        <div className="page-container" style={{ marginTop: "36px" }}>
          {/* Dual Actor Workflow Card Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "52px" }}>
            <div className="card" style={{ padding: "28px", borderTop: "4px solid var(--color-saffron)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span style={{ fontSize: "24px" }}>🏢</span>
                <div>
                  <span className="portal-section-kicker">For Bidders & Vendors</span>
                  <h3 style={{ fontSize: "18px", color: "var(--color-navy-900)", margin: 0 }}>
                    Self-Service Bid Submission
                  </h3>
                </div>
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
                Browse live tenders, review mandatory document checklists and financial thresholds, submit bids with required attachments, and track high-level progress.
              </p>
              <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--color-navy-900)", lineHeight: 1.8, marginBottom: "20px" }}>
                <li>Browse OPEN tender opportunities</li>
                <li>Clear document and eligibility checklist</li>
                <li>Instant submission confirmation and reference tracking</li>
                <li>Clean, private vendor status view</li>
              </ul>
              <Link href="/bidder/tenders" className="btn btn-secondary" style={{ width: "100%", textAlign: "center" }}>
                Browse Open Tenders &rarr;
              </Link>
            </div>

            <div className="card" style={{ padding: "28px", borderTop: "4px solid var(--color-navy-700)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span style={{ fontSize: "24px" }}>🛡️</span>
                <div>
                  <span className="portal-section-kicker">For Procurement Officers</span>
                  <h3 style={{ fontSize: "18px", color: "var(--color-navy-900)", margin: 0 }}>
                    Tender Command & Evaluation
                  </h3>
                </div>
              </div>
              <p style={{ fontSize: "13.5px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
                Create or import tenders (PDF, raw text, GeM sample), approve AI rules, explicitly publish tenders, inspect side-by-side evidence, and record official qualification rulings.
              </p>
              <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--color-navy-900)", lineHeight: 1.8, marginBottom: "20px" }}>
                <li>Import from GeM or upload tender PDFs</li>
                <li>Rule extraction, refinement, and explicit publish lifecycle</li>
                <li>Side-by-side mismatch comparison & AI analysis</li>
                <li>Human-in-the-loop actions and immutable audit trail</li>
              </ul>
              <Link href="/officer" className="btn btn-primary" style={{ width: "100%", textAlign: "center" }}>
                Enter Officer Command Center &rarr;
              </Link>
            </div>
          </div>

          {/* 6. Pipeline Diagram Section */}
          <section id="pipeline" style={{ marginBottom: "52px" }}>
            <div className="portal-section-header">
              <span className="portal-section-kicker">End-to-End Architecture</span>
              <h2 className="portal-section-title">The Verification Pipeline</h2>
              <p className="portal-section-desc">
                Sequential workflow from tender creation and bidder submission to evidence verification and officer qualification.
              </p>
            </div>

            <div className="pipeline-scroll-wrapper">
              <div className="pipeline-flow">
                {PIPELINE_STAGES.map((stage, idx) => (
                  <div key={stage} className="pipeline-step-wrapper">
                    <div className="pipeline-step-box">{stage}</div>
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <div className="pipeline-arrow" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 7. Features Grid Section */}
          <section id="features" style={{ marginBottom: "56px" }}>
            <div className="portal-section-header">
              <span className="portal-section-kicker">Platform Capabilities</span>
              <h2 className="portal-section-title">Core Feature Modules</h2>
              <p className="portal-section-desc">
                Complete functional suite powering BidShield AI compliance evaluation.
              </p>
            </div>

            <div className="grid-modules-4">
              {FEATURE_MODULES.map((mod) => {
                const isAvailable = mod.status === "Available";
                return (
                  <div key={mod.num} className={`spec-card ${isAvailable ? "available" : "dashed"}`}>
                    <div>
                      <div className="spec-card-title">
                        {mod.num}. {mod.title}
                      </div>
                      <p className="spec-card-desc">{mod.desc}</p>
                    </div>

                    <div>
                      {isAvailable ? (
                        <span className="spec-badge-available">
                          <AvailableIcon />
                          Available
                        </span>
                      ) : (
                        <span className="spec-badge-coming-soon">
                          <ComingSoonIcon />
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 8. Innovations Section */}
          <section id="innovations" style={{ marginBottom: "56px" }}>
            <div className="portal-section-header">
              <span className="portal-section-kicker">Technical Distinctions</span>
              <h2 className="portal-section-title">Core Innovations</h2>
              <p className="portal-section-desc">
                Foundational architectural principles distinguishing BidShield AI from legacy procurement software.
              </p>
            </div>

            <div className="grid-innovations-3">
              {INNOVATIONS.map((inn, idx) => {
                const isAvailable = inn.status === "Available";
                return (
                  <div key={idx} className={`spec-card ${isAvailable ? "available" : "dashed"}`}>
                    <div>
                      <div className="spec-card-title">{inn.title}</div>
                      <p className="spec-card-desc">{inn.desc}</p>
                      {inn.note && (
                        <p style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", marginTop: "6px" }}>
                          ({inn.note})
                        </p>
                      )}
                    </div>

                    <div>
                      {isAvailable ? (
                        <span className="spec-badge-available">
                          <AvailableIcon />
                          Available
                        </span>
                      ) : (
                        <span className="spec-badge-coming-soon">
                          <ComingSoonIcon />
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
