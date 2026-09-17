"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getTender, getRules, updateRules, extractRules } from "@/app/lib/api";
import { useUserRole } from "@/app/lib/useUserRole";

interface Rule {
  id?: string;
  rule_id: string;
  requirement: string;
  mandatory: boolean;
  evidence_required: string[];
  threshold: string | null;
  approved?: boolean;
}

export default function TenderDetailPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const { isAuditor } = useUserRole();

  const [tender, setTender] = useState<any>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [t, r] = await Promise.all([
        getTender(tenderId),
        getRules(tenderId),
      ]);
      setTender(t);
      setRules(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenderId]);

  const handleExtract = async () => {
    setExtracting(true);
    setError("");
    try {
      await extractRules(tenderId);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    setError("");
    try {
      await updateRules(tenderId, rules, true);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    const newRule: Rule = {
      rule_id: `RULE_${String(rules.length + 1).padStart(2, "0")}`,
      requirement: "",
      mandatory: true,
      evidence_required: [],
      threshold: null,
      approved: false,
    };
    setRules([...rules, newRule]);
    setEditingIdx(rules.length);
  };

  const deleteRule = (idx: number) => {
    const updated = rules.filter((_, i) => i !== idx);
    setRules(updated);
    if (editingIdx === idx) setEditingIdx(null);
  };

  const updateRule = (idx: number, field: string, value: any) => {
    const updated = [...rules];
    (updated[idx] as any)[field] = value;
    setRules(updated);
  };

  const allApproved = rules.length > 0 && rules.every((r) => r.approved);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <span>Loading tender details...</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={tender?.title || "Tender Details"}
        breadcrumbs={[
          { label: "Tenders", href: "/tenders" },
          { label: tender?.title || "Tender" },
        ]}
        action={<StatusBadge status={tender?.status || "draft"} />}
      />

      {error && (
        <div className="form-error mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Rule extraction controls (Procurement Officer / Admin only) */}
      {tender?.status === "draft" && !isAuditor && (
        <div className="card mb-4">
          <h3>Extract Eligibility Rules</h3>
          <p className="text-secondary mt-2 mb-4">
            The system will analyze the tender document and extract eligibility
            requirements using AI. You can then review, edit, and approve the rules.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleExtract}
            disabled={extracting}
          >
            {extracting ? "Extracting..." : "Extract Rules from Tender"}
          </button>
          {extracting && (
            <div className="loading-state mt-4">
              <div className="spinner"></div>
              <span>Analyzing tender document with AI...</span>
            </div>
          )}
        </div>
      )}

      {/* Auditor Notice */}
      {isAuditor && (
        <div className="card mb-4" style={{ backgroundColor: "var(--color-bg)", borderLeft: "4px solid var(--color-navy-700)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
            <strong>Auditor Mode:</strong> You have read-only inspection privileges for this tender. Rule configuration, approval, and document modifications are restricted.
          </p>
        </div>
      )}

      {/* Rules table */}
      {rules.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2>Eligibility Rules ({rules.length})</h2>
            {!allApproved && !isAuditor && (
              <button className="btn btn-secondary btn-sm" onClick={addRule}>
                + Add Rule
              </button>
            )}
          </div>

          {/* Desktop table */}
          <div className="table-wrapper" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)", border: "1px solid var(--color-border)", borderRadius: "6px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: "16%", minWidth: "150px", padding: "14px 18px", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: "#F8FAFC", borderBottom: "2px solid var(--color-border)", color: "var(--color-navy-900)" }}>Rule ID</th>
                  <th style={{ width: "36%", minWidth: "280px", padding: "14px 18px", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: "#F8FAFC", borderBottom: "2px solid var(--color-border)", color: "var(--color-navy-900)" }}>Requirement</th>
                  <th style={{ width: "12%", minWidth: "110px", padding: "14px 18px", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: "#F8FAFC", borderBottom: "2px solid var(--color-border)", color: "var(--color-navy-900)", textAlign: "center" }}>Mandatory</th>
                  <th style={{ width: "18%", minWidth: "180px", padding: "14px 18px", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: "#F8FAFC", borderBottom: "2px solid var(--color-border)", color: "var(--color-navy-900)" }}>Evidence Required</th>
                  <th style={{ width: "10%", minWidth: "130px", padding: "14px 18px", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: "#F8FAFC", borderBottom: "2px solid var(--color-border)", color: "var(--color-navy-900)" }}>Threshold</th>
                  {!allApproved && !isAuditor && (
                    <th style={{ width: "8%", minWidth: "140px", padding: "14px 18px", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: "#F8FAFC", borderBottom: "2px solid var(--color-border)", color: "var(--color-navy-900)", textAlign: "right" }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, idx) => (
                  <tr key={rule.id || idx}>
                    <td style={{ padding: "16px 18px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7" }}>
                      <span className="mono" style={{ fontWeight: 700, color: "var(--color-navy-900)", fontSize: "12px", background: "#F1F5F9", padding: "4px 8px", borderRadius: "4px", display: "inline-block", letterSpacing: "0.02em" }}>
                        {rule.rule_id}
                      </span>
                    </td>
                    <td style={{ padding: "16px 18px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7" }}>
                      {editingIdx === idx ? (
                        <input
                          type="text"
                          className="form-input"
                          value={rule.requirement}
                          onChange={(e) => updateRule(idx, "requirement", e.target.value)}
                        />
                      ) : (
                        <span style={{ fontSize: "13.5px", color: "var(--color-text-primary)", lineHeight: 1.55, display: "block" }}>
                          {rule.requirement}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px 18px", verticalAlign: "middle", textAlign: "center", borderBottom: "1px solid #EDF2F7" }}>
                      {editingIdx === idx ? (
                        <input
                          type="checkbox"
                          checked={rule.mandatory}
                          onChange={(e) => updateRule(idx, "mandatory", e.target.checked)}
                        />
                      ) : (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            backgroundColor: rule.mandatory ? "var(--color-status-verified-bg)" : "var(--color-status-pending-bg)",
                            color: rule.mandatory ? "var(--color-status-verified)" : "var(--color-text-secondary)",
                            border: rule.mandatory ? "1px solid rgba(27, 122, 67, 0.25)" : "1px solid var(--color-border)",
                          }}
                        >
                          {rule.mandatory ? "YES" : "NO"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px 18px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7" }}>
                      {editingIdx === idx ? (
                        <input
                          type="text"
                          className="form-input"
                          value={rule.evidence_required.join(", ")}
                          onChange={(e) =>
                            updateRule(
                              idx,
                              "evidence_required",
                              e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          placeholder="e.g. GST Certificate, PAN Card"
                        />
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {rule.evidence_required.length > 0 ? (
                            rule.evidence_required.map((ev: string, i: number) => (
                              <span key={i} style={{ fontSize: "12px", background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "3px 8px", borderRadius: "3px", color: "#334155", display: "inline-block" }}>
                                {ev}
                              </span>
                            ))
                          ) : (
                            <span className="text-secondary text-sm">--</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px 18px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7" }}>
                      {editingIdx === idx ? (
                        <input
                          type="text"
                          className="form-input"
                          value={rule.threshold || ""}
                          onChange={(e) => updateRule(idx, "threshold", e.target.value || null)}
                        />
                      ) : (
                        <span style={{ color: rule.threshold ? "var(--color-navy-900)" : "var(--color-text-secondary)", fontWeight: rule.threshold ? 600 : 400, fontSize: "12.5px" }}>
                          {rule.threshold || "--"}
                        </span>
                      )}
                    </td>
                    {!allApproved && !isAuditor && (
                      <td style={{ padding: "16px 18px", verticalAlign: "middle", textAlign: "right", borderBottom: "1px solid #EDF2F7" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {editingIdx === idx ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingIdx(null)}
                              style={{ padding: "4px 10px", fontSize: "12px" }}
                            >
                              Done
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingIdx(idx)}
                              style={{ padding: "4px 10px", fontSize: "12px" }}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            className="btn btn-destructive btn-sm"
                            onClick={() => deleteRule(idx)}
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="stacked-cards-mobile">
            {rules.map((rule, idx) => (
              <div className="stacked-card" key={rule.id || idx}>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Rule ID</span>
                  <span className="stacked-card-value mono">{rule.rule_id}</span>
                </div>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Requirement</span>
                  <span className="stacked-card-value">{rule.requirement}</span>
                </div>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Mandatory</span>
                  <span className="stacked-card-value">{rule.mandatory ? "Yes" : "No"}</span>
                </div>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Evidence</span>
                  <span className="stacked-card-value text-sm">
                    {rule.evidence_required.join(", ")}
                  </span>
                </div>
                <div className="stacked-card-row">
                  <span className="stacked-card-label">Threshold</span>
                  <span className="stacked-card-value text-secondary">
                    {rule.threshold || "--"}
                  </span>
                </div>
                {!allApproved && !isAuditor && (
                  <div className="flex gap-2 mt-2">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-destructive btn-sm"
                      onClick={() => deleteRule(idx)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {!allApproved && !isAuditor && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "20px" }}>
              <button
                className="btn btn-primary"
                onClick={handleApprove}
                disabled={saving || rules.length === 0}
                style={{ padding: "10px 22px", fontSize: "13.5px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {saving ? "Saving Approval..." : "Approve Rules"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={addRule}
                disabled={saving}
                style={{ padding: "10px 18px", fontSize: "13.5px" }}
              >
                + Add Rule
              </button>
            </div>
          )}

          {allApproved && (
            <div className="card mt-4" style={{ backgroundColor: "var(--color-status-verified-bg)", borderLeftColor: "var(--color-status-verified)", borderLeftWidth: "3px" }}>
              <p>
                <strong>Rules approved.</strong> You can now add bidders and upload their documents for compliance verification.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}
