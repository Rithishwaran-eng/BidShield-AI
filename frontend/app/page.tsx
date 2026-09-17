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
  "Tender AI",
  "Rule Generation",
  "Document AI",
  "Cross-Document Verification",
  "External Verification",
  "Evidence + Compliance Engine",
  "Human Review",
  "Audit Report",
];

const FEATURE_MODULES = [
  {
    num: 1,
    title: "Tender Intelligence",
    desc: "Extracts eligibility criteria and mandatory-document requirements from an uploaded tender document.",
    status: "Available",
  },
  {
    num: 2,
    title: "Bidder Document Intelligence",
    desc: "Classifies bidder documents (PAN, GST, Udyam, financials, OEM authorization, declarations) and extracts their fields.",
    status: "Available",
  },
  {
    num: 3,
    title: "Cross-Document Consistency Engine",
    desc: "Detects mismatched names, registration numbers, addresses, and dates across a bidder's own documents.",
    status: "Available",
  },
  {
    num: 4,
    title: "Compliance Rules Engine",
    desc: "Runs deterministic pass/fail/review/missing checks against the extracted tender requirements.",
    status: "Available",
  },
  {
    num: 5,
    title: "External Verification Layer",
    desc: "Connects to government registries (GSTN, Udyam, PAN/IT, MCA, DPIIT, NSIC, EPFO, ESIC, DigiLocker) and blacklist/debarment sources to independently confirm bidder data.",
    status: "Coming Soon",
  },
  {
    num: 6,
    title: "Evidence Engine",
    desc: "Links every finding back to its source: requirement, rule, document, page, extracted field, and reason.",
    status: "Available",
  },
  {
    num: 7,
    title: "Compliance & Risk Dashboard",
    desc: "Shows verified/missing/issue/pending counts per bidder — never a single opaque score.",
    status: "Available",
  },
  {
    num: 8,
    title: "AI Recommendation Engine",
    desc: "Gives a plain-language recommendation on each finding; the AI recommends, the officer decides.",
    status: "Available",
  },
  {
    num: 9,
    title: "Human-in-the-Loop Review",
    desc: "Officer actions: accept, reject, request clarification, mark verified, or override with a required note.",
    status: "Available",
  },
  {
    num: 10,
    title: "Audit Trail",
    desc: "Records who did what, which rule or document was involved, and any override reason, into a compliance report.",
    status: "Available",
  },
];

const INNOVATIONS = [
  {
    title: "Tender-to-Rule Intelligence",
    desc: "Tender clauses become structured, executable rules instead of a manual checklist.",
    status: "Available",
  },
  {
    title: "Cross-Document Intelligence",
    desc: "Checks whether a bidder's own documents agree with each other, not just whether each one reads correctly on its own.",
    status: "Available",
  },
  {
    title: "Evidence-First AI",
    desc: "Every output is backed by source document, page, field, rule, and reason; nothing is a black box.",
    status: "Available",
  },
  {
    title: "Unified Verification Adapter Layer",
    desc: "One compliance engine with pluggable adapters, so real government APIs can be added later without changing the core platform.",
    status: "Coming Soon",
    note: "Adapters are simulated today",
  },
  {
    title: "Human-Centric AI",
    desc: "The AI finds, explains, and provides evidence; the procurement officer always makes the final call.",
    status: "Available",
  },
  {
    title: "Compliance as an Evidence Graph",
    desc: "Requirement → rule → evidence → verification → finding → officer decision, modeled as a traceable graph rather than a flat checklist.",
    status: "Coming Soon",
    note: "Long-term direction",
  },
];

const ROADMAP_PHASES = [
  {
    phase: "Phase 1: Document + Tender Intelligence",
    desc: "Automated tender rule generation, document classification, deterministic cross-document consistency checks, and officer audit logging.",
    status: "Available",
    stageLabel: "Current Stage",
  },
  {
    phase: "Phase 2: API-based Verification",
    desc: "Direct integration with external statutory registries (GSTN, PAN, MCA-21, Udyam, DigiLocker) replacing simulated adapter endpoints.",
    status: "Coming Soon",
    stageLabel: "Planned",
  },
  {
    phase: "Phase 3: Enterprise / CPSE Deployment",
    desc: "Multi-tenant deployment across central public sector enterprises with centralized rule knowledge base and reusable templates.",
    status: "Coming Soon",
    stageLabel: "Planned",
  },
  {
    phase: "Phase 4: Multi-department Compliance Platform",
    desc: "Cross-department procurement compliance network with role-based access control, cross-tender analytics, and high-volume asynchronous batch verification.",
    status: "Coming Soon",
    stageLabel: "Planned",
  },
];

