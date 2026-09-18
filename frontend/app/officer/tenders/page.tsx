"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { listTenders } from "@/app/lib/api";

export default function OfficerTendersListPage() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    listTenders()
      .then(setTenders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenders.filter((t) => {
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.organization && t.organization.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title="Procurement Tenders"
          breadcrumbs={[
            { label: "Officer Portal", href: "/officer" },
            { label: "All Tenders" },
          ]}
          action={
            <Link
              href="/officer/tenders/new"
              className="btn btn-primary"
              style={{
                backgroundColor: "var(--color-saffron)",
                color: "#0A2E4D",
                fontWeight: 700,
                fontSize: "13.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>+</span> Create / Import Tender
            </Link>
          }
        />

        {error && (
          <div className="card mb-4 form-error" role="alert">
            {error}
          </div>
        )}

        {/* Search & Status Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search tender title, GeM bid reference, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flexGrow: 1, minWidth: "260px" }}
          />

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              className={`btn btn-sm ${statusFilter === "all" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
            <button
              className={`btn btn-sm ${statusFilter === "open" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter("open")}
            >
              Open / Accepting Bids
            </button>
            <button
              className={`btn btn-sm ${statusFilter === "draft" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter("draft")}
            >
              Draft
            </button>
            <button
              className={`btn btn-sm ${statusFilter === "rules_approved" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter("rules_approved")}
            >
              Rules Approved
            </button>
            <button
              className={`btn btn-sm ${statusFilter === "under_evaluation" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter("under_evaluation")}
            >
              Under Evaluation
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading procurement dossiers...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card empty-state" style={{ padding: "40px", textAlign: "center" }}>
            <h3>No matching tenders found</h3>
            <p className="text-secondary text-sm">
              Adjust your filters or create a new tender dossier.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {filtered.map((t) => (
              <div
                key={t.id}
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                  borderLeft: "4px solid var(--color-navy-700)",
                  padding: "18px 24px",
                }}
              >
                <div style={{ flex: 1, minWidth: "280px" }}>
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
                      {t.category || "GeM Bid"}
                    </span>
                    <StatusBadge status={t.status} />
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                      Created: {new Date(t.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-navy-900)", margin: "2px 0 4px 0" }}>
                    {t.title}
                  </h3>
                  <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", margin: 0 }}>
                    Procuring Entity: <strong>{t.organization || "Ministry of Commerce & Industry"}</strong>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Link
                    href={`/officer/tenders/${t.id}/bids`}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: "13px" }}
                  >
                    Submitted Bids &rarr;
                  </Link>
                  <Link
                    href={`/officer/tenders/${t.id}/rules`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "13px" }}
                  >
                    Rules
                  </Link>
                  <Link
                    href={`/officer/tenders/${t.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "13px" }}
                  >
                    Overview
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
