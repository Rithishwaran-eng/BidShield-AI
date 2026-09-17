"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setAuthToken, setTokenGetter } from "./api";

export type UserRole = "procurement_officer" | "auditor" | "administrator";

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
      isAuditor: false,
      isAdmin: false,
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
      isAuditor: false,
      isAdmin: false,
      canWrite: false,
    };
  }

  // Read verified role from user publicMetadata (or session claims)
  const roleRaw = (user.publicMetadata?.role as string) || "procurement_officer";
  const role: UserRole =
    roleRaw === "administrator" || roleRaw === "auditor" || roleRaw === "procurement_officer"
      ? roleRaw
      : "auditor";

  const isOfficer = role === "procurement_officer" || role === "administrator";
  const isAuditor = role === "auditor";
  const isAdmin = role === "administrator";
  const canWrite = isOfficer;

  const roleLabels: Record<UserRole, string> = {
    procurement_officer: "Procurement Officer",
    auditor: "Auditor",
    administrator: "Administrator",
  };

  return {
    isLoaded: true,
    isSignedIn: true,
    user,
    name: (user.fullName || user.firstName || user.username || "Officer").toUpperCase(),
    email: user.primaryEmailAddress?.emailAddress || "",
    role,
    roleLabel: roleLabels[role] || "Procurement Officer",
    isOfficer,
    isAuditor,
    isAdmin,
    canWrite,
  };
}
