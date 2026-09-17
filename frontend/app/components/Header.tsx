"use client";

import { useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useUserRole } from "../lib/useUserRole";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const { isSignedIn, name, roleLabel, isAdmin, role } = useUserRole();

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
            <Link
              href="/tenders"
              style={{ color: "#ffffff", textDecoration: "none", fontSize: "13px", fontWeight: 500 }}
            >
              Tenders
            </Link>

            {/* Administrator Only Nav Link */}
            {isAdmin && (
              <Link
                href="/manage-users"
                style={{
                  color: "var(--color-saffron)",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>Manage Users</span>
              </Link>
            )}

            {isSignedIn ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span className="header-user" style={{ lineHeight: 1.2 }}>{name?.toUpperCase()}</span>
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                      color: role === "administrator" ? "var(--color-saffron)" : role === "auditor" ? "#cbd5e1" : "var(--color-status-verified)",
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
                <Link href="/sign-in" className="btn btn-secondary btn-sm" style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.3)" }}>
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
