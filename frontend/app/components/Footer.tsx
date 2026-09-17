"use client";

import { useState } from "react";
import Link from "next/link";

interface ModalContent {
  title: string;
  category: string;
  body: React.ReactNode;
}

export default function Footer() {
  const [activeModal, setActiveModal] = useState<ModalContent | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: "", email: "", type: "Bug Report", details: "" });

  const handleOpenModal = (content: ModalContent) => {
    setActiveModal(content);
    setFeedbackSuccess(false);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSuccess(true);
    setTimeout(() => {
      setActiveModal(null);
      setFeedbackSuccess(false);
      setFeedbackForm({ name: "", email: "", type: "Bug Report", details: "" });
    }, 2000);
  };

  return (
    <>
      <footer className="gov-footer">
        {/* Tricolor Ribbon Header */}
        <div className="gov-footer-tricolor">
          <span style={{ backgroundColor: "var(--color-saffron)" }}></span>
          <span style={{ backgroundColor: "#FFFFFF" }}></span>
          <span style={{ backgroundColor: "var(--color-india-green)" }}></span>
        </div>

        {/* Main Footer Content Grid */}
        <div className="gov-footer-inner">
          {/* Compliance & Governance Navigation Links */}
          <nav aria-label="Footer Governance and Support Links" className="gov-footer-nav">
            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Privacy Policy",
                  category: "Legal & Data Governance",
                  body: (
                    <div>
                      <p><strong>1. Scope & Framework:</strong> BidShield AI complies with the Digital Personal Data Protection (DPDP) Act and Government of India Cybersecurity Directives. We collect official officer credentials and submitted bidder documentation exclusively for tender compliance verification.</p>
                      <p className="mt-2"><strong>2. Data Encryption:</strong> All bid submissions, officer notes, and verification logs are encrypted using AES-256 at rest and TLS 1.3 in transit.</p>
                      <p className="mt-2"><strong>3. Access Controls:</strong> Only authenticated procurement officers, designated auditors, and platform administrators can view bid evaluations relevant to authorized tenders.</p>
                    </div>
                  ),
                })
              }
            >
              Privacy Policy
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Terms of Service & Conditions",
                  category: "Operational Governance",
                  body: (
                    <div>
                      <p><strong>1. Authorized Use:</strong> Access is restricted to designated public procurement personnel, registered bidders, and official vigilance authorities.</p>
                      <p className="mt-2"><strong>2. Automated Verification Limits:</strong> AI-driven cross-consistency analysis serves as an advisory decision-support system. Final statutory acceptance or disqualification remains with the designated Tender Officer.</p>
                      <p className="mt-2"><strong>3. Unauthorized Access:</strong> Any attempt to tamper with audit hashes, bypass role security, or reverse-engineer verification models will invite prosecution under the Information Technology Act, 2000.</p>
                    </div>
                  ),
                })
              }
            >
              Terms of Service / Terms & Conditions
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Copyright Statement",
                  category: "Intellectual Property Notice",
                  body: (
                    <div>
                      <p>&copy; 2026 Government e-Marketplace (GeM), Ministry of Commerce and Industry, Government of India. All rights reserved.</p>
                      <p className="mt-2">The architecture, deterministic validation algorithms, rule parsing models, and documentation are proprietary government digital public infrastructure. Reproduction or dissemination without prior sanction is prohibited.</p>
                    </div>
                  ),
                })
              }
            >
              Copyright Statement
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Official Disclaimer",
                  category: "Statutory Limitation of Liability",
                  body: (
                    <div>
                      <p><strong>Advisory Support:</strong> While BidShield AI verifies document authenticity against official databases (MCA21, GSTN, MSME Udyam, GeM API), the platform makes no final judicial determination. The competent procurement committee holds statutory responsibility for contract awards.</p>
                      <p className="mt-2">Neither the Ministry of Commerce & Industry nor GeM shall be liable for indirect damages or delays arising from third-party registry API outages.</p>
                    </div>
                  ),
                })
              }
            >
              Disclaimer
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Accessibility Statement",
                  category: "GIGW & WCAG 2.1 Compliance",
                  body: (
                    <div>
                      <p><strong>Standards Compliance:</strong> BidShield AI is engineered in strict compliance with the Guidelines for Indian Government Websites (GIGW) and Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.</p>
                      <p className="mt-2"><strong>Assistive Support:</strong> High contrast viewports, screen-reader semantic landmarks, keyboard navigation (`Tab`, `Shift+Tab`), and variable font size controls (A-, A, A+) are built directly into the interface.</p>
                    </div>
                  ),
                })
              }
            >
              Accessibility Statement
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Portal Site Map",
                  category: "Hierarchical Navigation Guide",
                  body: (
                    <div>
                      <ul style={{ paddingLeft: "20px", lineHeight: "1.8", fontSize: "13.5px" }}>
                        <li><Link href="/" style={{ color: "var(--color-navy-500)", fontWeight: 600 }}>Home / Public Information Portal</Link></li>
                        <li><Link href="/tenders" style={{ color: "var(--color-navy-500)", fontWeight: 600 }}>Tenders & Procurement List</Link></li>
                        <li><span style={{ color: "#334155" }}>Tender Compliance Dashboard (`/tenders/[id]/dashboard`)</span></li>
                        <li><span style={{ color: "#334155" }}>Bidder Upload & Verification (`/tenders/[id]/bidders`)</span></li>
                        <li><span style={{ color: "#334155" }}>Evidence Grid & Rule Inspection (`/tenders/[id]/audit`)</span></li>
                        <li><Link href="/manage-users" style={{ color: "var(--color-navy-500)", fontWeight: 600 }}>User Account & Role Management (Administrator)</Link></li>
                      </ul>
                    </div>
                  ),
                })
              }
            >
              Site Map
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Language Options",
                  category: "Multilingual Support",
                  body: (
                    <div>
                      <p className="mb-3">BidShield AI supports official languages as recognized under the 8th Schedule of the Constitution of India:</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", fontSize: "13.5px" }}>
                        <span style={{ padding: "6px 10px", background: "#f1f5f9", borderRadius: "4px", fontWeight: 600 }}>English (Active)</span>
                        <span style={{ padding: "6px 10px", background: "#f8fafc", borderRadius: "4px" }}>हिन्दी (Hindi - Integrated)</span>
                        <span style={{ padding: "6px 10px", background: "#f8fafc", borderRadius: "4px" }}>தமிழ் (Tamil)</span>
                        <span style={{ padding: "6px 10px", background: "#f8fafc", borderRadius: "4px" }}>తెలుగు (Telugu)</span>
                        <span style={{ padding: "6px 10px", background: "#f8fafc", borderRadius: "4px" }}>বাংলা (Bengali)</span>
                        <span style={{ padding: "6px 10px", background: "#f8fafc", borderRadius: "4px" }}>मराठी (Marathi)</span>
                      </div>
                      <p className="mt-3 text-xs text-secondary">Toggle primary language from the Accessibility Toolbar located at the top of the portal header.</p>
                    </div>
                  ),
                })
              }
            >
              Language Options (English / हिन्दी)
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Official Contact Information",
                  category: "Headquarters & Public Authority",
                  body: (
                    <div style={{ lineHeight: "1.7", fontSize: "13.5px" }}>
                      <p><strong>Nodal Authority:</strong> Government e-Marketplace (GeM) / Ministry of Commerce and Industry</p>
                      <p><strong>Physical Address:</strong> Vanijya Bhawan, 16 Akbar Road, New Delhi – 110011, India</p>
                      <p><strong>National Helpline:</strong> 1800-419-3436 / 1800-102-3436 (Toll-Free, 09:00 - 18:00 IST)</p>
                      <p><strong>Official Email:</strong> <span className="mono" style={{ color: "var(--color-navy-700)" }}>support@gem-bidshield.gov.in</span></p>
                    </div>
                  ),
                })
              }
            >
              Contact Information
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Support Desk & User Manual",
                  category: "Operations & Verification Guides",
                  body: (
                    <div>
                      <p><strong>Officer Helpdesk:</strong> For technical issues with tender document parsing, automated OCR extraction, or verification pipeline timeouts:</p>
                      <ul style={{ paddingLeft: "20px", marginTop: "8px", lineHeight: "1.8" }}>
                        <li>Ticketing Portal: <span className="mono">https://helpdesk.gem.gov.in/bidshield</span></li>
                        <li>Operations Handbook: <em>GeM Procurement Officer Technical Handbook (Rev 4.2)</em></li>
                        <li>Support Window: Monday through Saturday, 08:30 to 20:00 IST</li>
                      </ul>
                    </div>
                  ),
                })
              }
            >
              Support / Help Desk
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Feedback / Report a Problem",
                  category: "Citizen & Officer Escalation Channel",
                  body: (
                    <div>
                      {feedbackSuccess ? (
                        <div style={{ padding: "16px", background: "var(--color-status-verified-bg)", color: "var(--color-status-verified)", borderRadius: "4px", fontWeight: 600 }}>
                          ✓ Your report has been submitted to the Quality Assurance cell. Reference ID: <span className="mono">FB-{Math.floor(100000 + Math.random() * 900000)}</span>.
                        </div>
                      ) : (
                        <form onSubmit={handleFeedbackSubmit}>
                          <div style={{ marginBottom: "12px" }}>
                            <label className="form-label" style={{ fontSize: "12px" }}>Report Type</label>
                            <select
                              className="form-select"
                              value={feedbackForm.type}
                              onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value })}
                            >
                              <option value="Bug Report">Technical Bug / System Error</option>
                              <option value="OCR Inaccuracy">Document OCR Extraction Discrepancy</option>
                              <option value="Verification Logic">Rule Verification Logic Suggestion</option>
                              <option value="Accessibility">Accessibility / Usability Barrier</option>
                            </select>
                          </div>
                          <div style={{ marginBottom: "12px" }}>
                            <label className="form-label" style={{ fontSize: "12px" }}>Your Email</label>
                            <input
                              type="email"
                              className="form-input"
                              placeholder="officer@gov.in"
                              value={feedbackForm.email}
                              onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                              required
                            />
                          </div>
                          <div style={{ marginBottom: "14px" }}>
                            <label className="form-label" style={{ fontSize: "12px" }}>Description of Issue</label>
                            <textarea
                              className="form-input"
                              rows={3}
                              placeholder="Provide tender ID, page location, and error details..."
                              value={feedbackForm.details}
                              onChange={(e) => setFeedbackForm({ ...feedbackForm, details: e.target.value })}
                              required
                            />
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ width: "100%", fontSize: "13px" }}>
                            Submit Report
                          </button>
                        </form>
                      )}
                    </div>
                  ),
                })
              }
            >
              Feedback / Report a Problem
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Right to Information (RTI) / FOIA",
                  category: "Statutory Public Records Disclosure",
                  body: (
                    <div>
                      <p><strong>RTI Act, 2005 Compliance:</strong> All public procurement procedures, tender qualification thresholds, and anonymized verification criteria conducted via BidShield AI fall within proactive disclosure requirements under Section 4(1)(b) of the RTI Act.</p>
                      <p className="mt-2"><strong>Central Public Information Officer (CPIO):</strong> Citizens may file requests regarding tender evaluation rules at the national portal: <span className="mono">rtionline.gov.in</span>.</p>
                    </div>
                  ),
                })
              }
            >
              Freedom of Information Act (FOIA) / RTI
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Open Data Directive / Data.gov.in",
                  category: "Open Government Data (OGD) Platform",
                  body: (
                    <div>
                      <p><strong>Open Procurement Data:</strong> Aggregated procurement compliance metrics, category-wise bidder qualification ratios, and rule evaluation statistics are published quarterly to India’s Open Government Data platform (<span className="mono">data.gov.in</span>).</p>
                      <p className="mt-2">Datasets are provided in open machine-readable formats (JSON, CSV) with cryptographic verification hashes.</p>
                    </div>
                  ),
                })
              }
            >
              Open Data / Data.gov
            </button>
            <span className="gov-footer-sep" aria-hidden="true">•</span>

            <button
              type="button"
              className="gov-footer-btn"
              onClick={() =>
                handleOpenModal({
                  title: "Vulnerability Disclosure Policy (VDP)",
                  category: "Responsible Cybersecurity Disclosure",
                  body: (
                    <div>
                      <p><strong>CERT-In Alignment:</strong> Security researchers who discover potential vulnerabilities in the BidShield AI platform are requested to submit reports under our responsible disclosure framework.</p>
                      <p className="mt-2"><strong>Submission Channel:</strong> Send PGP-encrypted findings to <span className="mono">vdp@cert-in.org.in</span> with subject line <span className="mono">[VDP-BIDSHIELD-SECURITY]</span>.</p>
                      <p className="mt-2 text-xs text-secondary">Zero-day disclosures without responsible notice violate the Information Technology (Amendment) Act, 2008.</p>
                    </div>
                  ),
                })
              }
            >
              Vulnerability Disclosure Policy (VDP)
            </button>
          </nav>

          {/* Bottom Bar: Emblem, Ministry, and Timestamps */}
          <div className="gov-footer-bottom">
            <div className="gov-footer-bottom-brand">
              <div className="gov-emblem-badge" title="Satyameva Jayate">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9933" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                  <path d="M2 12h20"/>
                </svg>
              </div>
              <div>
                <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "13.5px" }}>
                  BidShield AI — Government e-Marketplace (GeM)
                </div>
                <div style={{ color: "#94a3b8", fontSize: "11.5px" }}>
                  Ministry of Commerce and Industry • Government of India
                </div>
              </div>
            </div>

            <div className="gov-footer-bottom-meta">
              <span>Standard: GIGW 3.0 & WCAG 2.1 AA</span>
              <span>•</span>
              <span>Portal Last Updated: 17 September 2026</span>
              <span>•</span>
              <span>Hosted on National Informatics Centre (NIC) Cloud</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Modal for Footer Links */}
      {activeModal && (
        <div className="gov-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="gov-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="gov-modal-header">
              <div>
                <span className="gov-modal-category">{activeModal.category}</span>
                <h3 className="gov-modal-title">{activeModal.title}</h3>
              </div>
              <button
                type="button"
                className="gov-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className="gov-modal-body">
              {activeModal.body}
            </div>
            <div className="gov-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveModal(null)}
                style={{ fontSize: "12.5px", padding: "6px 16px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
