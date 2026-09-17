const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let currentAuthToken: string | null = null;
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
}

export function setTokenGetter(getter: (() => Promise<string | null>) | null) {
  tokenGetter = getter;
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Always acquire fresh token from Clerk if getter available
  let token = currentAuthToken;
  if (tokenGetter) {
    try {
      const fresh = await tokenGetter();
      if (fresh) {
        token = fresh;
        currentAuthToken = fresh;
      }
    } catch (err) {
      console.warn("Error acquiring fresh token:", err);
    }
  }

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // If token expired, attempt one retry with a forced fresh token
  if (res.status === 401 && !isRetry && tokenGetter) {
    try {
      const refreshed = await tokenGetter();
      if (refreshed) {
        currentAuthToken = refreshed;
        return request<T>(path, options, true);
      }
    } catch {
      // Continue to error throw below
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}


// --- Tenders ---

export async function createTender(data: {
  title: string;
  uploaded_text?: string;
}) {
  return request("/tenders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listTenders() {
  return request<any[]>("/tenders");
}

export async function getTender(id: string) {
  return request<any>(`/tenders/${id}`);
}

export async function extractRules(tenderId: string) {
  return request<any>(`/tenders/${tenderId}/extract-rules`, {
    method: "POST",
  });
}

export async function getRules(tenderId: string) {
  return request<any[]>(`/tenders/${tenderId}/rules`);
}

export async function updateRules(
  tenderId: string,
  rules: any[],
  approve: boolean
) {
  return request<any>(`/tenders/${tenderId}/rules`, {
    method: "PATCH",
    body: JSON.stringify({ rules, approve }),
  });
}

// --- Bidders ---

export async function createBidder(tenderId: string, name: string) {
  return request<any>(`/tenders/${tenderId}/bidders`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function listBidders(tenderId: string) {
  return request<any[]>(`/tenders/${tenderId}/bidders`);
}

// --- Documents ---

export async function uploadDocument(
  bidderId: string,
  file: File,
  documentType: string
) {
  const url = `${API_URL}/bidders/${bidderId}/documents`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);

  const headers: Record<string, string> = {};
  if (currentAuthToken) {
    headers["Authorization"] = `Bearer ${currentAuthToken}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Upload error: ${res.status}`);
  }

  return res.json();
}

export async function listDocuments(bidderId: string) {
  return request<any[]>(`/bidders/${bidderId}/documents`);
}

// --- Verification ---

export async function runVerification(bidderId: string) {
  return request<any>(`/bidders/${bidderId}/verify`, {
    method: "POST",
  });
}

// --- Dashboard ---

export async function getDashboard(
  tenderId: string,
  filters?: { bidder?: string; status?: string }
) {
  let path = `/tenders/${tenderId}/dashboard`;
  const params = new URLSearchParams();
  if (filters?.bidder) params.set("bidder_filter", filters.bidder);
  if (filters?.status) params.set("status_filter", filters.status);
  const qs = params.toString();
  if (qs) path += `?${qs}`;

  return request<any>(path);
}

// --- Findings ---

export async function getFinding(findingId: string) {
  return request<any>(`/findings/${findingId}`);
}

export async function takeAction(
  findingId: string,
  action: string,
  officerName: string,
  note?: string
) {
  return request<any>(`/findings/${findingId}/action`, {
    method: "PATCH",
    body: JSON.stringify({
      action,
      officer_name: officerName,
      note: note || null,
    }),
  });
}

export async function reopenFinding(findingId: string) {
  return request<any>(`/findings/${findingId}/reopen`, {
    method: "PATCH",
  });
}

// --- Audit ---

export async function getAuditLog(tenderId: string) {
  return request<any[]>(`/tenders/${tenderId}/audit`);
}

// --- User Management (Admin Only) ---

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: "procurement_officer" | "auditor" | "administrator";
  created_at: string;
  updated_at: string;
}

export async function listUsers(): Promise<UserAccount[]> {
  return request<UserAccount[]>("/users");
}

export async function updateUserRole(userId: string, role: string) {
  return request<any>(`/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  return request<any>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string) {
  return request<any>(`/users/${userId}`, {
    method: "DELETE",
  });
}


