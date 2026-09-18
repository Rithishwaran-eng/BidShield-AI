"use client";

import { useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useUserRole } from "../lib/useUserRole";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const { isSignedIn, name, roleLabel, isOfficer, isBidder, role, hasOfficerPrivilege } = useUserRole();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
              title="National Emblem of India"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9933" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <Link href="/" className="header-brand">
              BidShield AI
            </Link>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>

          <nav className={`header-nav${menuOpen ? " open" : ""}`}>
            {/* Bidder Navigation Links */}
            {isBidder && (
              <>
                <Link
                  href="/bidder/tenders"
                  style={{ color: "#ffffff", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}
                >
                  Browse Tenders
                </Link>
                <Link
                  href="/bidder/submissions"
                  style={{ color: "#ffffff", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}
                >
                  My Submissions
                </Link>
                {hasOfficerPrivilege && (
                  <Link
                    href="/officer"
                    style={{
                      color: "var(--color-saffron)",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "1px solid rgba(255,153,51,0.5)",
                      padding: "3px 10px",
                      borderRadius: "4px",
                      marginLeft: "6px",
                    }}
                  >
                    Officer Portal &rarr;
                  </Link>
                )}
              </>
            )}

            {/* Officer Navigation Links */}
            {isOfficer && (
              <>
                <Link
                  href="/officer"
                  style={{ color: "#ffffff", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/officer/tenders"
                  style={{ color: "#ffffff", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}
                >
                  Tenders
                </Link>
                <Link
                  href="/officer/audit"
                  style={{ color: "#ffffff", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}
                >
                  Audit Trail
                </Link>
                <Link
                  href="/bidder"
                  style={{
                    color: "#93c5fd",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "1px solid rgba(147,197,253,0.4)",
                    padding: "3px 10px",
                    borderRadius: "4px",
                    marginLeft: "6px",
                  }}
                >
                  Bidder Portal &rarr;
                </Link>
              </>
            )}

            {/* Signed Out Navigation */}
            {!isSignedIn && (
              <Link
                href="/bidder/tenders"
                style={{ color: "#ffffff", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}
              >
                Procurement Opportunities
              </Link>
            )}

            {isSignedIn ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "8px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span className="header-user" style={{ lineHeight: 1.2 }}>{name}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                      color: isOfficer ? "var(--color-saffron)" : "var(--color-status-verified)",
                    }}
                  >
                    {roleLabel}
                  </span>
                </div>
                <button
                  className="header-signout"
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out of BidShield AI"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link
                  href="/sign-in"
                  className="btn btn-secondary btn-sm"
                  style={{
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  Sign In
                </Link>
                <Link href="/sign-up" className="btn btn-primary btn-sm" style={{ backgroundColor: "var(--color-saffron)", color: "#0A2E4D", fontWeight: 700 }}>
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      <div className="tricolor-strip">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </>
  );
}
