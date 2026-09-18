"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");

  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      // Self-registrations are strictly 'bidder' role
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: email.trim(),
        password,
        unsafeMetadata: {
          requestedRole: "bidder",
          companyName: companyName.trim(),
        },
      });

      // Send verification code to email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Failed to sign up";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push("/bidder");
      } else {
        setError(`Sign up status: ${completeSignUp.status}. Verification not complete.`);
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Invalid verification code";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--color-bg)" }}>
      {/* Topbar */}
      <div className="gov-topbar">
        <div className="gov-topbar-inner">
          <div className="gov-lineage">
            <span className="gov-lineage-flag" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <span>भारत सरकार | Government of India</span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
            <span style={{ color: "#94a3b8" }}>Ministry of Commerce & Industry</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="header">
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
              <span style={{ fontSize: "11px", color: "#cbd5e1" }}>
                National Public Procurement Bidder Registration
              </span>
            </div>
          </div>
          <Link
            href="/sign-in"
            className="btn btn-secondary btn-sm"
            style={{
              backgroundColor: "transparent",
              color: "#ffffff",
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Tricolor Ribbon */}
      <div className="tricolor-strip">
        <span></span><span></span><span></span>
      </div>

      {/* Main Container */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: "480px", marginBottom: "18px", textAlign: "center" }}>
          <span className="portal-section-kicker">Bidder & Vendor Onboarding</span>
          <h1 style={{ fontFamily: "var(--font-merriweather), Georgia, serif", fontSize: "1.6rem", color: "var(--color-navy-900)", margin: "4px 0 8px 0" }}>
            Register Bidder Account
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
            Create an authorized vendor account to discover open tenders and submit compliance documentation.
          </p>
        </div>

        <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "28px" }}>
          {error && (
            <div className="form-error mb-4" role="alert">
              {error}
            </div>
          )}

          {!pendingVerification ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="company-name" className="form-label">
                  Company / Organization Name <span className="form-required">*</span>
                </label>
                <input
                  id="company-name"
                  type="text"
                  className="form-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="e.g. Reliable Systems Private Limited"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label htmlFor="first-name" className="form-label">
                    Authorized Rep First Name <span className="form-required">*</span>
                  </label>
                  <input
                    id="first-name"
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last-name" className="form-label">
                    Last Name <span className="form-required">*</span>
                  </label>
                  <input
                    id="last-name"
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="e.g. Sharma"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Official Business Email <span className="form-required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="bids@company.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password <span className="form-required">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div style={{ padding: "10px 12px", background: "var(--color-status-pending-bg)", border: "1px solid var(--color-border)", borderRadius: "4px", marginBottom: "16px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                <strong>Role Notice:</strong> Self-registration creates a verified <strong>Bidder</strong> profile. Procurement Officer credentials for evaluating authorities are provisioned separately through designated government channels.
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? "Registering..." : "Create Bidder Account"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-navy-900)", marginBottom: "4px" }}>
                  Verify Business Email
                </div>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                  A 6-digit confirmation code has been dispatched to <strong>{email}</strong>.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="code" className="form-label">
                  Verification Code <span className="form-required">*</span>
                </label>
                <input
                  id="code"
                  type="text"
                  className="form-input text-center"
                  style={{ letterSpacing: "4px", fontSize: "18px", fontWeight: 700 }}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="123456"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full mt-4"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Confirm & Open Bidder Portal"}
              </button>
            </form>
          )}

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
            Already registered?{" "}
            <Link href="/sign-in" style={{ color: "var(--color-navy-700)", fontWeight: 600, textDecoration: "underline" }}>
              Sign in here &rarr;
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
