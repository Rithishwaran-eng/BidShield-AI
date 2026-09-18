"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PageHeader from "@/app/components/PageHeader";
import StatusBadge from "@/app/components/StatusBadge";
import { getTender, getRules, updateRules, extractRules, publishTender } from "@/app/lib/api";

interface Rule {
  id?: string;
  rule_id: string;
  requirement: string;
  mandatory: boolean;
  evidence_required: string[];
  threshold: string | null;
  approved?: boolean;
}

export default function OfficerRulesPage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;

  const [tender, setTender] = useState<any>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const [tData, rData] = await Promise.all([
        getTender(tenderId),
        getRules(tenderId),
      ]);
      setTender(tData);
      setRules(rData || []);
    } catch (err: any) {
      setError(err.message);
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
    setMessage("");
    try {
      await extractRules(tenderId);
      setMessage("Rules successfully extracted using Gemini AI!");
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to extract rules.");
    } finally {
      setExtracting(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateRules(tenderId, rules, true);
      setMessage("Eligibility rules successfully approved. You can now publish and open the tender for bidder submissions.");
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to approve rules.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError("");
    setMessage("");
    try {
      await publishTender(tenderId);
      setMessage("Tender published! It is now OPEN and accepting bids.");
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to publish tender.");
    } finally {
      setPublishing(false);
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
    setRules(rules.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const updateRuleField = (idx: number, field: string, val: any) => {
    const updated = [...rules];
    (updated[idx] as any)[field] = val;
    setRules(updated);
  };

  if (loading) {
    return (
      <div className="landing-page-wrapper">
        <Header />
        <div className="page-container" style={{ marginTop: "40px" }}>
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading tender rules...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const allRulesApproved = rules.length > 0 && (tender?.rules_approved || rules.every((r) => r.approved));
  const allApproved = allRulesApproved;
  const isOpen = tender?.status === "open" || tender?.status === "active";

  return (
    <div className="landing-page-wrapper">
      <Header />

      <main className="page-container" style={{ marginTop: "24px", minHeight: "calc(100vh - 280px)" }}>
        <PageHeader
          title="Eligibility Rules Configuration"
          breadcrumbs={[
            { label: "Officer Portal", href: "/officer" },
            { label: "Tenders", href: "/officer/tenders" },
            { label: tender?.title || "Tender", href: `/officer/tenders/${tenderId}` },
            { label: "Rules Setup" },
          ]}
          action={<StatusBadge status={tender?.status || "draft"} />}
        />

        {error && (
          <div className="card mb-4 form-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="card mb-4" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", padding: "12px 16px" }}>
            {message}
          </div>
        )}

        {/* Rule Extraction Card if empty */}
        {rules.length === 0 && (
          <div className="card mb-6" style={{ padding: "32px", textAlign: "center" }}>
            <h3 style={{ fontSize: "16px", color: "var(--color-navy-900)", marginBottom: "8px" }}>
              No Eligibility Rules Configured Yet
            </h3>
            <p className="text-secondary text-sm mb-4">
              Extract structured compliance rules automatically from the tender document text using Gemini AI.
            </p>
            <button
              className="btn btn-primary"
              onClick={handleExtract}
              disabled={extracting}
            >
              {extracting ? "Extracting Rules with Gemini..." : "⚡ Extract Rules with AI"}
            </button>
          </div>
        )}

        {/* Rules Table */}
        {rules.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--color-navy-900)", margin: 0 }}>
                  Structured Eligibility Rules ({rules.length})
                </h2>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "2px 0 0 0" }}>
                  Review, refine, and approve deterministic rules before opening the tender for bidding.
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addRule}
                >
                  + Add Custom Rule
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExtract}
                  disabled={extracting}
                >
                  {extracting ? "Re-extracting..." : "🔄 Re-extract with AI"}
                </button>
              </div>
            </div>

            <div className="table-wrapper mb-6" style={{ border: "1px solid var(--color-border)", borderRadius: "6px", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: "14%", padding: "12px 16px", background: "#F8FAFC", fontSize: "12px", borderBottom: "2px solid var(--color-border)" }}>Rule ID</th>
                    <th style={{ width: "36%", padding: "12px 16px", background: "#F8FAFC", fontSize: "12px", borderBottom: "2px solid var(--color-border)" }}>Requirement Description</th>
                    <th style={{ width: "12%", padding: "12px 16px", background: "#F8FAFC", fontSize: "12px", borderBottom: "2px solid var(--color-border)", textAlign: "center" }}>Mandatory</th>
                    <th style={{ width: "18%", padding: "12px 16px", background: "#F8FAFC", fontSize: "12px", borderBottom: "2px solid var(--color-border)" }}>Evidence Required</th>
                    <th style={{ width: "12%", padding: "12px 16px", background: "#F8FAFC", fontSize: "12px", borderBottom: "2px solid var(--color-border)" }}>Threshold</th>
                    <th style={{ width: "8%", padding: "12px 16px", background: "#F8FAFC", fontSize: "12px", borderBottom: "2px solid var(--color-border)", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, idx) => (
                    <tr key={rule.id || idx}>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7" }}>
                        <span className="mono" style={{ fontWeight: 700, fontSize: "12px", background: "#F1F5F9", padding: "4px 8px", borderRadius: "4px" }}>
                          {rule.rule_id}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7" }}>
                        {editingIdx === idx ? (
                          <input
                            type="text"
                            className="form-input"
                            value={rule.requirement}
                            onChange={(e) => updateRuleField(idx, "requirement", e.target.value)}
                          />
                        ) : (
                          <span style={{ fontSize: "13.5px" }}>{rule.requirement}</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle", textAlign: "center", borderBottom: "1px solid #EDF2F7" }}>
                        {editingIdx === idx ? (
                          <input
                            type="checkbox"
                            checked={rule.mandatory}
                            onChange={(e) => updateRuleField(idx, "mandatory", e.target.checked)}
                          />
                        ) : (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              backgroundColor: rule.mandatory ? "var(--color-status-verified-bg)" : "var(--color-status-pending-bg)",
                              color: rule.mandatory ? "var(--color-status-verified)" : "var(--color-text-secondary)",
                            }}
                          >
                            {rule.mandatory ? "YES" : "NO"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7" }}>
                        {editingIdx === idx ? (
                          <input
                            type="text"
                            className="form-input"
                            value={rule.evidence_required.join(", ")}
                            onChange={(e) =>
                              updateRuleField(
                                idx,
                                "evidence_required",
                                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                              )
                            }
                            placeholder="e.g. GST Certificate, PAN Card"
                          />
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {rule.evidence_required.map((ev: string, i: number) => (
                              <span key={i} style={{ fontSize: "11.5px", background: "#F1F5F9", padding: "2px 6px", borderRadius: "3px" }}>
                                {ev}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle", borderBottom: "1px solid #EDF2F7", fontSize: "12.5px" }}>
                        {editingIdx === idx ? (
                          <input
                            type="text"
                            className="form-input"
                            value={rule.threshold || ""}
                            onChange={(e) => updateRuleField(idx, "threshold", e.target.value || null)}
                          />
                        ) : (
                          rule.threshold || "--"
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle", textAlign: "right", borderBottom: "1px solid #EDF2F7" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {editingIdx === idx ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingIdx(null)}
                            >
                              Done
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingIdx(idx)}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            className="btn btn-destructive btn-sm"
                            onClick={() => deleteRule(idx)}
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Approval and Publish Action Bar */}
            <div className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", backgroundColor: "#F8FAFC" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-navy-900)" }}>
                  {allRulesApproved ? "✓ Rules Status: Approved" : "Rules Status: Pending Approval"}
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
                  {allRulesApproved
                    ? "Rules are approved. You can publish this tender to make it OPEN for bidders."
                    : "Approve rules to finalize criteria before opening the tender."}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleApprove}
                  disabled={saving || rules.length === 0}
                >
                  {saving ? "Approving..." : "✓ Approve Rules"}
                </button>

                {!isOpen && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePublish}
                    disabled={publishing || !allRulesApproved}
                    style={{
                      backgroundColor: "var(--color-saffron)",
                      color: "#0A2E4D",
                      fontWeight: 700,
                    }}
                  >
                    {publishing ? "Publishing..." : "🚀 Publish & Open for Bids"}
                  </button>
                )}

                {isOpen && (
                  <Link
                    href={`/officer/tenders/${tenderId}/bids`}
                    className="btn btn-primary"
                    style={{ backgroundColor: "var(--color-navy-900)" }}
                  >
                    View Submitted Bids &rarr;
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
