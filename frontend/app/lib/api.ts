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

  // Acquire fresh token if getter available
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

  // Retry on 401
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


// ==========================================
// TENDERS API
// ==========================================

export async function createTender(data: {
  title: string;
  description?: string;
  organization?: string;
  category?: string;
  deadline?: string;
  uploaded_text?: string;
}) {
  return request<any>("/tenders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadTenderPdf(file: File) {
  const url = `${API_URL}/tenders/upload-pdf`;
  const formData = new FormData();
  formData.append("file", file);

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

export async function importGemTender(sampleId: string = "CPCL_MECH_01") {
  return request<any>(`/tenders/import-gem?sample_id=${encodeURIComponent(sampleId)}`, {
    method: "POST",
  });
}

export async function listTenders(status?: string) {
  const path = status ? `/tenders?status=${encodeURIComponent(status)}` : "/tenders";
  return request<any[]>(path);
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
  approve: boolean = false
) {
  return request<any>(`/tenders/${tenderId}/rules`, {
    method: "PATCH",
    body: JSON.stringify({ rules, approve }),
  });
}

export async function publishTender(tenderId: string) {
  return request<any>(`/tenders/${tenderId}/publish`, {
    method: "POST",
  });
}

export async function updateTenderStatus(tenderId: string, status: string) {
  return request<any>(`/tenders/${tenderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}


// ==========================================
// BIDDER SUBMISSIONS & BIDS API
// ==========================================

export async function submitBidApplication(
  tenderId: string,
  data: {
    company_name: string;
    legal_name?: string;
    pan?: string;
    gstin?: string;
    contact_email: string;
    contact_phone?: string;
  },
  documents: { file: File; documentType: string }[]
) {
  const url = `${API_URL}/tenders/${tenderId}/apply`;
  const formData = new FormData();
  formData.append("company_name", data.company_name);
  if (data.legal_name) formData.append("legal_name", data.legal_name);
  if (data.pan) formData.append("pan", data.pan);
  if (data.gstin) formData.append("gstin", data.gstin);
  formData.append("contact_email", data.contact_email);
  if (data.contact_phone) formData.append("contact_phone", data.contact_phone);

  documents.forEach((d) => {
    formData.append("files", d.file);
    formData.append("document_types", d.documentType);
  });

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
    throw new Error(error.detail || `Bid submission failed: ${res.status}`);
  }

  return res.json();
}

export async function getBidderSubmissions() {
  return request<any[]>("/bidder/submissions");
}

export async function getBidderSubmissionDetail(bidId: string) {
  return request<any>(`/bidder/submissions/${bidId}`);
}

export async function listSubmittedBids(tenderId: string) {
  return request<any[]>(`/tenders/${tenderId}/bids`);
}

export async function getBidDetail(bidId: string) {
  return request<any>(`/bids/${bidId}`);
}

export async function reverifyBid(bidId: string) {
  return request<any>(`/bids/${bidId}/reverify`, {
    method: "POST",
  });
}

export async function setBidDecision(
  bidId: string,
  decision: "qualified" | "not_qualified",
  officerName: string,
  note: string
) {
  return request<any>(`/bids/${bidId}/decision`, {
    method: "PATCH",
    body: JSON.stringify({
      decision,
      officer_name: officerName,
      note,
    }),
  });
}


// ==========================================
// DOCUMENTS API
// ==========================================

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


// ==========================================
// FINDINGS & EVIDENCE API
// ==========================================

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


// ==========================================
// DASHBOARD & AUDIT API
// ==========================================

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

export async function getAuditLog(tenderId?: string) {
  if (tenderId) {
    return request<any[]>(`/tenders/${tenderId}/audit`);
  }
  return request<any[]>("/officer/audit");
}

export async function getGlobalAuditLog() {
  return request<any[]>("/officer/audit");
}
