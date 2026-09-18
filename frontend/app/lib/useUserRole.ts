"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setAuthToken, setTokenGetter } from "./api";

export type UserRole = "procurement_officer" | "auditor" | "administrator" | "bidder";

export const OFFICER_ROLES = ["procurement_officer", "auditor", "administrator", "officer"];

export function useUserRole() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const pathname = usePathname() || "";

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
      hasOfficerPrivilege: false,
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
      hasOfficerPrivilege: false,
    };
  }

  // Read assigned privileges from user publicMetadata
  const roleRaw = ((user.publicMetadata?.role as string) || "bidder").toLowerCase();
  const hasOfficerPrivilege = OFFICER_ROLES.includes(roleRaw);

  // Portal Context Determination based on route
  const isBidderContext = pathname.startsWith("/bidder");
  const isOfficerContext = pathname.startsWith("/officer");

  let isOfficer = false;
  let isBidder = false;
  let role: UserRole = "bidder";

  if (isBidderContext) {
    // Inside Bidder Portal, user is strictly Bidder / Supplier
    isBidder = true;
    isOfficer = false;
    role = "bidder";
  } else if (isOfficerContext) {
    // Inside Officer Portal, user is Procurement Officer
    isOfficer = true;
    isBidder = false;
    role = "procurement_officer";
  } else {
    // On shared/public routes, follow assigned privileges
    if (hasOfficerPrivilege) {
      isOfficer = true;
      isBidder = false;
      role = "procurement_officer";
    } else {
      isBidder = true;
      isOfficer = false;
      role = "bidder";
    }
  }

  const canWrite = isOfficer;

  const roleLabels: Record<string, string> = {
    procurement_officer: "Procurement Officer",
    auditor: "Procurement Auditor",
    administrator: "System Administrator",
    officer: "Procurement Officer",
    bidder: "Bidder / Supplier",
  };

  const displayName = (
    user.fullName ||
    user.firstName ||
    user.username ||
    (isOfficer ? "Procurement Officer" : "Apex Data Systems")
  ).toUpperCase();

  return {
    isLoaded: true,
    isSignedIn: true,
    user,
    name: displayName,
    email: user.primaryEmailAddress?.emailAddress || "",
    role,
    roleLabel: roleLabels[role] || (isOfficer ? "Procurement Officer" : "Bidder / Supplier"),
    isOfficer,
    isBidder,
    canWrite,
    hasOfficerPrivilege,
  };
}
