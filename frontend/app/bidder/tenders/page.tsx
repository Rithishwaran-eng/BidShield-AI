"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { listTenders } from "@/app/lib/api";
import { useUserRole } from "@/app/lib/useUserRole";

export default function BidderTendersListPage() {
  const { isOfficer } = useUserRole();
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    listTenders("open")
      .then(setTenders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenders.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.organization && t.organization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title="Procurement Opportunities"
          breadcrumbs={[
            { label: "Bidder Portal", href: "/bidder" },
            { label: "Open Tenders" },
          ]}
        />

        <div style={{ marginBottom: "20px", display: "flex", gap: "12px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search tenders by keyword, commodity, or procuring organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: "560px" }}
          />
        </div>

        {error && (
          <div className="card form-error mb-4" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading open tenders...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card empty-state" style={{ textAlign: "center", padding: "40px" }}>
            <h3>No matching open tenders found</h3>
            <p className="text-secondary text-sm">
              Try adjusting your search terms or check back later.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((t) => (
              <div
                key={t.id}
                className="card"
                style={{
                  borderLeft: "4px solid var(--color-navy-700)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                  padding: "20px 24px",
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
                    <StatusBadge status="open" label="Accepting Bids" />
                    {t.deadline && (
                      <span style={{ fontSize: "12px", color: "var(--color-status-issue)" }}>
                        Deadline: {new Date(t.deadline).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: "16.5px", fontWeight: 700, color: "var(--color-navy-900)", margin: "4px 0" }}>
                    {t.title}
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                    {t.organization || "Ministry of Commerce & Industry"}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <Link
                    href={`/bidder/tenders/${t.id}`}
                    className="btn btn-secondary"
                    style={{ fontSize: "13px" }}
                  >
                    View Requirements
                  </Link>
                  {!isOfficer ? (
                    <Link
                      href={`/bidder/tenders/${t.id}/apply`}
                      className="btn btn-primary"
                      style={{
                        fontSize: "13px",
                        backgroundColor: "var(--color-saffron)",
                        color: "#0A2E4D",
                        fontWeight: 700,
                      }}
                    >
                      Apply / Submit Bid &rarr;
                    </Link>
                  ) : (
                    <Link
                      href={`/officer/tenders/${t.id}`}
                      className="btn btn-primary"
                      style={{
                        fontSize: "13px",
                        backgroundColor: "var(--color-navy-900)",
                        color: "#FFFFFF",
                        fontWeight: 700,
                      }}
                    >
                      Officer Dossier &rarr;
                    </Link>
                  )}
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
