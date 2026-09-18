"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setAuthToken, setTokenGetter } from "./api";

export type UserRole = "procurement_officer" | "auditor" | "administrator" | "bidder";

export const OFFICER_ROLES = ["procurement_officer", "auditor", "administrator", "officer"];

export function useUserRole() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { getToken, isLoaded: authLoaded } = useAuth();

  // Connect dynamic Clerk token getter to api.ts fetch client
  useEffect(() => {
    if (isSignedIn) {
      setTokenGetter(getToken);
      getToken().then((token) => setAuthToken(token)).catch(() => {});
    } else {
      setTokenGetter(null);
      setAuthToken(null);
    }
  }, [isSignedIn, getToken]);

  if (!userLoaded || !authLoaded) {
    return {
      isLoaded: false,
      isSignedIn: false,
      user: null,
      role: null as UserRole | null,
      roleLabel: "Loading...",
      isOfficer: false,
      isBidder: false,
      canWrite: false,
    };
  }

  if (!isSignedIn || !user) {
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
      role: null as UserRole | null,
      roleLabel: "Signed Out",
      isOfficer: false,
      isBidder: false,
      canWrite: false,
    };
  }

  // Read verified role from user publicMetadata
  const roleRaw = ((user.publicMetadata?.role as string) || "bidder").toLowerCase();
  const isOfficer = OFFICER_ROLES.includes(roleRaw);
  const role: UserRole = isOfficer ? "procurement_officer" : "bidder";

  const isBidder = !isOfficer;
  const canWrite = isOfficer;

  const roleLabels: Record<string, string> = {
    procurement_officer: "Procurement Officer",
    auditor: "Procurement Auditor",
    administrator: "System Administrator",
    officer: "Procurement Officer",
    bidder: "Bidder / Supplier",
  };

  return {
    isLoaded: true,
    isSignedIn: true,
    user,
    name: (user.fullName || user.firstName || user.username || (isOfficer ? "Procurement Officer" : "Bidder")).toUpperCase(),
    email: user.primaryEmailAddress?.emailAddress || "",
    role,
    roleLabel: roleLabels[role] || "Bidder / Supplier",
    isOfficer,
    isBidder,
    canWrite,
  };
}