const COMING_SOON_ADDITIONAL = [
  "OEM direct authorization verification",
  "Central blacklist and debarment database screening",
  "Make-in-India local-content declaration validation",
  "Multi-CPSE enterprise deployment configuration",
  "Central procurement rule knowledge base",
  "Reusable tender rule templates library",
  "Cross-tender historical compliance analytics",
  "Role-based access control (RBAC) for evaluation committees",
  "Asynchronous high-volume document batch processing",
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
                PS 26100 — AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement
              </span>
            </div>
          </div>

          <nav className="header-nav open" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <a href="#features" style={{ color: "#ffffff", textDecoration: "none", fontSize: "13.5px", fontWeight: 500 }}>
              Features
            </a>
            <a href="#innovations" style={{ color: "#ffffff", textDecoration: "none", fontSize: "13.5px", fontWeight: 500 }}>
              Innovations
            </a>
            <a href="#roadmap" style={{ color: "#ffffff", textDecoration: "none", fontSize: "13.5px", fontWeight: 500 }}>
              Roadmap
            </a>
            <Link
              href="/tenders"
              className="btn btn-primary"
              style={{
                backgroundColor: "var(--color-saffron)",
                color: "#0A2E4D",
                fontWeight: 700,
                fontSize: "13px",
                padding: "8px 18px",
              }}
            >
              Open Platform &rarr;
            </Link>
          </nav>
        </div>
      </header>

      {/* 4. 3px Tricolor Ribbon Strip */}
      <div className="tricolor-strip">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <main id="main-content">
        {/* 5. Hero Section (Clean, Honest, No Marketing Invented Stats) */}
        <section className="landing-hero-simple">
          <div className="landing-hero-simple-inner">
            <span className="portal-section-kicker">GeM Public Procurement Platform</span>
            <h1>BidShield AI</h1>
            <p className="landing-tagline">
              From document-heavy bid evaluation to evidence-driven intelligent compliance verification.
            </p>
            <p className="landing-problem-desc">
              Fragmented portals, document-heavy manual verification, tender-specific rules that have to be checked by hand, and cross-document inconsistencies between a bidder&apos;s own paperwork together make bid evaluation slow and error-prone. BidShield AI provides an integrated pipeline from tender intelligence and cross-document verification to deterministic compliance checks, human review, and immutable audit reports.
            </p>
            <div>
              <Link href="/tenders" className="btn btn-primary" style={{ padding: "10px 24px", fontSize: "14px", fontWeight: 600 }}>
                Open Platform &rarr;
              </Link>
            </div>
          </div>
        </section>

        <div className="page-container" style={{ marginTop: "36px" }}>
          {/* 6. Pipeline Diagram Section */}
          <section id="pipeline" style={{ marginBottom: "52px" }}>
            <div className="portal-section-header">
              <span className="portal-section-kicker">End-to-End Architecture</span>
              <h2 className="portal-section-title">The Verification Pipeline</h2>
              <p className="portal-section-desc">
                The sequential workflow from tender document ingestion to the finalized compliance audit report.
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
              <h2 className="portal-section-title">Feature Modules</h2>
              <p className="portal-section-desc">
                Current availability of the ten core functional modules comprising the BidShield AI platform.
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
                Six foundational design innovations that differentiate BidShield AI from traditional manual checklists.
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

          {/* 9. Roadmap Section */}
          <section id="roadmap" style={{ marginBottom: "56px" }}>
            <div className="portal-section-header">
              <span className="portal-section-kicker">Deployment Plan</span>
              <h2 className="portal-section-title">Platform Roadmap</h2>
              <p className="portal-section-desc">
                Phased implementation trajectory from tender and document intelligence to multi-CPSE compliance infrastructure.
              </p>
            </div>

            <div className="roadmap-timeline">
              {ROADMAP_PHASES.map((item, idx) => {
                const isCurrent = item.status === "Available";
                return (
                  <div
                    key={idx}
                    className={`roadmap-phase-card ${isCurrent ? "current" : "future"}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-navy-900)" }}>
                        {item.phase}
                      </h3>
                      {isCurrent ? (
                        <span className="spec-badge-available">
                          <AvailableIcon />
                          {item.stageLabel}
                        </span>
                      ) : (
                        <span className="spec-badge-coming-soon">
                          <ComingSoonIcon />
                          {item.stageLabel}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5, margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Additional Coming-Soon Items List */}
            <div className="card mt-6" style={{ borderStyle: "dashed", borderColor: "#94a3b8", backgroundColor: "#fafafa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <ComingSoonIcon />
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-navy-900)", margin: 0 }}>
                  Additional Planned Features & Capabilities
                </h3>
              </div>
              <ul className="roadmap-future-bullets">
                {COMING_SOON_ADDITIONAL.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
