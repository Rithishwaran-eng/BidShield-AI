"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import StatusBadge from "@/app/components/StatusBadge";
import Footer from "@/app/components/Footer";
import { listTenders } from "@/app/lib/api";
import { useUserRole } from "@/app/lib/useUserRole";

export default function TendersListPage() {
  const { isAuditor, isAdmin, isSignedIn, name, roleLabel, role } = useUserRole();
  const { signOut } = useClerk();
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // Accessibility Controls
  const [fontSize, setFontSize] = useState<"small" | "normal" | "large">("normal");
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState<"EN" | "HI">("EN");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontSize);
    document.documentElement.setAttribute("data-high-contrast", String(highContrast));
  }, [fontSize, highContrast]);

  useEffect(() => {
    listTenders()
      .then(setTenders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredTenders = tenders.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="landing-page-wrapper">
      {/* 1. Accessibility Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* 2. Top Government Identity & Accessibility Bar */}
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF9933" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                From document-heavy bid evaluation to evidence-driven intelligent compliance verification
              </span>
            </div>
          </div>

          <nav className="header-nav open" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/tenders"
              style={{
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "13.5px",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.1)",
              }}
            >
              Live Tenders
            </Link>

            {isAdmin && (
              <Link
                href="/manage-users"
                style={{
                  color: "var(--color-saffron)",
                  textDecoration: "none",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  padding: "6px 12px",
                }}
              >
                Manage Users
              </Link>
            )}

            {!isAuditor && (
              <Link
                href="/tenders/new"
                className="btn btn-primary"
                style={{
                  backgroundColor: "var(--color-saffron)",
                  color: "#0A2E4D",
                  fontWeight: 700,
                  fontSize: "13px",
                  padding: "8px 16px",
                }}
              >
                + Create Tender
              </Link>
            )}

            {isSignedIn && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "6px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#FFFFFF" }}>{name}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                      color: role === "administrator" ? "var(--color-saffron)" : role === "auditor" ? "#cbd5e1" : "var(--color-status-verified)",
                    }}
                  >
                    {roleLabel}
                  </span>
                </div>
                <button
                  className="header-signout"
                  type="button"
                  onClick={() => signOut({ redirectUrl: "/" })}
                  title="Sign out"
                >
                  Sign out
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 4. 3px Tricolor Ribbon Strip */}
      <div className="tricolor-strip">
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* 5. Main Officer Content: Active Tenders & Bid Evaluations */}
      <main id="main-content" className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <div className="portal-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <span className="portal-section-kicker">GeM Procurement Dossier</span>
            <h1 className="portal-section-title" style={{ fontSize: "1.6rem", margin: "4px 0" }}>
              Active Tenders & Bid Evaluations
            </h1>
            <p className="portal-section-desc">
              Select a tender to inspect compliance findings, manage bidder submissions, or view the audit log.
            </p>
          </div>
          <Link href="/tenders/new" className="btn btn-primary" style={{ height: "fit-content" }}>
            + Create Tender
          </Link>
        </div>

        {/* Filter and search toolbar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search tender title or GeM Bid number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flexGrow: 1,
              minWidth: "260px",
              padding: "10px 14px",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
              fontSize: "14px",
              backgroundColor: "var(--color-surface)",
            }}
          />
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className={`btn ${statusFilter === "all" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter("all")}
            >
              All Tenders
            </button>
            <button
              className={`btn ${statusFilter === "active" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter("active")}
            >
              Active
            </button>
            <button
              className={`btn ${statusFilter === "draft" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter("draft")}
            >
              Draft
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading tenders...</span>
          </div>
        )}

        {error && (
          <div className="card" style={{ borderLeftColor: "var(--color-status-issue)", borderLeftWidth: "4px" }}>
            <p><strong>Failed to load tenders:</strong> {error}</p>
            <p className="text-secondary text-sm mt-2">
              Verify the backend API server is operational at {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}.
            </p>
          </div>
        )}

        {!loading && !error && filteredTenders.length === 0 && (
          <div className="empty-state">
            <h3>No tenders found</h3>
            <p>Create your first tender to begin bid compliance verification.</p>
            <Link href="/tenders/new" className="btn btn-primary mt-4">
              Create New Tender
            </Link>
          </div>
        )}

        {!loading && !error && filteredTenders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredTenders.map((tender) => (
              <div
                key={tender.id}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  padding: "20px 24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                  borderLeft: "4px solid var(--color-navy-700)",
                }}
              >
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "3px",
                        background: "#e0f2fe",
                        color: "#0369a1",
                        textTransform: "uppercase",
                      }}
                    >
                      GeM Bid
                    </span>
                    <StatusBadge status={tender.status} />
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                      Created: {new Date(tender.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-navy-900)", marginBottom: "6px" }}>
                    {tender.title}
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                    Procuring Entity: Ministry of Electronics and Information Technology (MeitY)
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Link href={`/tenders/${tender.id}/dashboard`} className="btn btn-primary" style={{ fontSize: "13px" }}>
                    Compliance Dashboard
                  </Link>
                  <Link href={`/tenders/${tender.id}/bidders`} className="btn btn-secondary" style={{ fontSize: "13px" }}>
                    View Bidders
                  </Link>
                  <Link href={`/tenders/${tender.id}`} className="btn btn-secondary" style={{ fontSize: "13px" }}>
                    Rules Setup
                  </Link>
                  <Link href={`/tenders/${tender.id}/audit`} className="btn btn-secondary" style={{ fontSize: "13px" }}>
                    Audit Log
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
