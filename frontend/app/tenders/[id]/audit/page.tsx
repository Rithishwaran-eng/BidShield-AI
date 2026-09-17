"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import { getAuditLog } from "@/app/lib/api";

export default function AuditLogPage() {
  const params = useParams();
  const tenderId = params.id as string;

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAuditLog(tenderId)
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenderId]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <span>Loading audit log...</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Audit Log"
        breadcrumbs={[
          { label: "Tenders", href: "/tenders" },
          { label: "Tender", href: `/tenders/${tenderId}` },
          { label: "Audit Log" },
        ]}
      />

      {error && (
        <div className="form-error mb-4" role="alert">{error}</div>
      )}

      {entries.length === 0 ? (
        <div className="empty-state">
          <h3>No audit entries yet</h3>
          <p>Audit entries are created when officers take actions on findings.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="data-table-desktop">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Officer</th>
                  <th>Action</th>
                  <th>Rule / Check</th>
                  <th>Bidder</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="text-sm" style={{ whiteSpace: "nowrap" }}>
                      {new Date(entry.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <div>{entry.officer_name}</div>
                      {entry.officer_clerk_id && (
                        <div className="mono text-secondary" style={{ fontSize: "11px" }}>
                          {entry.officer_clerk_id}
                        </div>
                      )}
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      {(entry.action || "").replace(/_/g, " ")}
                    </td>
                    <td className="text-sm">
                      <span className="mono">{entry.rule_code}</span>
                      {entry.rule_requirement && (
                        <span className="text-secondary"> -- {entry.rule_requirement}</span>
                      )}
                    </td>
                    <td>{entry.bidder_name || "--"}</td>
                    <td className="text-secondary text-sm">
                      {entry.note || "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="stacked-cards-mobile">
            {entries.map((entry) => (
              <div className="stacked-card" key={entry.id}>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Timestamp</span>
                  <span className="stacked-card-value text-sm">
                    {new Date(entry.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Officer</span>
                  <span className="stacked-card-value">
                    <div>{entry.officer_name}</div>
                    {entry.officer_clerk_id && (
                      <div className="mono text-secondary" style={{ fontSize: "11px" }}>
                        {entry.officer_clerk_id}
                      </div>
                    )}
                  </span>
                </div>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Action</span>
                  <span className="stacked-card-value" style={{ textTransform: "capitalize" }}>
                    {(entry.action || "").replace(/_/g, " ")}
                  </span>
                </div>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Rule</span>
                  <span className="stacked-card-value text-sm">
                    {entry.rule_requirement || entry.rule_code || "--"}
                  </span>
                </div>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Bidder</span>
                  <span className="stacked-card-value">{entry.bidder_name || "--"}</span>
                </div>
                {entry.note && (
                  <div className="stacked-card-row">
                    <span className="stacked-card-label">Note</span>
                    <span className="stacked-card-value text-secondary">{entry.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
