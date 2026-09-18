"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import { getGlobalAuditLog } from "@/app/lib/api";

export default function OfficerAuditTrailPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const data = await getGlobalAuditLog();
      setEntries(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const filtered = entries.filter((e) => {
    const matchesSearch =
      !search ||
      (e.officer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.bidder_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.rule_requirement || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.rule_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.note || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.action || "").toLowerCase().includes(search.toLowerCase());

    const matchesAction =
      actionFilter === "all" ||
      (e.action || "").toLowerCase() === actionFilter.toLowerCase();

    return matchesSearch && matchesAction;
  });

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title="Procurement Audit Trail"
          breadcrumbs={[
            { label: "Officer Portal", href: "/officer" },
            { label: "System Audit Trail" },
          ]}
          action={
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchAudit}
              disabled={loading}
            >
              Refresh Audit Log
            </button>
          }
        />

        {error && (
          <div className="card mb-4 form-error" role="alert">
            {error}
          </div>
        )}

        <div className="card mb-6" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span className="portal-section-kicker">Accountability & Compliance</span>
              <h2 style={{ fontSize: "17px", color: "var(--color-navy-900)", margin: "2px 0 0 0" }}>
                Immutable Procurement Decision Trail
              </h2>
              <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                Complete verifiable record of all officer interventions, overrides, re-evaluations, and final qualification rulings.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                className="form-input"
                style={{ width: "240px", fontSize: "13px" }}
                placeholder="Search officer, vendor, check..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="form-input"
                style={{ width: "160px", fontSize: "13px" }}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">All Actions</option>
                <option value="accept">Accept</option>
                <option value="reject">Reject</option>
                <option value="override">Override</option>
                <option value="request_clarification">Clarification</option>
                <option value="mark_verified">Mark Verified</option>
                <option value="reopen">Reopen</option>
                <option value="final_qualification">Final Decision</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Loading audit trail entries...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No audit entries found</h3>
              <p>Audit records are automatically recorded when officers review findings or record decisions.</p>
            </div>
          ) : (
            <div className="data-table-desktop">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "18%" }}>Timestamp</th>
                    <th style={{ width: "16%" }}>Procurement Officer</th>
                    <th style={{ width: "14%" }}>Action Taken</th>
                    <th style={{ width: "18%" }}>Vendor Evaluated</th>
                    <th style={{ width: "18%" }}>Rule / Compliance Check</th>
                    <th style={{ width: "16%" }}>Justification Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry.id}>
                      <td className="text-sm mono" style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {new Date(entry.created_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--color-navy-900)", fontSize: "13px" }}>
                          {entry.officer_name || "Procurement Officer"}
                        </div>
                        {entry.officer_clerk_id && (
                          <div className="mono" style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                            {entry.officer_clerk_id}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            backgroundColor:
                              entry.action === "override"
                                ? "#FEF3C7"
                                : entry.action === "accept" || entry.action === "mark_verified"
                                ? "#DCFCE7"
                                : entry.action === "reject"
                                ? "#FEE2E2"
                                : "#F1F5F9",
                            color:
                              entry.action === "override"
                                ? "#92400E"
                                : entry.action === "accept" || entry.action === "mark_verified"
                                ? "#166534"
                                : entry.action === "reject"
                                ? "#991B1B"
                                : "var(--color-navy-900)",
                          }}
                        >
                          {(entry.action || "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--color-navy-900)", fontSize: "13px" }}>
                        {entry.bidder_name || "--"}
                      </td>
                      <td className="text-sm">
                        <span className="mono" style={{ fontWeight: 700, fontSize: "11px", background: "#F1F5F9", padding: "2px 5px", borderRadius: "3px" }}>
                          {entry.rule_code || "CROSS_DOC"}
                        </span>
                        {entry.rule_requirement && (
                          <div style={{ fontSize: "12px", color: "var(--color-navy-900)", marginTop: "2px" }}>
                            {entry.rule_requirement}
                          </div>
                        )}
                      </td>
                      <td className="text-secondary text-sm" style={{ fontSize: "12px" }}>
                        {entry.note || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
