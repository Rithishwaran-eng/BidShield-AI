import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--color-bg)" }}>
      {/* Government Topbar */}
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
                National Public Procurement Integrity Platform
              </span>
            </div>
          </div>
          <Link href="/" className="btn btn-secondary btn-sm" style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.3)" }}>
            &larr; Back to Portal
          </Link>
        </div>
      </header>

      {/* Tricolor Ribbon */}
      <div className="tricolor-strip">
        <span></span><span></span><span></span>
      </div>

      {/* Main Sign-In Card Container */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: "440px", marginBottom: "18px", textAlign: "center" }}>
          <span className="portal-section-kicker">GeM Procurement Gateway</span>
          <h1 style={{ fontFamily: "var(--font-merriweather), Georgia, serif", fontSize: "1.6rem", color: "var(--color-navy-900)", margin: "4px 0 8px 0" }}>
            Officer Sign In
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
            Enter your authorized procurement credentials to access BidShield AI.
          </p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: {
                width: "100%",
                maxWidth: "440px",
              },
              card: {
                backgroundColor: "#FFFFFF",
                borderRadius: "4px",
                border: "1px solid var(--color-border)",
                boxShadow: "none",
                padding: "28px",
              },
              headerTitle: {
                display: "none",
              },
              headerSubtitle: {
                display: "none",
              },
              formButtonPrimary: {
                backgroundColor: "var(--color-navy-900)",
                color: "#FFFFFF",
                borderRadius: "4px",
                fontWeight: 600,
                fontSize: "13.5px",
                padding: "10px 16px",
                "&:hover": {
                  backgroundColor: "var(--color-navy-700)",
                },
              },
              formFieldInput: {
                borderRadius: "4px",
                borderColor: "var(--color-border)",
                fontSize: "13.5px",
                padding: "8px 12px",
                "&:focus": {
                  borderColor: "var(--color-navy-500)",
                  boxShadow: "0 0 0 1px var(--color-navy-500)",
                },
              },
              formFieldLabel: {
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--color-navy-900)",
              },
              footerActionLink: {
                color: "var(--color-navy-700)",
                fontWeight: 600,
                "&:hover": {
                  color: "var(--color-navy-900)",
                },
              },
              identityPreviewEditButtonIcon: {
                color: "var(--color-navy-700)",
              },
            },
            variables: {
              colorPrimary: "#0A2E4D",
              borderRadius: "4px",
              fontFamily: "var(--font-inter), sans-serif",
            },

          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/tenders"
        />

        <div style={{ marginTop: "24px", fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
          New evaluation officer?{" "}
          <Link href="/sign-up" style={{ color: "var(--color-navy-700)", fontWeight: 600, textDecoration: "underline" }}>
            Request account & select role &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
