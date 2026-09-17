"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import PageHeader from "../components/PageHeader";
import Footer from "../components/Footer";
import { useUserRole } from "../lib/useUserRole";
import { listUsers, updateUserRole, createUser, deleteUser, UserAccount } from "../lib/api";

export default function ManageUsersPage() {
  const { isLoaded, isAdmin, roleLabel, user: currentUser } = useUserRole();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "procurement_officer",
  });

  const fetchUsersList = async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to load user accounts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchUsersList();

    // Silent periodic background sync every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        const fresh = await listUsers();
        setUsers(fresh);
      } catch {
        // Silent background catch
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isLoaded, isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    setMessage(null);
    try {
      await updateUserRole(userId, newRole);
      setMessage({
        type: "success",
        text: `Role successfully updated to ${formatRoleName(newRole)}. Changes will reflect upon the user's session token refresh.`,
      });
      await fetchUsersList();
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e.message || "Failed to update role. Ensure administrator privileges are verified.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const displayName = userName.toUpperCase();
    if (!confirm(`Are you sure you want to delete user account "${displayName}"? This will permanently remove their access from Clerk and the platform.`)) {
      return;
    }

    setDeletingId(userId);
    setMessage(null);
    try {
      await deleteUser(userId);
      setMessage({
        type: "success",
        text: `User account "${displayName}" was successfully deleted from the platform and Clerk.`,
      });
      await fetchUsersList();
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e.message || "Failed to delete user account. Only administrators can delete users.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      setMessage({ type: "error", text: "Please fill in all fields (Name, Email, Password)." });
      return;
    }

    const upperName = newUser.name.trim().toUpperCase();
    setSubmittingAdd(true);
    setMessage(null);
    try {
      await createUser({ ...newUser, name: upperName });
      setMessage({
        type: "success",
        text: `User account "${upperName}" successfully created with role: ${formatRoleName(newUser.role)}.`,
      });
      setShowAddModal(false);
      setNewUser({ name: "", email: "", password: "", role: "procurement_officer" });
      await fetchUsersList();
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e.message || "Failed to create user account.",
      });
    } finally {
      setSubmittingAdd(false);
    }
  };

  const formatRoleName = (r: string) => {
    switch (r) {
      case "administrator":
        return "Administrator";
      case "procurement_officer":
        return "Procurement Officer";
      case "auditor":
        return "Auditor";
      default:
        return r;
    }
  };

  const getRoleBadgeStyle = (r: string) => {
    if (r === "administrator") {
      return {
        backgroundColor: "rgba(255, 153, 51, 0.15)",
        color: "#B36200",
        border: "1px solid rgba(255, 153, 51, 0.35)",
      };
    }
    if (r === "procurement_officer") {
      return {
        backgroundColor: "var(--color-status-verified-bg)",
        color: "var(--color-status-verified)",
        border: "1px solid rgba(46, 117, 89, 0.25)",
      };
    }
    return {
      backgroundColor: "var(--color-status-pending-bg)",
      color: "var(--color-text-secondary)",
      border: "1px solid var(--color-border)",
    };
  };

  if (!isLoaded || loading) {
    return (
      <>
        <Header />
        <div className="page-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Loading user directory...</span>
          </div>
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Header />
        <div className="page-container">
          <div className="card empty-state" style={{ maxWidth: "560px", margin: "40px auto", textAlign: "center" }}>
            <h3 style={{ color: "var(--color-status-issue)", marginBottom: "8px" }}>Access Restricted</h3>
            <p className="text-secondary text-sm mb-4">
              Role management and user administration is restricted exclusively to designated system Administrators. Procurement Officers and Auditors cannot view or modify account roles. Your current account role is <strong>{roleLabel}</strong>.
            </p>
            <Link href="/tenders" className="btn btn-primary">
              &larr; Return to Tender Portal
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="page-container">
        <PageHeader
          title="User Account Management"
          breadcrumbs={[
            { label: "Tenders", href: "/tenders" },
            { label: "User Management" },
          ]}
          action={
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(!showAddModal)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                {showAddModal ? "Cancel" : "Add User"}
              </button>
            </div>
          }
        />

        {message && (
          <div
            className={`card mb-4 ${message.type === "error" ? "form-error" : ""}`}
            style={
              message.type === "success"
                ? {
                    backgroundColor: "var(--color-status-verified-bg)",
                    borderColor: "var(--color-status-verified)",
                    color: "var(--color-status-verified)",
                    padding: "12px 16px",
                    fontWeight: 500,
                  }
                : {}
            }
            role="status"
          >
            {message.text}
          </div>
        )}

        {/* Add User Modal / Card */}
        {showAddModal && (
          <div className="card mb-4" style={{ border: "2px solid var(--color-navy-900)", backgroundColor: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "15px", color: "var(--color-navy-900)", margin: 0 }}>
                Add New User Account (Administrator Only)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--color-text-secondary)" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "12px" }}>Full Name * (Stored in Uppercase)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. PRIYA SHARMA"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "12px" }}>Official Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. p.sharma@gov.in"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "12px" }}>Password * (min 8 chars)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Temporary password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "12px" }}>Assigned Role *</label>
                  <select
                    className="form-select"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="procurement_officer">Procurement Officer</option>
                    <option value="auditor">Auditor</option>
                    <option value="administrator">Administrator</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingAdd}
                >
                  {submittingAdd ? "Creating in Clerk..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        )}

        {users.length === 0 ? (
          <div className="card empty-state">
            <p>No user accounts recorded in the system yet.</p>
            <p className="text-secondary text-sm">
              Click &quot;Add User&quot; above to create an account.
            </p>
          </div>
        ) : (
          <div className="user-mgmt-card">
            {/* Desktop Table */}
            <div className="user-mgmt-table-wrapper">
              <table className="user-mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: "24%" }}>Name</th>
                    <th style={{ width: "26%" }}>Official Email</th>
                    <th style={{ width: "18%" }}>Current Role</th>
                    <th style={{ width: "12%" }}>Registered</th>
                    <th style={{ width: "12%" }}>Assign Role</th>
                    <th style={{ width: "8%", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    const displayName = (u.name || "OFFICER").toUpperCase();
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="user-mgmt-name">
                            <span>{displayName}</span>
                            {isSelf && <span className="user-mgmt-self-tag">YOU</span>}
                          </div>
                        </td>
                        <td>
                          <span className="user-mgmt-email">{u.email}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "var(--radius)",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              ...getRoleBadgeStyle(u.role),
                            }}
                          >
                            {formatRoleName(u.role)}
                          </span>
                        </td>
                        <td>
                          <span className="user-mgmt-date">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN") : "--"}
                          </span>
                        </td>
                        <td>
                          <select
                            className="user-mgmt-select"
                            value={u.role}
                            disabled={updatingId === u.id || deletingId === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="procurement_officer">Procurement Officer</option>
                            <option value="auditor">Auditor</option>
                            <option value="administrator">Administrator</option>
                          </select>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isSelf ? (
                            <span className="user-mgmt-active-admin">
                              Active Admin
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(u.id, displayName)}
                              disabled={deletingId === u.id || updatingId === u.id}
                              className="user-mgmt-del-btn"
                              title="Delete user from platform and Clerk"
                            >
                              {deletingId === u.id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="stacked-cards-mobile">
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                const displayName = (u.name || "OFFICER").toUpperCase();
                return (
                  <div className="stacked-card" key={u.id}>
                    <div className="stacked-card-row">
                      <span className="stacked-card-label">Name</span>
                      <span className="stacked-card-value font-semibold">
                        {displayName} {isSelf && <span style={{ color: "#B36200", fontSize: "11px", fontWeight: 700 }}>(YOU)</span>}
                      </span>
                    </div>
                    <div className="stacked-card-row">
                      <span className="stacked-card-label">Email</span>
                      <span className="stacked-card-value mono text-sm">{u.email}</span>
                    </div>
                    <div className="stacked-card-row">
                      <span className="stacked-card-label">Current Role</span>
                      <span className="stacked-card-value">
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 6px",
                            borderRadius: "var(--radius)",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            ...getRoleBadgeStyle(u.role),
                          }}
                        >
                          {formatRoleName(u.role)}
                        </span>
                      </span>
                    </div>
                    <div className="stacked-card-row">
                      <span className="stacked-card-label">Registered</span>
                      <span className="stacked-card-value text-sm text-secondary">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN") : "--"}
                      </span>
                    </div>
                    <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
                      <label className="form-label" style={{ fontSize: "11.5px", marginBottom: "4px" }}>
                        Assign Role:
                      </label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <select
                          className="form-select"
                          value={u.role}
                          disabled={updatingId === u.id || deletingId === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{ flex: 1 }}
                        >
                          <option value="procurement_officer">Procurement Officer</option>
                          <option value="auditor">Auditor</option>
                          <option value="administrator">Administrator</option>
                        </select>
                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(u.id, displayName)}
                            disabled={deletingId === u.id || updatingId === u.id}
                            className="btn"
                            style={{
                              padding: "6px 10px",
                              fontSize: "12px",
                              backgroundColor: "rgba(220, 38, 38, 0.08)",
                              color: "#b91c1c",
                              border: "1px solid rgba(220, 38, 38, 0.25)",
                            }}
                          >
                            {deletingId === u.id ? "..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
