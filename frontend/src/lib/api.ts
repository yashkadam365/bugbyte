import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
});

// ─── Cases ──────────────────────────────────────────
export const createCase = (data: { title: string; description: string; tags?: string[] }) =>
    api.post("/api/cases", data).then((r) => r.data);

export const listCases = () => api.get("/api/cases").then((r) => r.data);

export const getCase = (id: string) => api.get(`/api/cases/${id}`).then((r) => r.data);

export const updateCase = (id: string, data: Record<string, unknown>) =>
    api.put(`/api/cases/${id}`, data).then((r) => r.data);

export const deleteCase = (id: string) => api.delete(`/api/cases/${id}`).then((r) => r.data);

// ─── Evidence ───────────────────────────────────────
export const uploadEvidence = (caseId: string, formData: FormData) =>
    api
        .post(`/api/cases/${caseId}/evidence`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);

export const listEvidence = (caseId: string) =>
    api.get(`/api/cases/${caseId}/evidence`).then((r) => r.data);

export const getEvidence = (id: string) => api.get(`/api/evidence/${id}`).then((r) => r.data);

export const deleteEvidence = (id: string) =>
    api.delete(`/api/evidence/${id}`).then((r) => r.data);

// ─── Claims ─────────────────────────────────────────
export const listClaims = (caseId: string) =>
    api.get(`/api/cases/${caseId}/claims`).then((r) => r.data);

export const getClaimsForEvidence = (evidenceId: string) =>
    api.get(`/api/evidence/${evidenceId}/claims`).then((r) => r.data);

// ─── Entities ───────────────────────────────────────
export const listEntities = (caseId: string) =>
    api.get(`/api/cases/${caseId}/entities`).then((r) => r.data);

// ─── Relationships ──────────────────────────────────
export const listRelationships = (caseId: string) =>
    api.get(`/api/cases/${caseId}/relationships`).then((r) => r.data);

// ─── Timeline ───────────────────────────────────────
export const listTimelineEvents = (caseId: string) =>
    api.get(`/api/cases/${caseId}/timeline`).then((r) => r.data);

// ─── Investigation Health ───────────────────────────
export const getInvestigationHealth = (caseId: string) =>
    api.get(`/api/cases/${caseId}/health`).then((r) => r.data);

export default api;
